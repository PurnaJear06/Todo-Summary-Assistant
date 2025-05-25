import axios from 'axios';

/**
 * API client for todo operations
 * Configures axios with base URL and common settings
 */
const apiClient = axios.create({
  baseURL: '/api', // Proxied by Vite to backend server
  timeout: 15000, // 15 second timeout for requests
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Custom error handler for better user experience
 * @param {Error} error - The error from axios
 * @param {string} operationDescription - Description of the operation
 * @returns {Promise} - Rejected promise with error details
 */
const handleApiError = (error, operationDescription) => {
  let userFriendlyMessage = `Failed to ${operationDescription}`;
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    userFriendlyMessage = data.error || `Server error (${status}) while ${operationDescription}`;
  } else if (error.request) {
    // Network error - no response received
    userFriendlyMessage = 'Network error. Please check your internet connection.';
  } else {
    // Something else went wrong
    userFriendlyMessage = error.message || `Unexpected error while ${operationDescription}`;
  }
  
  console.error(`API Error [${operationDescription}]:`, error);
  throw new Error(userFriendlyMessage);
};

/**
 * Fetch all todos from the server
 * @returns {Promise<Array>} Array of todo objects
 */
export const getTodos = async () => {
  try {
    const response = await apiClient.get('/todos');
    return response.data;
  } catch (error) {
    handleApiError(error, 'loading todos');
  }
};

/**
 * Add a new todo to the server
 * @param {string} todoTitle - The todo title
 * @returns {Promise<Object>} The created todo object
 */
export const addTodo = async (todoTitle) => {
  try {
    const todoData = { 
      title: todoTitle, 
      description: '' 
    };
    
    const response = await apiClient.post('/todos', todoData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'creating new todo');
  }
};

/**
 * Update an existing todo
 * @param {number} todoId - The todo ID
 * @param {Object} updateData - Object containing fields to update
 * @returns {Promise<Object>} The updated todo object
 */
export const updateTodo = async (todoId, updateData) => {
  try {
    const response = await apiClient.put(`/todos/${todoId}`, updateData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'updating todo');
  }
};

/**
 * Delete a todo
 * @param {number} todoId - The todo ID to delete
 * @returns {Promise<Object>} The server response
 */
export const deleteTodo = async (todoId) => {
  try {
    const response = await apiClient.delete(`/todos/${todoId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'deleting todo');
  }
};

/**
 * Generate a summary of pending todos and send to Slack
 * @returns {Promise<Object>} The server response with summary
 */
export const generateSummary = async () => {
  try {
    const response = await apiClient.post('/summarize');
    return response.data;
  } catch (error) {
    handleApiError(error, 'generating summary');
  }
};

// Export all API functions as a default object
const TodoAPI = {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  generateSummary
};

export default TodoAPI; 