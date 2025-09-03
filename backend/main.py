from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re
import uvicorn
from data_service import data_service

app = FastAPI(title="Prompt Analyzer API", description="API for analyzing prompts", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str

class AnalysisResult(BaseModel):
    word_count: int
    character_count: int
    sentence_count: int
    paragraph_count: int
    readability_score: float
    complexity_level: str
    keywords: List[str]
    sentiment: str
    suggestions: List[str]

@app.get("/")
async def root():
    return {"message": "Prompt Analyzer API is running"}

@app.get("/analytics/overview")
async def get_analytics_overview():
    """Get overview analytics from the dataset."""
    try:
        return data_service.get_overview_stats()
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/users")
async def get_user_analytics(limit: int = 10):
    """Get user aggregation analytics."""
    try:
        return data_service.get_user_aggregations(limit=limit)
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/temporal")
async def get_temporal_analytics(period: str = "daily"):
    """Get temporal analysis. Period can be 'hourly', 'daily', or 'weekly'."""
    try:
        if period not in ["hourly", "daily", "weekly"]:
            return {"error": "Period must be 'hourly', 'daily', or 'weekly'"}
        return data_service.get_temporal_analysis(period=period)
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/models")
async def get_model_analytics():
    """Get model performance analytics."""
    try:
        return data_service.get_model_performance()
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/categories")
async def get_category_analytics():
    """Get category analysis."""
    try:
        return data_service.get_category_analysis()
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/quality")
async def get_quality_analytics():
    """Get quality insights and patterns."""
    try:
        return data_service.get_quality_insights()
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_prompt(request: PromptRequest):
    """Analyze a prompt and return various metrics and insights."""
    prompt = request.prompt
    
    # Basic metrics
    word_count = len(prompt.split())
    character_count = len(prompt)
    sentence_count = len([s for s in re.split(r'[.!?]+', prompt) if s.strip()])
    paragraph_count = len([p for p in prompt.split('\n\n') if p.strip()])
    
    # Simple readability score (Flesch Reading Ease approximation)
    avg_sentence_length = word_count / max(sentence_count, 1)
    avg_syllables_per_word = estimate_syllables_per_word(prompt)
    readability_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
    
    # Complexity level based on readability
    if readability_score >= 80:
        complexity_level = "Very Easy"
    elif readability_score >= 60:
        complexity_level = "Easy"
    elif readability_score >= 40:
        complexity_level = "Moderate"
    elif readability_score >= 20:
        complexity_level = "Difficult"
    else:
        complexity_level = "Very Difficult"
    
    # Extract keywords (simple approach)
    keywords = extract_keywords(prompt)
    
    # Simple sentiment analysis
    sentiment = analyze_sentiment(prompt)
    
    # Generate suggestions
    suggestions = generate_suggestions(prompt, word_count, sentence_count)
    
    return AnalysisResult(
        word_count=word_count,
        character_count=character_count,
        sentence_count=sentence_count,
        paragraph_count=paragraph_count,
        readability_score=round(readability_score, 2),
        complexity_level=complexity_level,
        keywords=keywords,
        sentiment=sentiment,
        suggestions=suggestions
    )

def estimate_syllables_per_word(text: str) -> float:
    """Estimate average syllables per word using a simple heuristic."""
    words = text.lower().split()
    if not words:
        return 0
    
    total_syllables = 0
    for word in words:
        # Remove punctuation
        word = re.sub(r'[^a-zA-Z]', '', word)
        if not word:
            continue
            
        # Count vowel groups
        syllables = len(re.findall(r'[aeiouy]+', word))
        # Adjust for silent e
        if word.endswith('e') and syllables > 1:
            syllables -= 1
        # Ensure at least 1 syllable per word
        syllables = max(1, syllables)
        total_syllables += syllables
    
    return total_syllables / len(words)

def extract_keywords(text: str) -> List[str]:
    """Extract keywords from the text."""
    # Simple keyword extraction - remove common words and get frequent terms
    common_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
        'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
        'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    }
    
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    keywords = [word for word in words if word not in common_words]
    
    # Get unique keywords and limit to top 10
    keyword_freq = {}
    for word in keywords:
        keyword_freq[word] = keyword_freq.get(word, 0) + 1
    
    sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_keywords[:10]]

def analyze_sentiment(text: str) -> str:
    """Simple sentiment analysis based on positive/negative words."""
    positive_words = {
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
        'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'positive', 'best',
        'perfect', 'outstanding', 'brilliant', 'superb', 'magnificent'
    }
    
    negative_words = {
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'angry',
        'sad', 'disappointed', 'frustrated', 'annoyed', 'negative', 'poor', 'weak',
        'failed', 'broken', 'wrong', 'error', 'problem'
    }
    
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    if positive_count > negative_count:
        return "Positive"
    elif negative_count > positive_count:
        return "Negative"
    else:
        return "Neutral"

def generate_suggestions(prompt: str, word_count: int, sentence_count: int) -> List[str]:
    """Generate suggestions for improving the prompt."""
    suggestions = []
    
    if word_count < 10:
        suggestions.append("Consider adding more detail to make your prompt more specific.")
    elif word_count > 200:
        suggestions.append("Consider shortening your prompt for better clarity.")
    
    avg_sentence_length = word_count / max(sentence_count, 1)
    if avg_sentence_length > 25:
        suggestions.append("Try breaking long sentences into shorter ones for better readability.")
    
    if not re.search(r'[.!?]', prompt):
        suggestions.append("Add punctuation to improve prompt structure.")
    
    if prompt.isupper():
        suggestions.append("Consider using mixed case instead of all caps.")
    elif prompt.islower():
        suggestions.append("Consider proper capitalization for better presentation.")
    
    if len(suggestions) == 0:
        suggestions.append("Your prompt looks well-structured!")
    
    return suggestions

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
