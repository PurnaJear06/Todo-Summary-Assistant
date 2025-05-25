import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';

// Set axios default base URL
axios.defaults.baseURL = 'http://localhost:5001';

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/todos');
      setTodos(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to fetch todos. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todo) => {
    try {
      const response = await axios.post('/todos', { title: todo, description: '' });
      setTodos([...todos, response.data]);
    } catch (err) {
      console.error('Error adding todo:', err);
      setError('Failed to add todo. Please try again.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo. Please try again.');
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };
      await axios.put(`/todos/${id}`, updatedTodo);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo. Please try again.');
    }
  };

  const generateSummary = async () => {
    setSummaryStatus('loading');
    try {
      const response = await axios.post('/summarize');
      setSummaryStatus('success');
      setTimeout(() => setSummaryStatus(null), 3000);
    } catch (err) {
      console.error('Error generating summary:', err);
      setSummaryStatus('error');
      setTimeout(() => setSummaryStatus(null), 3000);
    }
  };

  return (
    <div className="todo-app min-h-screen bg-gray-100 py-10">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="todo-header">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Todo Summary Assistant</h1>
        </div>
        
        <TodoForm addTodo={addTodo} />
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        {loading ? (
          <div className="text-center py-4">Loading todos...</div>
        ) : (
          <>
            <TodoList todos={todos} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
            
            <div className="todo-actions mt-6">
              <button 
                onClick={generateSummary}
                disabled={todos.length === 0 || summaryStatus === 'loading'}
                className={`px-4 py-2 rounded-md ${
                  todos.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-medium transition duration-200`}
              >
                {summaryStatus === 'loading' ? 'Generating...' : 'Generate & Send Summary'}
              </button>
            </div>
            
            {summaryStatus === 'success' && (
              <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Summary sent to Slack successfully!
              </div>
            )}
            
            {summaryStatus === 'error' && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Failed to generate or send summary. Please try again.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App; 