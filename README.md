# Feedback Co-Pilot

AI-powered feedback generation tool for course curators using Google Gemini API.

## Features

- 📄 Upload PDF, PNG, JPG files
- 🔗 Support for Google Docs and Google Slides links
- ✏️ Customizable prompts
- 📝 Editable feedback with markdown formatting
- 💾 Export feedback as text file
- 📋 Copy to clipboard

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Google Gemini 2.5 Flash

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

4. Start the backend server:
```bash
npm run server:dev
```

5. In another terminal, start the frontend:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## Project Structure

```
feedback-copilot/
├── src/              # React frontend
│   ├── App.jsx       # Main component
│   └── main.jsx      # Entry point
├── server.js         # Express backend
├── package.json      # Dependencies
└── .env.example      # Environment variables template
```

## API Endpoints

- `POST /api/upload` - Upload and process files (PDF, images)
- `POST /api/analyze` - Generate feedback using Gemini AI
- `GET /health` - Health check

## License

ISC


