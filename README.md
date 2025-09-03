# Prompt Analyzer Dashboard

A comprehensive dashboard for analyzing prompts with a Next.js frontend and FastAPI backend, featuring real-time analysis and comprehensive analytics from historical data.

## Features

- **Real-time Prompt Analysis**: Analyze prompts for various metrics including word count, readability, complexity, and sentiment
- **Analytics Dashboard**: Comprehensive analytics from historical prompt data including:
  - User aggregations and behavior patterns
  - Temporal analysis (hourly, daily, weekly trends)
  - Model performance comparisons
  - Category distribution and insights
  - Quality patterns and insights
- **Interactive UI**: Clean, responsive dashboard with tabbed navigation
- **RESTful API**: FastAPI backend with both analysis and analytics endpoints
- **Rich Dataset**: 40+ sample prompts with realistic metadata for testing and demonstration

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

### Analysis Endpoints
- **POST /analyze** - Analyze a single prompt
- **GET /** - API health check

### Analytics Endpoints
- **GET /analytics/overview** - Dataset overview statistics
- **GET /analytics/users** - User aggregation analytics
- **GET /analytics/temporal** - Temporal analysis (hourly/daily/weekly)
- **GET /analytics/models** - Model performance comparison
- **GET /analytics/categories** - Category distribution analysis
- **GET /analytics/quality** - Quality insights and patterns

### Analysis Request Body:
```json
{
  "prompt": "Your prompt text here"
}
```

### Analysis Response:
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

### Analytics Response Examples:

**Overview Stats:**
```json
{
  "total_prompts": 40,
  "unique_users": 39,
  "date_range": {
    "start": "2024-01-15T09:30:15Z",
    "end": "2024-03-22T09:10:15Z"
  },
  "total_tokens": 51550,
  "avg_quality": 4.43,
  "total_cost": 1.64
}
```

**User Analytics:**
```json
{
  "users": [
    {
      "user_id": "usr_001",
      "user_name": "Sarah Johnson",
      "prompt_count": 5,
      "total_tokens": 2500,
      "avg_quality": 4.6,
      "total_cost": 0.15
    }
  ],
  "total_users": 39
}
```

## Usage

### Dashboard Navigation

1. **Prompt Analyzer Tab**: 
   - Enter your prompt in the text area
   - Click "Analyze Prompt" to get instant analysis
   - Review metrics including readability, sentiment, keywords, and suggestions

2. **Analytics Dashboard Tab**:
   - View comprehensive analytics from the historical dataset
   - Explore user behavior patterns and aggregations
   - Analyze temporal trends (hourly, daily, weekly)
   - Compare model performance metrics
   - Review category distribution and insights

### Accessing the Application

1. Open the dashboard at http://localhost:3000
2. Use the tab navigation to switch between Analyzer and Analytics
3. Both tabs provide real-time data from the backend API

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
