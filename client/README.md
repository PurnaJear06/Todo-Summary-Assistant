# Todo Summary Assistant - Frontend

A modern React application for managing todos, generating AI-powered summaries, and sending them to Slack.

## Features

- Beautiful dark-themed UI with a modern design
- Add, edit, toggle, and delete todos
- Generate AI-powered summaries of pending tasks
- Send summaries to Slack
- Responsive design

## Tech Stack

- React
- Tailwind CSS
- Axios for API communication
- Vite for fast development

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Structure

- `/src` - Source code
  - `/api` - API service layer
  - `/assets` - Static assets
  - `App.jsx` - Main application component
  - `index.css` - Global styles
  - `main.jsx` - Application entry point

## Environment

The application expects a backend server running on `http://localhost:5001` with the following endpoints:
- `GET /todos` - Get all todos
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo
- `POST /summarize` - Generate a summary and send to Slack
