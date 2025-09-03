from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re
import uvicorn
from data_service import data_service

app = FastAPI(
    title="Prompt Analyzer API",
    description="API for analyzing prompts",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],  # Next.js dev server
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

    # Detect if text contains Japanese characters
    is_japanese = bool(re.search(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]", prompt))

    # Basic metrics - adjusted for Japanese
    if is_japanese:
        # For Japanese, count characters instead of words for word_count
        # Remove spaces and punctuation for more accurate character count
        japanese_chars = re.sub(r"[\s\u3000-\u303F\uFF00-\uFFEF]", "", prompt)
        word_count = len(japanese_chars)  # Character count for Japanese
        # Sentence count using Japanese punctuation
        sentence_count = len(
            [s for s in re.split(r"[。！？．\.\!\?]+", prompt) if s.strip()]
        )
    else:
        # English word counting
        word_count = len(prompt.split())
        sentence_count = len([s for s in re.split(r"[.!?]+", prompt) if s.strip()])

    character_count = len(prompt)
    paragraph_count = len([p for p in prompt.split("\n\n") if p.strip()])

    # Adjusted readability for Japanese
    if is_japanese:
        # For Japanese, use character-based metrics
        avg_chars_per_sentence = character_count / max(sentence_count, 1)
        # Simplified readability for Japanese
        if avg_chars_per_sentence <= 20:
            readability_score = 80  # Easy
            complexity_level = "Easy"
        elif avg_chars_per_sentence <= 40:
            readability_score = 60  # Moderate
            complexity_level = "Moderate"
        elif avg_chars_per_sentence <= 60:
            readability_score = 40  # Difficult
            complexity_level = "Difficult"
        else:
            readability_score = 20  # Very Difficult
            complexity_level = "Very Difficult"
    else:
        # English readability (Flesch Reading Ease)
        avg_sentence_length = word_count / max(sentence_count, 1)
        avg_syllables_per_word = estimate_syllables_per_word(prompt)
        readability_score = (
            206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        )

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

    # Extract keywords (handles both English and Japanese)
    keywords = extract_keywords(prompt, is_japanese)

    # Simple sentiment analysis
    sentiment = analyze_sentiment(prompt, is_japanese)

    # Generate suggestions
    suggestions = generate_suggestions(prompt, word_count, sentence_count, is_japanese)

    return AnalysisResult(
        word_count=word_count,
        character_count=character_count,
        sentence_count=sentence_count,
        paragraph_count=paragraph_count,
        readability_score=round(readability_score, 2),
        complexity_level=complexity_level,
        keywords=keywords,
        sentiment=sentiment,
        suggestions=suggestions,
    )


def estimate_syllables_per_word(text: str) -> float:
    """Estimate average syllables per word using a simple heuristic."""
    words = text.lower().split()
    if not words:
        return 0

    total_syllables = 0
    for word in words:
        # Remove punctuation
        word = re.sub(r"[^a-zA-Z]", "", word)
        if not word:
            continue

        # Count vowel groups
        syllables = len(re.findall(r"[aeiouy]+", word))
        # Adjust for silent e
        if word.endswith("e") and syllables > 1:
            syllables -= 1
        # Ensure at least 1 syllable per word
        syllables = max(1, syllables)
        total_syllables += syllables

    return total_syllables / len(words)


def extract_keywords(text: str, is_japanese: bool = False) -> List[str]:
    """Extract keywords from the text."""
    if is_japanese:
        # For Japanese, extract characters/words excluding common particles
        japanese_stopwords = {
            "の",
            "に",
            "は",
            "を",
            "が",
            "で",
            "と",
            "から",
            "まで",
            "より",
            "で",
            "へ",
            "と",
            "か",
            "も",
            "や",
            "し",
            "だ",
            "である",
            "です",
            "ます",
            "した",
            "して",
            "する",
            "ある",
            "いる",
            "この",
            "その",
            "あの",
            "これ",
            "それ",
            "あれ",
        }

        # Extract potential words (2+ characters)
        potential_words = re.findall(
            r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,}", text
        )
        keywords = [word for word in potential_words if word not in japanese_stopwords]

        # Get unique keywords and limit to top 10
        keyword_freq = {}
        for word in keywords:
            keyword_freq[word] = keyword_freq.get(word, 0) + 1

        sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_keywords[:10]]
    else:
        # English keyword extraction
        common_words = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "could",
            "should",
            "may",
            "might",
            "can",
            "this",
            "that",
            "these",
            "those",
            "i",
            "you",
            "he",
            "she",
            "it",
            "we",
            "they",
            "me",
            "him",
            "her",
            "us",
            "them",
            "my",
            "your",
            "his",
            "her",
            "its",
            "our",
            "their",
        }

        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        keywords = [word for word in words if word not in common_words]

        # Get unique keywords and limit to top 10
        keyword_freq = {}
        for word in keywords:
            keyword_freq[word] = keyword_freq.get(word, 0) + 1

        sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_keywords[:10]]


def analyze_sentiment(text: str, is_japanese: bool = False) -> str:
    """Simple sentiment analysis based on positive/negative words."""
    if is_japanese:
        # Japanese positive/negative words
        positive_words = {
            "良い",
            "いい",
            "素晴らしい",
            "最高",
            "完璧",
            "美しい",
            "楽しい",
            "嬉しい",
            "幸せ",
            "好き",
            "愛",
            "成功",
            "優秀",
            "便利",
            "簡単",
            "快適",
            "安全",
            "満足",
            "感謝",
        }

        negative_words = {
            "悪い",
            "だめ",
            "最悪",
            "困る",
            "嫌い",
            "嫌",
            "怒り",
            "悲しい",
            "失敗",
            "問題",
            "危険",
            "不安",
            "心配",
            "疲れ",
            "面倒",
            "難しい",
            "複雑",
            "不満",
            "残念",
        }
    else:
        # English positive/negative words
        positive_words = {
            "good",
            "great",
            "excellent",
            "amazing",
            "wonderful",
            "fantastic",
            "awesome",
            "love",
            "like",
            "enjoy",
            "happy",
            "pleased",
            "satisfied",
            "positive",
            "best",
            "perfect",
            "outstanding",
            "brilliant",
            "superb",
            "magnificent",
        }

        negative_words = {
            "bad",
            "terrible",
            "awful",
            "horrible",
            "worst",
            "hate",
            "dislike",
            "angry",
            "sad",
            "disappointed",
            "frustrated",
            "annoyed",
            "negative",
            "poor",
            "weak",
            "failed",
            "broken",
            "wrong",
            "error",
            "problem",
        }

    # Count positive and negative words
    positive_count = 0
    negative_count = 0

    if is_japanese:
        # Check for Japanese sentiment words
        for word in positive_words:
            positive_count += text.count(word)
        for word in negative_words:
            negative_count += text.count(word)
    else:
        # Check for English sentiment words
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)

    if positive_count > negative_count:
        return "Positive"
    elif negative_count > positive_count:
        return "Negative"
    else:
        return "Neutral"


def generate_suggestions(
    prompt: str, word_count: int, sentence_count: int, is_japanese: bool = False
) -> List[str]:
    """Generate suggestions for improving the prompt."""
    suggestions = []

    if is_japanese:
        # Japanese-specific suggestions
        if word_count < 20:  # Character count for Japanese
            suggestions.append(
                "プロンプトをより具体的にするために、詳細を追加することを検討してください。"
            )
        elif word_count > 400:
            suggestions.append(
                "明確さを向上させるために、プロンプトを短くすることを検討してください。"
            )

        avg_chars_per_sentence = word_count / max(sentence_count, 1)
        if avg_chars_per_sentence > 60:
            suggestions.append(
                "読みやすさを向上させるために、長い文を短く分割してみてください。"
            )

        if not re.search(r"[。！？]", prompt):
            suggestions.append(
                "プロンプトの構造を改善するために句読点を追加してください。"
            )

        if len(suggestions) == 0:
            suggestions.append("プロンプトはよく構造化されています！")
    else:
        # English suggestions
        if word_count < 10:
            suggestions.append(
                "Consider adding more detail to make your prompt more specific."
            )
        elif word_count > 200:
            suggestions.append("Consider shortening your prompt for better clarity.")

        avg_sentence_length = word_count / max(sentence_count, 1)
        if avg_sentence_length > 25:
            suggestions.append(
                "Try breaking long sentences into shorter ones for better readability."
            )

        if not re.search(r"[.!?]", prompt):
            suggestions.append("Add punctuation to improve prompt structure.")

        if prompt.isupper():
            suggestions.append("Consider using mixed case instead of all caps.")
        elif prompt.islower():
            suggestions.append(
                "Consider proper capitalization for better presentation."
            )

        if len(suggestions) == 0:
            suggestions.append("Your prompt looks well-structured!")

    return suggestions


if __name__ == "__main__":
    # Run the app using uvicorn module for reload support and correct port
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
