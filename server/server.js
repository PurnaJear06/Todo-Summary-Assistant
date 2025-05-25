const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const axios = require('axios');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Hardcoded config values as fallbacks
const API_CONFIG = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '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',
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://bmkcfikfensvztpkqhnf.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJta2NmaWtmZW5zdnp0cGtxaG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTM4MzUsImV4cCI6MjA2MzM4OTgzNX0.NPV5ERVSDB6ke1k1JmAI-hQ5aPHNzM7r6MGNVGJX9cU',
};

// CORS configuration to allow frontend connections
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Debug information
console.log('Server initializing with the following configuration:');
console.log(`- Port: ${PORT}`);
console.log(`- OpenRouter API Key: ${API_CONFIG.OPENROUTER_API_KEY ? 'Set (using it directly)' : 'Not set'}`);
console.log(`- Slack Webhook URL: ${API_CONFIG.SLACK_WEBHOOK_URL ? 'Set (using it directly)' : 'Not set'}`);
console.log(`- Supabase URL: ${API_CONFIG.SUPABASE_URL ? 'Set (using it directly)' : 'Not set'}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Database connection
const pool = new Pool({
  connectionString: `postgresql://postgres:postgres@${API_CONFIG.SUPABASE_URL.replace('https://', '')}:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

// Initialize OpenAI client for DeepSeek
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: API_CONFIG.OPENROUTER_API_KEY,
});

// ROUTES - Ensure these match exactly what the client is expecting

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    console.log('Fetching all todos...');
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Add a new todo
app.post('/todos', async (req, res) => {
  const { title, description } = req.body;
  
  console.log('Adding new todo:', { title, description });
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO todos (title, description, completed) VALUES ($1, $2, $3) RETURNING *',
      [title, description || '', false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log(`Deleting todo with ID: ${id}`);
  
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Update a todo
app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  
  console.log(`Updating todo with ID: ${id}`, { title, description, completed });
  
  try {
    const result = await pool.query(
      'UPDATE todos SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
      [title, description, completed, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Summarize todos and send to Slack
app.post('/summarize', async (req, res) => {
  try {
    console.log('Generating summary for todos...');
    // Get all incomplete todos
    const result = await pool.query('SELECT * FROM todos WHERE completed = FALSE');
    const todos = result.rows;
    
    if (todos.length === 0) {
      return res.status(200).json({ message: 'No pending todos to summarize' });
    }
    
    console.log(`Found ${todos.length} pending todos to summarize`);
    
    // Format todos for the AI
    const todoText = todos.map(todo => 
      `- ${todo.title}${todo.description ? `: ${todo.description}` : ''}`
    ).join('\n');
    
    // Get summary from DeepSeek
    console.log('Calling AI service for summary...');
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "user",
          content: `Please summarize the following todo list, grouping them by theme or priority if possible. Add a 1-2 sentence introduction and conclusion: \n\n${todoText}`
        }
      ],
      extra_headers: {
        "HTTP-Referer": "todo-summary-assistant.example.com",
        "X-Title": "Todo Summary Assistant",
      },
    });
    
    const summary = completion.choices[0].message.content;
    console.log('AI summary generated successfully');
    
    // Send to Slack
    console.log('Sending summary to Slack...');
    await axios.post(API_CONFIG.SLACK_WEBHOOK_URL, {
      text: `*Todo Summary*\n\n${summary}`
    });
    
    console.log('Summary sent to Slack successfully');
    res.json({ success: true, message: 'Summary sent to Slack', summary });
  } catch (error) {
    console.error('Error summarizing todos:', error);
    res.status(500).json({ error: 'Failed to summarize todos and send to Slack', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is ready to accept connections from the frontend`);
}); 