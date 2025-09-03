# Prompt Analyzer Dashboard

A comprehensive dashboard for analyzing prompts with a Next.js frontend and FastAPI backend.

## Features

- **Real-time Prompt Analysis**: Analyze prompts for various metrics including word count, readability, complexity, and sentiment
- **Interactive Dashboard**: Clean, responsive UI built with Next.js and Tailwind CSS
- **RESTful API**: FastAPI backend providing analysis endpoints
- **Multiple Analysis Metrics**:
  - Basic metrics (word count, character count, sentences, paragraphs)
  - Readability score and complexity level
  - Keyword extraction
  - Sentiment analysis
  - Improvement suggestions

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Port**: 3000
- **Location**: `/frontend`

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Environment**: UV for package management
- **Port**: 8001
- **Location**: `/backend`

## Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.12+
- UV (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompt-analyzer
   ```

2. **Setup Backend**
   ```bash
   cd backend
   uv init
   uv add fastapi uvicorn python-multipart pydantic
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

2. **Start the Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

## API Endpoints

### POST /analyze
Analyzes a prompt and returns comprehensive metrics.

**Request Body:**
```json
{
  "prompt": "Your prompt text here"
}
```

**Response:**
```json
{
  "word_count": 25,
  "character_count": 150,
  "sentence_count": 3,
  "paragraph_count": 1,
  "readability_score": 75.2,
  "complexity_level": "Easy",
  "keywords": ["example", "prompt", "analysis"],
  "sentiment": "Positive",
  "suggestions": ["Your prompt looks well-structured!"]
}
```

## Usage

1. Open the dashboard at http://localhost:3000
2. Enter your prompt in the text area
3. Click "Analyze Prompt" to get instant analysis
4. Review the comprehensive metrics and suggestions
5. Use the insights to improve your prompts

## Development

### Project Structure
```
prompt-analyzer/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── pyproject.toml       # Python dependencies
│   └── .venv/               # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main dashboard page
│   │   │   └── layout.tsx   # App layout
│   │   └── components/
│   │       └── PromptAnalyzer.tsx  # Main analysis component
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind configuration
└── README.md
```

### Key Components

- **PromptAnalyzer**: Main React component handling prompt input and analysis display
- **FastAPI Backend**: Provides analysis algorithms for readability, sentiment, and keyword extraction
- **Responsive Design**: Works on desktop and mobile devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
