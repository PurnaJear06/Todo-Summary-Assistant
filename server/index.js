require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI client initialization (using OpenRouter compatibility)
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://todo-summary-assistant.example.com',
    'X-Title': 'Todo Summary Assistant'
  }
});

// In-memory fallback for todos in case of DB connection issues
let todos = [
  { id: '1', text: 'Complete React frontend', completed: true },
  { id: '2', text: 'Implement Express backend', completed: false },
  { id: '3', text: 'Connect to Supabase', completed: false },
  { id: '4', text: 'Integrate with DeepSeek AI', completed: false },
  { id: '5', text: 'Set up Slack integration', completed: false },
];

// Database initialization
async function initializeDatabase() {
  try {
    // Check if todos table exists, if not create it
    const { error } = await supabase
      .from('todos')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Creating todos table...');
      const { error: createError } = await supabase.rpc('create_todos_table');
      if (createError) {
        console.error('Error creating todos table:', createError);
      } else {
        console.log('Todos table created successfully');
      }
    } else {
      console.log('Connected to Supabase successfully');
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    console.log('Using in-memory todos as fallback');
  }
}

// Initialize the database
initializeDatabase().catch(console.error);

// Log environment variables (redacting sensitive info)
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Not set');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set');
console.log('SLACK_WEBHOOK_URL:', process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set');

// Validate critical environment variables
let missingVars = [];
if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
if (!process.env.SUPABASE_KEY) missingVars.push('SUPABASE_KEY');
if (!process.env.OPENROUTER_API_KEY) missingVars.push('OPENROUTER_API_KEY');
if (!process.env.SLACK_WEBHOOK_URL) missingVars.push('SLACK_WEBHOOK_URL');

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}. Some features may not work properly.`);
} else {
  console.log('✅ All required environment variables are set.');
}

// Validate Slack webhook URL format
if (process.env.SLACK_WEBHOOK_URL && !process.env.SLACK_WEBHOOK_URL.startsWith('https://hooks.slack.com/')) {
  console.warn('⚠️ SLACK_WEBHOOK_URL does not appear to be a valid Slack webhook URL. It should start with https://hooks.slack.com/');
}

// Verify Supabase connection
async function verifySupabaseConnection() {
  try {
    console.log('Attempting to verify Supabase connection...');
    
    // Validate URL format first
    if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
      console.error('Invalid Supabase URL format. URL should start with https://');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase connection verification error:', error);
      } else {
        console.log('Supabase connection verified successfully');
      }
    } catch (connectionError) {
      console.error('Supabase connection attempt failed:', connectionError.message);
      console.log('Will continue with in-memory todos as fallback');
    }
  } catch (err) {
    console.error('Failed to verify Supabase connection:', err);
  }
}

verifySupabaseConnection();

// ROUTES

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    console.log('GET /todos - Fetching todos from Supabase');
    
    // Try to get todos from Supabase
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos from Supabase:', error);
      // Fall back to in-memory todos if DB has issues
      console.log('Returning in-memory todos as fallback');
      return res.json(todos);
    }

    console.log(`Successfully fetched ${data.length} todos from Supabase`);
    return res.json(data.length > 0 ? data : todos);
  } catch (err) {
    console.error('Error in GET /todos:', err);
    // Fall back to in-memory todos
    console.log('Returning in-memory todos due to error');
    return res.json(todos);
  }
});

// Add a new todo
app.post('/todos', async (req, res) => {
  try {
    console.log('POST /todos - Adding new todo');
    const { text, title, description } = req.body;
    
    // Allow either text or title to be provided
    const todoText = text || title || "";
    
    if (!todoText) {
      return res.status(400).json({ error: 'Text or title is required' });
    }

    // Generate a UUID for the todo
    const id = Date.now().toString();
    console.log(`Created todo with ID: ${id}`);

    const newTodo = {
      id,
      text: todoText,
      title: todoText,
      description: description || "",
      completed: false,
      created_at: new Date().toISOString()
    };

    console.log('Attempting to insert todo into Supabase');
    // Try to insert into Supabase
    const { data, error } = await supabase
      .from('todos')
      .insert([newTodo])
      .select();

    if (error) {
      console.error('Error adding todo to Supabase:', error);
      // Fall back to in-memory
      console.log('Adding to in-memory todos as fallback');
      todos.push(newTodo);
      return res.status(201).json(newTodo);
    }

    console.log('Todo successfully added to Supabase');
    return res.status(201).json(data[0] || newTodo);
  } catch (err) {
    console.error('Error in POST /todos:', err);
    // Fall back to in-memory
    const todoText = req.body.text || req.body.title || "";
    const newTodo = {
      id: Date.now().toString(),
      text: todoText,
      title: todoText,
      description: req.body.description || "",
      completed: false,
      created_at: new Date().toISOString()
    };
    console.log('Adding to in-memory todos due to error');
    todos.push(newTodo);
    return res.status(201).json(newTodo);
  }
});

// Update a todo
app.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, title, completed, description } = req.body;

    // Create update object
    const updateData = {};
    
    // If title is provided, update both title and text for consistency
    if (title !== undefined) {
      updateData.title = title;
      updateData.text = title;
    } else if (text !== undefined) {
      updateData.text = text;
      updateData.title = text;
    }
    
    if (completed !== undefined) {
      updateData.completed = completed;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }

    // Try to update in Supabase
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating todo in Supabase:', error);
      // Fall back to in-memory
      todos = todos.map(todo => 
        todo.id === id ? { ...todo, ...updateData } : todo
      );
      const updatedTodo = todos.find(todo => todo.id === id);
      return res.json(updatedTodo);
    }

    return res.json(data[0]);
  } catch (err) {
    console.error('Error in PUT /todos/:id:', err);
    // Fall back to in-memory
    todos = todos.map(todo => 
      todo.id === req.params.id ? { ...todo, ...req.body } : todo
    );
    const updatedTodo = todos.find(todo => todo.id === req.params.id);
    return res.json(updatedTodo);
  }
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to delete from Supabase
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo from Supabase:', error);
      // Fall back to in-memory
      todos = todos.filter(todo => todo.id !== id);
      return res.status(200).json({ message: 'Todo deleted successfully' });
    }

    return res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /todos/:id:', err);
    // Fall back to in-memory
    todos = todos.filter(todo => todo.id !== req.params.id);
    return res.status(200).json({ message: 'Todo deleted successfully' });
  }
});

// Summarize todos and send to Slack
app.post('/summarize', async (req, res) => {
  try {
    console.log('POST /summarize - Generating summary and sending to Slack');
    
    // Use in-memory todos for now
    console.log('Using in-memory todos for summary');
    const todosList = todos;
    console.log('All todos in memory:', JSON.stringify(todosList));
    
    // Check for todos where completed is explicitly false
    const pendingTodos = todosList.filter(todo => todo.completed !== true);
    
    console.log('Pending todos:', JSON.stringify(pendingTodos));
    
    if (pendingTodos.length === 0) {
      console.log('No pending todos to summarize');
      return res.status(400).json({ error: 'No pending todos to summarize' });
    }

    console.log(`Found ${pendingTodos.length} pending todos to summarize`);
    
    // Format todos for the LLM
    const todoText = pendingTodos.map(todo => `- ${todo.title || todo.text}`).join('\n');
    console.log('Todo text to summarize:', todoText);

    try {
      // Generate summary using LLM (DeepSeek via OpenRouter)
      console.log('Calling DeepSeek AI for summary generation');
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes todo lists in a concise, organized, and actionable way. Group related items when possible, prioritize tasks, and keep the summary brief but complete."
          },
          {
            role: "user",
            content: `Please summarize this todo list:\n\n${todoText}`
          }
        ]
      });

      const summary = completion.choices[0].message.content;
      console.log('Successfully generated summary:', summary);

      // Send to Slack
      console.log('Preparing to send summary to Slack');
      const slackPayload = {
        text: "*Todo Summary*",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📋 Todo Summary",
              emoji: true
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: summary
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Pending Tasks:* ${pendingTodos.length} | Generated on ${new Date().toLocaleString()}`
              }
            ]
          }
        ]
      };

      try {
        // Post to Slack webhook
        console.log('Sending to Slack webhook:', process.env.SLACK_WEBHOOK_URL);
        const slackResponse = await axios.post(process.env.SLACK_WEBHOOK_URL, slackPayload);
        console.log('Successfully sent to Slack, status:', slackResponse.status);
        
        res.status(200).json({ 
          message: 'Summary generated and sent to Slack successfully',
          summary 
        });
      } catch (slackError) {
        console.error('Error sending to Slack:', slackError);
        // Return summary even if Slack sending fails
        res.status(200).json({ 
          message: 'Summary generated but failed to send to Slack',
          summary,
          slackError: slackError.message
        });
      }
    } catch (aiError) {
      console.error('Error generating summary with AI:', aiError);
      res.status(500).json({ error: 'Failed to generate summary with AI', details: aiError.message });
    }
  } catch (err) {
    console.error('Error in POST /summarize:', err);
    res.status(500).json({ error: 'Failed to generate or send summary', details: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});