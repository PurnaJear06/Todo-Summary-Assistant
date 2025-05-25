# Todo Summary Assistant

A full-stack web application that helps you manage your daily tasks and get AI-powered summaries delivered straight to your Slack workspace.

## ✨ Features

- **Task Management**: Create, update, and delete your daily todos
- **Smart Completion Tracking**: Mark tasks as complete/incomplete with visual feedback
- **AI-Powered Summaries**: Generate intelligent summaries of your pending tasks using DeepSeek AI
- **Slack Integration**: Automatically send task summaries to your Slack channel
- **Modern UI**: Clean, responsive interface with real-time statistics
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Tech Stack

**Frontend:**
- React 18 with hooks
- Modern CSS with gradients and animations
- Axios for API communication
- Vite for fast development

**Backend:**
- Node.js with Express
- OpenRouter API integration (DeepSeek AI)
- Slack Webhooks
- CORS enabled for cross-origin requests

## 📋 Prerequisites

Before you begin, ensure you have the following:

- Node.js (v16 or higher)
- npm or yarn
- An OpenRouter API key (for AI functionality)
- A Slack workspace with webhook permissions

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PurnaJear06/Todo-Summary-Assistant.git
cd Todo-Summary-Assistant
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Update the `.env` file with your actual API keys:

```env
PORT=5001
OPENROUTER_API_KEY=your_openrouter_api_key_here
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
NODE_ENV=development
```

### 4. Setting Up API Keys

#### OpenRouter API Key (DeepSeek AI)

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account and navigate to API Keys
3. Generate a new API key
4. Add it to your `.env` file as `OPENROUTER_API_KEY`

#### Slack Webhook URL

1. Go to your Slack workspace
2. Navigate to Apps → Incoming Webhooks
3. Create a new webhook for your desired channel
4. Copy the webhook URL to your `.env` file as `SLACK_WEBHOOK_URL`

## 🏃‍♂️ Running the Application

### Development Mode

Start both backend and frontend in development mode:

```bash
# Terminal 1: Start the backend server
npm run dev

# Terminal 2: Start the frontend development server
npm run client
```

The application will be available at:
- Frontend: `http://localhost:5173` (or the next available port)
- Backend API: `http://localhost:5001`

### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## 📱 Usage

1. **Add Tasks**: Use the input field to add new todos
2. **Manage Tasks**: Click checkboxes to mark tasks complete or use the delete button to remove them
3. **View Statistics**: Monitor your progress with the stats section showing total, pending, and completed tasks
4. **Generate Summary**: Click the "Generate & Send Summary to Slack" button to create an AI summary of your pending tasks
5. **Slack Integration**: Summaries are automatically sent to your configured Slack channel

## 🔧 API Endpoints

- `GET /todos` - Retrieve all todos
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update an existing todo
- `DELETE /todos/:id` - Delete a todo
- `POST /summarize` - Generate AI summary and send to Slack

## 🏗️ Architecture Decisions

### Backend Design
- **Express.js**: Chosen for its simplicity and extensive middleware ecosystem
- **In-memory Storage**: Currently using arrays for data storage (easily replaceable with database)
- **OpenRouter Integration**: Provides access to multiple AI models with a unified API
- **Error Handling**: Comprehensive error catching with meaningful user messages

### Frontend Design
- **React with Hooks**: Modern approach for state management and component lifecycle
- **CSS-in-CSS**: Custom CSS for better performance and easier maintenance
- **Proxy Configuration**: Vite proxy setup eliminates CORS issues during development
- **Responsive Design**: Mobile-first approach with flexible layouts

### Security Considerations
- Environment variables for sensitive data
- CORS configuration for specific origins
- Input validation and sanitization
- Error messages that don't expose internal details

## 🔮 Future Enhancements

- [ ] Database integration with Supabase
- [ ] User authentication and multi-user support
- [ ] Task categories and priorities
- [ ] Due dates and reminders
- [ ] Export functionality
- [ ] Dark mode theme
- [ ] Progressive Web App features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Purna Jear**
- GitHub: [@PurnaJear06](https://github.com/PurnaJear06)

## 🙏 Acknowledgments

- OpenRouter for providing AI model access
- Slack for webhook integration capabilities
- The React and Node.js communities for excellent documentation

---

*Built with ❤️ for better productivity and task management* 