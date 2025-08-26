#!/bin/bash

echo "🚀 Setting up QA Task Validator Application..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy backend/env.example to backend/.env"
echo "2. Configure your environment variables in backend/.env:"
echo "   - OPENAI_API_KEY"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - FIREBASE_CLIENT_EMAIL"
echo ""
echo "3. Start the application:"
echo "   npm run dev"
echo ""
echo "4. Open your browser:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend: http://localhost:3001"
echo ""
echo "📚 For more information, see README.md"
