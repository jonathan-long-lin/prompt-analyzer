#!/usr/bin/env python3
"""
Simple Prompt Dataset Analysis Tool (No external dependencies)
Analyzes the prompt datasets in the data directory
"""

import json
from datetime import datetime
from pathlib import Path
from collections import Counter, defaultdict

def load_jsonl(filepath):
    """Load JSON Lines file into a list of dictionaries"""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line.strip()))
    return data

def calculate_stats(numbers):
    """Calculate basic statistics for a list of numbers"""
    if not numbers:
        return {"mean": 0, "min": 0, "max": 0, "median": 0}
    
    numbers = sorted(numbers)
    n = len(numbers)
    
    return {
        "mean": sum(numbers) / n,
        "min": min(numbers),
        "max": max(numbers),
        "median": numbers[n // 2] if n % 2 == 1 else (numbers[n//2 - 1] + numbers[n//2]) / 2
    }

def analyze_simple():
    """Simple analysis without external dependencies"""
    
    # Load datasets
    data_dir = Path(__file__).parent
    
    try:
        prompts_data = load_jsonl(data_dir / 'prompts.jsonl')
        recent_data = load_jsonl(data_dir / 'recent_prompts.jsonl')
    except FileNotFoundError as e:
        print(f"Error: Could not find data files: {e}")
        return
    
    # Combine datasets
    all_data = prompts_data + recent_data
    
    print("=== SIMPLE PROMPT DATASET ANALYSIS ===\n")
    
    # Basic statistics
    print(f"📊 DATASET OVERVIEW")
    print(f"Total prompts: {len(all_data)}")
    
    users = set(item['user'] for item in all_data)
    print(f"Unique users: {len(users)}")
    
    timestamps = [item['timestamp'] for item in all_data]
    print(f"Date range: {min(timestamps)} to {max(timestamps)}")
    
    prompt_lengths = [len(item['prompt']) for item in all_data]
    length_stats = calculate_stats(prompt_lengths)
    print(f"Average prompt length: {length_stats['mean']:.1f} characters")
    print()
    
    # Model usage
    print(f"🤖 MODEL USAGE")
    model_counts = Counter(item['model'] for item in all_data)
    for model, count in model_counts.most_common():
        percentage = (count / len(all_data)) * 100
        print(f"  {model}: {count} ({percentage:.1f}%)")
    print()
    
    # Category distribution
    print(f"📁 CATEGORY DISTRIBUTION")
    category_counts = Counter(item['category'] for item in all_data)
    for category, count in category_counts.most_common(10):
        percentage = (count / len(all_data)) * 100
        print(f"  {category}: {count} ({percentage:.1f}%)")
    print()
    
    # Quality metrics
    qualities = [item['response_quality'] for item in all_data]
    quality_stats = calculate_stats(qualities)
    
    print(f"⭐ QUALITY METRICS")
    print(f"Average response quality: {quality_stats['mean']:.2f}/5.0")
    print(f"Quality range: {quality_stats['min']:.1f} - {quality_stats['max']:.1f}")
    
    # Quality by model
    model_qualities = defaultdict(list)
    for item in all_data:
        model_qualities[item['model']].append(item['response_quality'])
    
    print(f"\nQuality by model:")
    for model, qualities in model_qualities.items():
        avg_quality = sum(qualities) / len(qualities)
        print(f"  {model}: {avg_quality:.2f}/5.0")
    print()
    
    # Token usage
    tokens = [item['tokens_used'] for item in all_data]
    token_stats = calculate_stats(tokens)
    
    print(f"🔢 TOKEN USAGE")
    print(f"Average tokens per prompt: {token_stats['mean']:.0f}")
    print(f"Total tokens used: {sum(tokens):,}")
    print(f"Token range: {token_stats['min']} - {token_stats['max']}")
    print()
    
    # Performance metrics (for recent data with extended metadata)
    recent_with_perf = [item for item in recent_data if 'response_time_ms' in item]
    if recent_with_perf:
        response_times = [item['response_time_ms'] for item in recent_with_perf]
        time_stats = calculate_stats(response_times)
        
        print(f"⚡ PERFORMANCE METRICS (Recent Data)")
        print(f"Average response time: {time_stats['mean']:.0f}ms")
        print(f"Response time range: {time_stats['min']}ms - {time_stats['max']}ms")
        
        costs = [item.get('cost_usd', 0) for item in recent_with_perf]
        if any(costs):
            cost_stats = calculate_stats(costs)
            print(f"Average cost per prompt: ${cost_stats['mean']:.3f}")
            print(f"Total cost: ${sum(costs):.2f}")
        print()
    
    # Prompt length analysis
    print(f"📝 PROMPT LENGTH ANALYSIS")
    print(f"Average length: {length_stats['mean']:.1f} characters")
    print(f"Median length: {length_stats['median']:.1f} characters")
    print(f"Length range: {length_stats['min']} - {length_stats['max']} characters")
    
    # Categorize by length
    short_prompts = sum(1 for length in prompt_lengths if length <= 50)
    medium_prompts = sum(1 for length in prompt_lengths if 50 < length <= 150)
    long_prompts = sum(1 for length in prompt_lengths if length > 150)
    
    total = len(prompt_lengths)
    print(f"\nPrompt length distribution:")
    print(f"  Short (≤50 chars): {short_prompts} ({short_prompts/total*100:.1f}%)")
    print(f"  Medium (51-150 chars): {medium_prompts} ({medium_prompts/total*100:.1f}%)")
    print(f"  Long (>150 chars): {long_prompts} ({long_prompts/total*100:.1f}%)")
    print()
    
    # Poor quality prompts analysis
    poor_quality = [item for item in all_data if item['response_quality'] < 3.0]
    if poor_quality:
        print(f"⚠️  LOW QUALITY PROMPTS ANALYSIS")
        print(f"Number of low quality responses: {len(poor_quality)}")
        
        poor_lengths = [len(item['prompt']) for item in poor_quality]
        poor_categories = Counter(item['category'] for item in poor_quality)
        
        print(f"Common characteristics:")
        if poor_lengths:
            print(f"  Average prompt length: {sum(poor_lengths)/len(poor_lengths):.1f} characters")
        if poor_categories:
            most_common_cat = poor_categories.most_common(1)[0]
            print(f"  Most common category: {most_common_cat[0]} ({most_common_cat[1]} occurrences)")
        print()
    
    # Time-based analysis
    print(f"🕐 USAGE PATTERNS")
    
    # Extract hours from timestamps
    hours = []
    for item in all_data:
        try:
            dt = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
            hours.append(dt.hour)
        except:
            continue
    
    if hours:
        hour_counts = Counter(hours)
        peak_hour = hour_counts.most_common(1)[0][0]
        print(f"Peak usage hour: {peak_hour:02d}:00")
        
        print(f"Hourly distribution (top 5):")
        for hour, count in hour_counts.most_common(5):
            print(f"  {hour:02d}:00 - {count} prompts")

def export_summary():
    """Export a summary to JSON"""
    data_dir = Path(__file__).parent
    
    try:
        prompts_data = load_jsonl(data_dir / 'prompts.jsonl')
        recent_data = load_jsonl(data_dir / 'recent_prompts.jsonl')
        all_data = prompts_data + recent_data
        
        summary = {
            "generated_at": datetime.now().isoformat(),
            "total_prompts": len(all_data),
            "unique_users": len(set(item['user'] for item in all_data)),
            "date_range": {
                "start": min(item['timestamp'] for item in all_data),
                "end": max(item['timestamp'] for item in all_data)
            },
            "models": dict(Counter(item['model'] for item in all_data)),
            "categories": dict(Counter(item['category'] for item in all_data)),
            "quality_stats": calculate_stats([item['response_quality'] for item in all_data]),
            "token_stats": calculate_stats([item['tokens_used'] for item in all_data]),
            "prompt_length_stats": calculate_stats([len(item['prompt']) for item in all_data])
        }
        
        with open(data_dir / 'analysis_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print("📄 Analysis summary exported to 'analysis_summary.json'")
        
    except Exception as e:
        print(f"Error exporting summary: {e}")

def main():
    """Main function"""
    analyze_simple()
    print("\n" + "="*50)
    export_summary()

if __name__ == "__main__":
    main()
