# Prompt Dataset

This directory contains sample prompt data for the Prompt Analyzer Dashboard, including user prompts, metadata, and analysis tools.

## 📁 Files Overview

### Data Files
- **`prompts.jsonl`** - Initial dataset with 25 prompts and basic metadata
- **`recent_prompts.jsonl`** - Recent dataset with 15 prompts and extended performance metrics
- **`schema.json`** - Complete data schema documentation
- **`analysis_summary.json`** - Generated analysis summary (created by running analysis scripts)

### Analysis Tools
- **`analyze_data.py`** - Full-featured analysis script (requires pandas)
- **`simple_analysis.py`** - Lightweight analysis script (no external dependencies)

## 📊 Dataset Statistics

- **Total Records**: 40 prompts
- **Date Range**: January 15, 2024 to March 22, 2024
- **Unique Users**: 39 different users
- **AI Models**: 6 different models (GPT-4, Claude-3, Gemini, etc.)
- **Categories**: 27 different prompt categories

### Key Insights
- **Most Popular Model**: GPT-4 (30% usage)
- **Top Categories**: Programming (12.5%), Education (10%)
- **Average Quality**: 4.43/5.0
- **Peak Usage**: 9:00 AM and 4:00 PM
- **Token Usage**: 51,550 total tokens

## 🗂️ Data Schema

Each record contains:

### Core Fields
- `prompt` - The actual prompt text
- `user` - User display name
- `user_id` - Unique user identifier (usr_XXX)
- `timestamp` - ISO 8601 timestamp
- `model` - AI model used
- `category` - Prompt category
- `tokens_used` - Token consumption
- `response_quality` - Quality rating (1-5)
- `session_id` - Session identifier

### Extended Fields (Recent Data)
- `prompt_length` - Character count
- `response_time_ms` - Response time in milliseconds
- `cost_usd` - API cost in USD

## 🔧 Usage

### Run Analysis
```bash
# Simple analysis (no dependencies)
python3 simple_analysis.py

# Full analysis (requires pandas)
pip install pandas
python3 analyze_data.py
```

### Load Data in Python
```python
import json

def load_jsonl(filepath):
    data = []
    with open(filepath, 'r') as f:
        for line in f:
            data.append(json.loads(line.strip()))
    return data

# Load datasets
prompts = load_jsonl('prompts.jsonl')
recent = load_jsonl('recent_prompts.jsonl')
```

### Sample Record
```json
{
  "prompt": "Write a comprehensive business plan for a sustainable coffee shop",
  "user": "Sarah Johnson",
  "user_id": "usr_001",
  "timestamp": "2024-01-15T09:30:15Z",
  "model": "gpt-4",
  "category": "business",
  "tokens_used": 1250,
  "response_quality": 4.8,
  "session_id": "sess_abc123"
}
```

## 📈 Analysis Results

### Model Performance
1. **GPT-4 Turbo**: 4.85/5.0 quality (newest, best performance)
2. **Claude-3 Opus**: 4.74/5.0 quality
3. **Gemini Pro**: 4.66/5.0 quality
4. **GPT-4**: 4.64/5.0 quality
5. **Claude-3 Sonnet**: 4.60/5.0 quality
6. **GPT-3.5 Turbo**: 3.23/5.0 quality (lowest cost, lower quality)

### Quality Patterns
- **High Quality Prompts**: Specific, detailed, well-structured
- **Low Quality Prompts**: Incomplete, vague, too short (avg 14.7 chars)
- **Optimal Length**: 51-150 characters (70% of prompts)

### Usage Patterns
- **Peak Hours**: 9 AM and 4 PM (business hours)
- **Response Time**: Average 4.1 seconds
- **Cost Efficiency**: $0.109 average per prompt

## 🎯 Use Cases

This dataset can be used for:

1. **Prompt Engineering Research**
   - Analyze what makes effective prompts
   - Study quality vs. length relationships
   - Model comparison studies

2. **Dashboard Testing**
   - Realistic test data for the analyzer
   - Performance benchmarking
   - UI/UX validation

3. **Analytics & Insights**
   - User behavior patterns
   - Cost optimization
   - Quality improvement strategies

4. **Machine Learning**
   - Training prompt classification models
   - Quality prediction algorithms
   - Usage pattern analysis

## 📋 Categories

The dataset includes prompts across diverse categories:
- Programming & Development
- Business & Finance
- Education & Learning
- Creative Writing
- Health & Fitness
- Marketing & Communication
- Research & Analysis
- Technology & Innovation

## 🔍 Data Quality Notes

- **Clean Data**: All records validated against schema
- **Realistic Metrics**: Performance data based on actual API usage patterns
- **Diverse Users**: Mix of professional and casual users
- **Balanced Distribution**: Multiple models and categories represented
- **Time Series**: Data spans multiple months for temporal analysis

This dataset provides a comprehensive foundation for testing and improving the Prompt Analyzer Dashboard!
