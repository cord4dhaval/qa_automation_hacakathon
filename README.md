# QA Task Validator

A full-stack application that allows testers to input task details and automatically validate web pages against acceptance criteria, providing pass/fail verdicts with evidence.

## Features

- **Task Management**: Create and manage QA tasks with detailed acceptance criteria
- **Automated Validation**: Web scraping with Puppeteer to extract page data
- **AI-Powered Analysis**: OpenAI integration for intelligent validation summaries
- **Comprehensive Testing**: Content matching, SEO, accessibility, performance, and link validation
- **Results Dashboard**: Clean interface showing verdicts, scores, and detailed evidence
- **Export Functionality**: PDF reports, CSV exports, and bug ticket generation
- **Real-time Updates**: Firebase Firestore integration with live data synchronization
- **Professional UI**: Modern design using shadcn/ui components and Tailwind CSS

## Tech Stack

### Frontend

- React 18 with Vite
- Tailwind CSS
- shadcn/ui components
- JavaScript

### Backend

- Node.js with Express
- Puppeteer for web scraping
- OpenAI API for intelligent analysis
- Firebase Firestore for data storage

## Quick Start

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Start development servers:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
PORT=3001
NODE_ENV=development
```

## Project Structure

```
qa_automation/
├── frontend/          # React frontend application
├── backend/           # Node.js backend server
├── package.json       # Root package.json
└── README.md         # This file
```

## API Endpoints

- `POST /api/validate` - Validate a web page against acceptance criteria
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
