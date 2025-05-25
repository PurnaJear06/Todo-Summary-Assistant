import React, { useState, useEffect } from 'react';
import { getTodos, addTodo, deleteTodo, updateTodo, generateSummary } from './api/todosApi';
import './index.css';

function App() {
  // State management for the application
  const [todoList, setTodoList] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryOperationStatus, setSummaryOperationStatus] = useState(null);

  // Load todos when component mounts
  useEffect(() => {
    loadTodosFromAPI();
  }, []);

  // Fetch all todos from the backend
  const loadTodosFromAPI = async () => {
    try {
      const fetchedTodos = await getTodos();
      setTodoList(fetchedTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
      setErrorMessage('Unable to load your todos. Please refresh the page.');
    }
  };

  // Handle adding a new todo item
  const handleAddNewTodo = async (e) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) {
      setErrorMessage('Please enter a task description');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const createdTodo = await addTodo(newTaskTitle.trim());
      setTodoList(prevTodos => [...prevTodos, createdTodo]);
      setNewTaskTitle(''); // Clear the input field
      setErrorMessage(null);
    } catch (error) {
      console.error('Error adding todo:', error);
      setErrorMessage('Failed to add task. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Handle removing a todo item
  const handleRemoveTodo = async (todoId) => {
    try {
      await deleteTodo(todoId);
      setTodoList(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
      setErrorMessage(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
      setErrorMessage('Failed to delete task. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Handle toggling todo completion status
  const handleToggleCompletion = async (todoId) => {
    const todoToUpdate = todoList.find(todo => todo.id === todoId);
    if (!todoToUpdate) return;

    try {
      const updatedTodo = await updateTodo(todoId, { 
        completed: !todoToUpdate.completed 
      });
      
      setTodoList(prevTodos => 
        prevTodos.map(todo => 
          todo.id === todoId ? updatedTodo : todo
        )
      );
      setErrorMessage(null);
    } catch (error) {
      console.error('Error updating todo:', error);
      setErrorMessage('Failed to update task status. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Handle generating and sending summary to Slack
  const handleSummaryGeneration = async () => {
    setIsGeneratingSummary(true);
    setSummaryOperationStatus('loading');
    
    try {
      // Check if there are any incomplete tasks
      const incompleteTasks = todoList.filter(todo => !todo.completed);
      
      if (incompleteTasks.length === 0) {
        setSummaryOperationStatus('error');
        setErrorMessage('No incomplete tasks found. Add some tasks to generate a summary.');
        setTimeout(() => {
          setSummaryOperationStatus(null);
          setErrorMessage(null);
        }, 3000);
        return;
      }
      
      // Request summary generation from the backend
      const summaryResult = await generateSummary();
      console.log('Summary generation result:', summaryResult);
      
      if (summaryResult.success) {
        setSummaryOperationStatus('success');
        setErrorMessage(null);
        
        // Show warning if Slack delivery failed
        if (!summaryResult.slackDelivered) {
          setErrorMessage(`Summary generated but couldn't send to Slack: ${summaryResult.slackError || 'Unknown error'}`);
          setTimeout(() => setErrorMessage(null), 5000);
        }
        
        setTimeout(() => setSummaryOperationStatus(null), 3000);
      } else {
        throw new Error(summaryResult.details || 'Summary generation failed');
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryOperationStatus('error');
      setErrorMessage(`Failed to generate summary: ${error.message || 'Unknown error'}. Please check the server console for details.`);
      setTimeout(() => {
        setSummaryOperationStatus(null);
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Calculate statistics for display
  const totalTasks = todoList.length;
  const completedTasks = todoList.filter(todo => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1>📝 Todo Summary Assistant</h1>
          <p>Manage your tasks and get AI-powered summaries sent to Slack</p>
        </header>

        {/* Task Statistics */}
        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-number">{totalTasks}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{pendingTasks}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{completedTasks}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* Add New Task Form */}
        <form onSubmit={handleAddNewTodo} className="add-todo-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          <button 
            type="submit" 
            className="add-button"
            disabled={!newTaskTitle.trim()}
          >
            Add Task
          </button>
        </form>

        {/* Error Messages */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* Todo List */}
        <div className="todo-list-container">
          {todoList.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <ul className="todo-list">
              {todoList.map(todo => (
                <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleCompletion(todo.id)}
                      className="todo-checkbox"
                    />
                    <div className="todo-text">
                      <span className="todo-title">{todo.title}</span>
                      {todo.description && (
                        <span className="todo-description">{todo.description}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTodo(todo.id)}
                    className="delete-button"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary Generation Section */}
        <div className="summary-section">
          <button
            onClick={handleSummaryGeneration}
            disabled={isGeneratingSummary || pendingTasks === 0}
            className={`summary-button ${summaryOperationStatus === 'success' ? 'success' : ''} ${summaryOperationStatus === 'error' ? 'error' : ''}`}
          >
            {isGeneratingSummary ? (
              <>
                <span className="loading-spinner"></span>
                Generating Summary...
              </>
            ) : summaryOperationStatus === 'success' ? (
              <>✅ Summary Sent to Slack!</>
            ) : summaryOperationStatus === 'error' ? (
              <>❌ Summary Failed</>
            ) : (
              <>🤖 Generate & Send Summary to Slack</>
            )}
          </button>
          
          {pendingTasks === 0 && (
            <p className="summary-help-text">
              Complete some tasks or add new ones to generate a summary
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 