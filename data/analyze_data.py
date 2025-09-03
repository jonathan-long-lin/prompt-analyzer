#!/usr/bin/env python3
"""
Prompt Dataset Analysis Tool
Analyzes the prompt datasets in the data directory
"""

import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from collections import Counter
import statistics

def load_jsonl(filepath):
    """Load JSON Lines file into a list of dictionaries"""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line.strip()))
    return data

def analyze_dataset():
    """Analyze the prompt datasets and generate insights"""
    
    # Load datasets
    data_dir = Path(__file__).parent
    prompts_data = load_jsonl(data_dir / 'prompts.jsonl')
    recent_data = load_jsonl(data_dir / 'recent_prompts.jsonl')
    
    # Combine datasets
    all_data = prompts_data + recent_data
    df = pd.DataFrame(all_data)
    
    print("=== PROMPT DATASET ANALYSIS ===\n")
    
    # Basic statistics
    print(f"📊 DATASET OVERVIEW")
    print(f"Total prompts: {len(all_data)}")
    print(f"Unique users: {df['user'].nunique()}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Average prompt length: {df['prompt'].str.len().mean():.1f} characters")
    print()
    
    # Model usage
    print(f"🤖 MODEL USAGE")
    model_counts = df['model'].value_counts()
    for model, count in model_counts.items():
        percentage = (count / len(df)) * 100
        print(f"  {model}: {count} ({percentage:.1f}%)")
    print()
    
    # Category distribution
    print(f"📁 CATEGORY DISTRIBUTION")
    category_counts = df['category'].value_counts().head(10)
    for category, count in category_counts.items():
        percentage = (count / len(df)) * 100
        print(f"  {category}: {count} ({percentage:.1f}%)")
    print()
    
    # Quality metrics
    print(f"⭐ QUALITY METRICS")
    print(f"Average response quality: {df['response_quality'].mean():.2f}/5.0")
    print(f"Quality range: {df['response_quality'].min():.1f} - {df['response_quality'].max():.1f}")
    
    # Quality by model
    quality_by_model = df.groupby('model')['response_quality'].mean().sort_values(ascending=False)
    print(f"\nQuality by model:")
    for model, quality in quality_by_model.items():
        print(f"  {model}: {quality:.2f}/5.0")
    print()
    
    # Token usage
    print(f"🔢 TOKEN USAGE")
    print(f"Average tokens per prompt: {df['tokens_used'].mean():.0f}")
    print(f"Total tokens used: {df['tokens_used'].sum():,}")
    print(f"Token range: {df['tokens_used'].min()} - {df['tokens_used'].max()}")
    print()
    
    # Performance metrics (for recent data with extended metadata)
    recent_df = pd.DataFrame(recent_data)
    if 'response_time_ms' in recent_df.columns:
        print(f"⚡ PERFORMANCE METRICS (Recent Data)")
        print(f"Average response time: {recent_df['response_time_ms'].mean():.0f}ms")
        print(f"Response time range: {recent_df['response_time_ms'].min()}ms - {recent_df['response_time_ms'].max()}ms")
        
        if 'cost_usd' in recent_df.columns:
            print(f"Average cost per prompt: ${recent_df['cost_usd'].mean():.3f}")
            print(f"Total cost: ${recent_df['cost_usd'].sum():.2f}")
        print()
    
    # Prompt length analysis
    print(f"📝 PROMPT LENGTH ANALYSIS")
    prompt_lengths = df['prompt'].str.len()
    print(f"Average length: {prompt_lengths.mean():.1f} characters")
    print(f"Median length: {prompt_lengths.median():.1f} characters")
    print(f"Length range: {prompt_lengths.min()} - {prompt_lengths.max()} characters")
    
    # Categorize by length
    short_prompts = (prompt_lengths <= 50).sum()
    medium_prompts = ((prompt_lengths > 50) & (prompt_lengths <= 150)).sum()
    long_prompts = (prompt_lengths > 150).sum()
    
    print(f"\nPrompt length distribution:")
    print(f"  Short (≤50 chars): {short_prompts} ({short_prompts/len(df)*100:.1f}%)")
    print(f"  Medium (51-150 chars): {medium_prompts} ({medium_prompts/len(df)*100:.1f}%)")
    print(f"  Long (>150 chars): {long_prompts} ({long_prompts/len(df)*100:.1f}%)")
    print()
    
    # Poor quality prompts analysis
    poor_quality = df[df['response_quality'] < 3.0]
    if not poor_quality.empty:
        print(f"⚠️  LOW QUALITY PROMPTS ANALYSIS")
        print(f"Number of low quality responses: {len(poor_quality)}")
        print(f"Common characteristics:")
        print(f"  Average prompt length: {poor_quality['prompt'].str.len().mean():.1f} characters")
        print(f"  Most common category: {poor_quality['category'].mode().iloc[0] if not poor_quality['category'].mode().empty else 'N/A'}")
        print()
    
    # Time-based analysis
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    print(f"🕐 USAGE PATTERNS")
    peak_hour = df['hour'].mode().iloc[0]
    print(f"Peak usage hour: {peak_hour}:00")
    
    # Hourly distribution
    hourly_counts = df['hour'].value_counts().sort_index()
    print(f"Hourly distribution (top 5):")
    for hour, count in hourly_counts.head().items():
        print(f"  {hour:02d}:00 - {count} prompts")

def main():
    """Main function"""
    try:
        analyze_dataset()
    except FileNotFoundError as e:
        print(f"Error: Could not find data files. Make sure you're running this from the data directory.")
        print(f"Details: {e}")
    except Exception as e:
        print(f"Error analyzing dataset: {e}")

if __name__ == "__main__":
    main()
