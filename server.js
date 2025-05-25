const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration - using environment variables with fallbacks for development
const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
};

// CORS setup for frontend integration
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

// Express middleware setup
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    message: 'Todo Summary Assistant API is running',
    timestamp: new Date().toISOString()
  });
});

// In-memory storage for todos (replace with database in production)
let todoItems = [
  {
    id: 1,
    title: 'Complete the Todo Summary Assistant project',
    description: 'Implement all features including todo management, AI summary, and Slack integration.',
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Add proper error handling',
    description: 'Ensure all error cases are properly handled in the UI.',
    completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Test the application thoroughly',
    description: 'Verify that all features work as expected.',
    completed: false,
    created_at: new Date().toISOString()
  }
];

// Helper function to get next available ID
function getNextTodoId() {
  return todoItems.length > 0 ? Math.max(...todoItems.map(t => t.id)) + 1 : 1;
}

// GET /todos - Retrieve all todo items
app.get('/todos', (req, res) => {
  try {
    res.json(todoItems);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to retrieve todos' });
  }
});

// POST /todos - Create a new todo item
app.post('/todos', (req, res) => {
  const { title, description } = req.body;
  
  // Validate required fields
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Todo title is required' });
  }
  
  try {
    const newTodo = {
      id: getNextTodoId(),
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: false,
      created_at: new Date().toISOString()
    };
    
    todoItems.push(newTodo);
    console.log(`New todo created: ${newTodo.title}`);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// DELETE /todos/:id - Remove a todo item
app.delete('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  
  if (isNaN(todoId)) {
    return res.status(400).json({ error: 'Invalid todo ID' });
  }
  
  try {
    const todoIndex = todoItems.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const deletedTodo = todoItems.splice(todoIndex, 1)[0];
    console.log(`Todo deleted: ${deletedTodo.title}`);
    res.json({ message: 'Todo deleted successfully', deletedTodo });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// PUT /todos/:id - Update an existing todo
app.put('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const { title, description, completed } = req.body;
  
  if (isNaN(todoId)) {
    return res.status(400).json({ error: 'Invalid todo ID' });
  }
  
  try {
    const todoIndex = todoItems.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Update only provided fields
    const currentTodo = todoItems[todoIndex];
    todoItems[todoIndex] = {
      ...currentTodo,
      title: title !== undefined ? title.trim() : currentTodo.title,
      description: description !== undefined ? description.trim() : currentTodo.description,
      completed: completed !== undefined ? completed : currentTodo.completed
    };
    
    console.log(`Todo updated: ${todoItems[todoIndex].title}`);
    res.json(todoItems[todoIndex]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// POST /summarize - Generate AI summary and send to Slack
app.post('/summarize', async (req, res) => {
  console.log('Starting todo summarization process...');
  
  try {
    // Find all incomplete todos
    const pendingTodos = todoItems.filter(todo => !todo.completed);
    console.log(`Found ${pendingTodos.length} pending todos for summarization`);
    
    if (pendingTodos.length === 0) {
      return res.status(200).json({ 
        message: 'No pending todos to summarize',
        success: true 
      });
    }
    
    // Prepare todo list for AI processing
    const todosList = pendingTodos.map(todo => 
      `• ${todo.title}${todo.description ? ` - ${todo.description}` : ''}`
    ).join('\n');
    
    console.log('Prepared todos for AI:', todosList);
    
    // Call OpenRouter API using DeepSeek model
    let aiSummary = '';
    try {
      console.log('Requesting AI summary from DeepSeek...');
      
      const aiResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            {
              role: "user",
              content: `Please create a concise summary of the following todo list. Group related tasks if possible and provide a brief overview:\n\n${todosList}`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'HTTP-Referer': 'todo-summary-assistant.example.com',
            'X-Title': 'Todo Summary Assistant'
          }
        }
      );
      
      aiSummary = aiResponse.data.choices[0].message.content;
      console.log('AI summary generated successfully');
    } catch (aiError) {
      console.error('AI API error:', aiError.message);
      // Fallback to manual summary if AI fails
      aiSummary = `📋 **Todo Summary**\n\nYou currently have ${pendingTodos.length} pending task(s):\n\n${todosList}\n\n💡 Focus on completing these tasks to stay productive!`;
      console.log('Using fallback summary due to AI error');
    }
    
    // Send summary to Slack
    let slackDelivered = false;
    let slackError = null;
    
    try {
      console.log('Sending summary to Slack...');
      
      const slackPayload = {
        text: `🤖 **Todo Summary Generated**\n\n${aiSummary}`
      };
      
      const slackResponse = await axios.post(config.slackWebhookUrl, slackPayload);
      
      if (slackResponse.status === 200) {
        slackDelivered = true;
        console.log('Summary successfully delivered to Slack');
      }
    } catch (error) {
      console.error('Slack delivery failed:', error.message);
      slackError = error.message;
    }
    
    // Return response to client
    const responseData = {
      success: true,
      message: slackDelivered ? 'Summary generated and sent to Slack' : 'Summary generated but Slack delivery failed',
      summary: aiSummary,
      slackDelivered,
      slackError: slackError
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Summary generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Todo Summary Assistant API running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
}); 