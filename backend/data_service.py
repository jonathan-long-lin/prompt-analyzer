"""
Data service for loading and analyzing prompt datasets
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
import statistics

class PromptDataService:
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = Path(data_dir)
        self.df = None
        self.load_data()
    
    def load_jsonl(self, filepath: Path) -> List[Dict]:
        """Load JSON Lines file into a list of dictionaries"""
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    data.append(json.loads(line.strip()))
        except FileNotFoundError:
            print(f"Warning: {filepath} not found")
            return []
        return data
    
    def load_data(self):
        """Load all prompt datasets"""
        prompts_data = self.load_jsonl(self.data_dir / 'prompts.jsonl')
        recent_data = self.load_jsonl(self.data_dir / 'recent_prompts.jsonl')
        
        all_data = prompts_data + recent_data
        
        if all_data:
            self.df = pd.DataFrame(all_data)
            # Convert timestamp to datetime
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            # Add derived columns
            self.df['prompt_length'] = self.df['prompt'].str.len()
            self.df['date'] = self.df['timestamp'].dt.date
            self.df['hour'] = self.df['timestamp'].dt.hour
            self.df['day_of_week'] = self.df['timestamp'].dt.day_name()
            
    def get_overview_stats(self) -> Dict[str, Any]:
        """Get overview statistics"""
        if self.df is None or self.df.empty:
            return {}
        
        return {
            "total_prompts": len(self.df),
            "unique_users": self.df['user_id'].nunique(),
            "date_range": {
                "start": self.df['timestamp'].min().isoformat(),
                "end": self.df['timestamp'].max().isoformat()
            },
            "total_tokens": int(self.df['tokens_used'].sum()),
            "avg_quality": round(self.df['response_quality'].mean(), 2),
            "total_cost": round(self.df['cost_usd'].sum(), 2) if 'cost_usd' in self.df.columns else 0
        }
    
    def get_user_aggregations(self, limit: int = 10) -> Dict[str, Any]:
        """Get aggregated statistics by user_id"""
        if self.df is None or self.df.empty:
            return {}
        
        user_stats = self.df.groupby('user_id').agg({
            'prompt': 'count',
            'tokens_used': ['sum', 'mean'],
            'response_quality': 'mean',
            'prompt_length': 'mean',
            'timestamp': ['min', 'max'],
            'cost_usd': 'sum' if 'cost_usd' in self.df.columns else lambda x: 0
        }).round(2)
        
        # Flatten column names
        user_stats.columns = ['_'.join(col).strip() if col[1] else col[0] for col in user_stats.columns.values]
        
        # Add user names
        user_names = self.df.groupby('user_id')['user'].first()
        user_stats['user_name'] = user_names
        
        # Sort by prompt count
        user_stats = user_stats.sort_values('prompt_count', ascending=False)
        
        # Convert to list of dictionaries
        result = []
        for user_id, row in user_stats.head(limit).iterrows():
            result.append({
                "user_id": user_id,
                "user_name": row['user_name'],
                "prompt_count": int(row['prompt_count']),
                "total_tokens": int(row['tokens_used_sum']),
                "avg_tokens": round(row['tokens_used_mean'], 1),
                "avg_quality": round(row['response_quality_mean'], 2),
                "avg_prompt_length": round(row['prompt_length_mean'], 1),
                "first_prompt": row['timestamp_min'].isoformat(),
                "last_prompt": row['timestamp_max'].isoformat(),
                "total_cost": round(row.get('cost_usd_sum', 0), 3)
            })
        
        return {
            "users": result,
            "total_users": self.df['user_id'].nunique()
        }
    
    def get_temporal_analysis(self, period: str = "daily") -> Dict[str, Any]:
        """Get temporal analysis by different time periods"""
        if self.df is None or self.df.empty:
            return {}
        
        if period == "hourly":
            # Group by hour of day
            temporal_data = self.df.groupby('hour').agg({
                'prompt': 'count',
                'tokens_used': 'sum',
                'response_quality': 'mean'
            }).round(2)
            
            result = []
            for hour, row in temporal_data.iterrows():
                result.append({
                    "period": f"{hour:02d}:00",
                    "period_value": hour,
                    "prompt_count": int(row['prompt_count']),
                    "total_tokens": int(row['tokens_used']),
                    "avg_quality": round(row['response_quality'], 2)
                })
                
        elif period == "daily":
            # Group by date
            temporal_data = self.df.groupby('date').agg({
                'prompt': 'count',
                'tokens_used': 'sum',
                'response_quality': 'mean',
                'user_id': 'nunique'
            }).round(2)
            
            result = []
            for date, row in temporal_data.iterrows():
                result.append({
                    "period": date.isoformat(),
                    "period_value": date.isoformat(),
                    "prompt_count": int(row['prompt_count']),
                    "total_tokens": int(row['tokens_used']),
                    "avg_quality": round(row['response_quality'], 2),
                    "unique_users": int(row['user_id'])
                })
                
        elif period == "weekly":
            # Group by week
            self.df['week'] = self.df['timestamp'].dt.to_period('W')
            temporal_data = self.df.groupby('week').agg({
                'prompt': 'count',
                'tokens_used': 'sum',
                'response_quality': 'mean',
                'user_id': 'nunique'
            }).round(2)
            
            result = []
            for week, row in temporal_data.iterrows():
                result.append({
                    "period": f"Week of {week.start_time.date()}",
                    "period_value": week.start_time.isoformat(),
                    "prompt_count": int(row['prompt_count']),
                    "total_tokens": int(row['tokens_used']),
                    "avg_quality": round(row['response_quality'], 2),
                    "unique_users": int(row['user_id'])
                })
                
        return {
            "period_type": period,
            "data": sorted(result, key=lambda x: x['period_value'])
        }
    
    def get_model_performance(self) -> Dict[str, Any]:
        """Get model performance analysis"""
        if self.df is None or self.df.empty:
            return {}
        
        model_stats = self.df.groupby('model').agg({
            'prompt': 'count',
            'tokens_used': ['sum', 'mean'],
            'response_quality': 'mean',
            'response_time_ms': 'mean' if 'response_time_ms' in self.df.columns else lambda x: 0,
            'cost_usd': 'sum' if 'cost_usd' in self.df.columns else lambda x: 0
        }).round(2)
        
        # Flatten column names
        model_stats.columns = ['_'.join(col).strip() if col[1] else col[0] for col in model_stats.columns.values]
        
        result = []
        for model, row in model_stats.iterrows():
            result.append({
                "model": model,
                "prompt_count": int(row['prompt_count']),
                "total_tokens": int(row['tokens_used_sum']),
                "avg_tokens": round(row['tokens_used_mean'], 1),
                "avg_quality": round(row['response_quality_mean'], 2),
                "avg_response_time": round(row.get('response_time_ms_mean', 0), 0),
                "total_cost": round(row.get('cost_usd_sum', 0), 3),
                "usage_percentage": round((row['prompt_count'] / len(self.df)) * 100, 1)
            })
        
        # Sort by usage count
        result = sorted(result, key=lambda x: x['prompt_count'], reverse=True)
        
        return {"models": result}
    
    def get_category_analysis(self) -> Dict[str, Any]:
        """Get category analysis"""
        if self.df is None or self.df.empty:
            return {}
        
        category_stats = self.df.groupby('category').agg({
            'prompt': 'count',
            'tokens_used': 'mean',
            'response_quality': 'mean',
            'prompt_length': 'mean'
        }).round(2)
        
        result = []
        for category, row in category_stats.iterrows():
            result.append({
                "category": category,
                "prompt_count": int(row['prompt_count']),
                "avg_tokens": round(row['tokens_used'], 1),
                "avg_quality": round(row['response_quality'], 2),
                "avg_prompt_length": round(row['prompt_length'], 1),
                "usage_percentage": round((row['prompt_count'] / len(self.df)) * 100, 1)
            })
        
        # Sort by usage count
        result = sorted(result, key=lambda x: x['prompt_count'], reverse=True)
        
        return {"categories": result}
    
    def get_quality_insights(self) -> Dict[str, Any]:
        """Get quality insights and patterns"""
        if self.df is None or self.df.empty:
            return {}
        
        # Quality distribution
        quality_bins = pd.cut(self.df['response_quality'], bins=[0, 2, 3, 4, 5], labels=['Poor', 'Fair', 'Good', 'Excellent'])
        quality_dist = quality_bins.value_counts().to_dict()
        
        # Low quality analysis
        low_quality = self.df[self.df['response_quality'] < 3.0]
        
        insights = {
            "quality_distribution": {k: int(v) for k, v in quality_dist.items()},
            "avg_quality": round(self.df['response_quality'].mean(), 2),
            "quality_std": round(self.df['response_quality'].std(), 2),
            "low_quality_count": len(low_quality),
            "low_quality_characteristics": {}
        }
        
        if not low_quality.empty:
            insights["low_quality_characteristics"] = {
                "avg_prompt_length": round(low_quality['prompt_length'].mean(), 1),
                "most_common_category": low_quality['category'].mode().iloc[0] if not low_quality['category'].mode().empty else "N/A",
                "most_common_model": low_quality['model'].mode().iloc[0] if not low_quality['model'].mode().empty else "N/A"
            }
        
        return insights

# Global instance
data_service = PromptDataService()
