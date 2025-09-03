"""
Data service for loading and analyzing prompt datasets with proper JSON serialization
"""

import json
import polars as pl
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
from collections import defaultdict
import statistics


def convert_to_json_serializable(obj):
    """Convert polars/numpy types to JSON serializable types"""
    if obj is None:
        return None
    elif isinstance(obj, datetime):
        return obj.strftime("%Y-%m-%dT%H:%M:%S")
    elif isinstance(obj, (np.integer)):
        return int(obj)
    elif isinstance(obj, (np.floating)):
        val = float(obj)
        return val if not (np.isnan(val) or np.isinf(val)) else None
    elif isinstance(obj, (int, float)):
        # Handle regular Python int/float
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        return obj
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif hasattr(obj, "item") and not isinstance(
        obj, (int, float)
    ):  # polars scalar only
        try:
            val = obj.item()
            if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
                return None
            return val
        except (ValueError, AttributeError):
            return str(obj)
    else:
        return obj


class PromptDataService:
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = Path(data_dir)
        self.df = None
        self.load_data()

    def load_jsonl(self, filepath: Path) -> List[Dict]:
        """Load JSON Lines file into a list of dictionaries"""
        data = []
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    data.append(json.loads(line.strip()))
        except FileNotFoundError:
            print(f"Warning: {filepath} not found")
            return []
        return data

    def load_data(self):
        """Load all prompt datasets"""
        prompts_data = self.load_jsonl(self.data_dir / "prompts.jsonl")
        recent_data = self.load_jsonl(self.data_dir / "recent_prompts.jsonl")
        expanded_data = self.load_jsonl(self.data_dir / "expanded_prompts.jsonl")
        expanded_data_2 = self.load_jsonl(self.data_dir / "expanded_prompts_2.jsonl")

        all_data = prompts_data + recent_data + expanded_data + expanded_data_2

        if all_data:
            self.df = pl.DataFrame(all_data)
            print(f"Loaded {len(self.df)} records")
            print(f"Available columns: {list(self.df.columns)}")

            # Convert timestamp to datetime and add derived columns
            self.df = self.df.with_columns(
                [
                    pl.col("timestamp")
                    .str.to_datetime(format="%+", time_zone="UTC")
                    .alias("timestamp"),
                    pl.col("prompt").str.len_chars().alias("prompt_length"),
                ]
            ).with_columns(
                [
                    pl.col("timestamp").dt.date().alias("date"),
                    pl.col("timestamp").dt.hour().alias("hour"),
                    pl.col("timestamp").dt.strftime("%A").alias("day_of_week"),
                ]
            )

    def get_overview_stats(self) -> Dict[str, Any]:
        """Get overview statistics"""
        if self.df is None or len(self.df) == 0:
            return {}

        # Get min/max timestamps
        min_timestamp = self.df["timestamp"].min()
        max_timestamp = self.df["timestamp"].max()

        # Get aggregated values
        avg_quality_val = self.df["response_quality"].mean()
        avg_quality = convert_to_json_serializable(avg_quality_val)

        total_cost_val = (
            self.df["cost_usd"].sum() if "cost_usd" in self.df.columns else 0
        )
        total_cost = convert_to_json_serializable(total_cost_val)

        return {
            "total_prompts": int(len(self.df)),
            "unique_users": int(self.df["user_id"].n_unique()),
            "date_range": {
                "start": str(min_timestamp).replace(" ", "T")
                if min_timestamp is not None
                else "",
                "end": str(max_timestamp).replace(" ", "T")
                if max_timestamp is not None
                else "",
            },
            "total_tokens": int(self.df["tokens_used"].sum()),
            "avg_quality": round(float(avg_quality), 2)
            if avg_quality is not None and isinstance(avg_quality, (int, float))
            else 0.0,
            "total_cost": round(float(total_cost), 2)
            if total_cost is not None and isinstance(total_cost, (int, float))
            else 0.0,
        }

    def get_user_aggregations(self, limit: int = 10) -> Dict[str, Any]:
        """Get aggregated statistics by user_id"""
        if self.df is None or len(self.df) == 0:
            return {}

        # Create aggregation using polars
        agg_cols = [
            pl.col("prompt").count().alias("prompt_count"),
            pl.col("tokens_used").sum().alias("tokens_used_sum"),
            pl.col("tokens_used").mean().alias("tokens_used_mean"),
            pl.col("response_quality").mean().alias("response_quality_mean"),
            pl.col("prompt_length").mean().alias("prompt_length_mean"),
            pl.col("timestamp").min().alias("timestamp_min"),
            pl.col("timestamp").max().alias("timestamp_max"),
        ]

        # Add cost_usd aggregation if column exists
        if "cost_usd" in self.df.columns:
            agg_cols.append(pl.col("cost_usd").sum().alias("cost_usd_sum"))

        user_stats = (
            self.df.group_by("user_id")
            .agg(agg_cols)
            .sort("prompt_count", descending=True)
            .head(limit)
        )

        # Convert to list of dictionaries
        result = []
        for row in user_stats.iter_rows(named=True):
            user_id = row["user_id"]

            # Get user name for this user_id
            try:
                if "user_name" in self.df.columns:
                    user_name_row = (
                        self.df.filter(pl.col("user_id") == user_id)
                        .select("user_name")
                        .head(1)
                    )
                    if len(user_name_row) > 0:
                        user_name_value = user_name_row.item(0, 0)
                        if user_name_value is None or str(user_name_value).lower() in [
                            "nan",
                            "none",
                        ]:
                            user_name = f"User {user_id}"
                        else:
                            user_name = str(user_name_value)
                    else:
                        user_name = f"User {user_id}"
                else:
                    user_name = f"User {user_id}"
            except Exception:
                # Fallback if anything goes wrong
                user_name = f"User {user_id}"

            avg_tokens = convert_to_json_serializable(row["tokens_used_mean"])
            avg_quality = convert_to_json_serializable(row["response_quality_mean"])
            avg_prompt_length = convert_to_json_serializable(row["prompt_length_mean"])

            result.append(
                {
                    "user_id": str(user_id),
                    "user_name": str(user_name),
                    "prompt_count": convert_to_json_serializable(row["prompt_count"]),
                    "total_tokens": convert_to_json_serializable(
                        row["tokens_used_sum"]
                    ),
                    "avg_tokens": round(float(avg_tokens), 1)
                    if avg_tokens is not None
                    else 0.0,
                    "avg_quality": round(float(avg_quality), 2)
                    if avg_quality is not None
                    else 0.0,
                    "avg_prompt_length": round(float(avg_prompt_length), 1)
                    if avg_prompt_length is not None
                    else 0.0,
                    "first_prompt": str(row["timestamp_min"]).replace(" ", "T"),
                    "last_prompt": str(row["timestamp_max"]).replace(" ", "T"),
                    "total_cost": round(float(row.get("cost_usd_sum", 0)), 3)
                    if "cost_usd_sum" in row and row.get("cost_usd_sum") is not None
                    else 0.0,
                }
            )

        return {"users": result, "total_users": int(self.df["user_id"].n_unique())}

    def get_temporal_analysis(self, period: str = "daily") -> Dict[str, Any]:
        """Get temporal analysis by different time periods"""
        if self.df is None or len(self.df) == 0:
            return {}

        if period == "hourly":
            # Group by hour of day
            temporal_data = (
                self.df.group_by("hour")
                .agg(
                    [
                        pl.col("prompt").count().alias("prompt_count"),
                        pl.col("tokens_used").sum().alias("tokens_used"),
                        pl.col("response_quality").mean().alias("response_quality"),
                    ]
                )
                .sort("hour")
            )

            result = []
            for row in temporal_data.iter_rows(named=True):
                result.append(
                    {
                        "period": f"{row['hour']:02d}:00",
                        "period_value": row["hour"],
                        "prompt_count": int(row["prompt_count"]),
                        "total_tokens": int(row["tokens_used"]),
                        "avg_quality": round(float(row["response_quality"]), 2),
                    }
                )

        elif period == "daily":
            # Group by date
            temporal_data = (
                self.df.group_by("date")
                .agg(
                    [
                        pl.col("prompt").count().alias("prompt_count"),
                        pl.col("tokens_used").sum().alias("tokens_used"),
                        pl.col("response_quality").mean().alias("response_quality"),
                        pl.col("user_id").n_unique().alias("user_id"),
                    ]
                )
                .sort("date")
            )

            result = []
            for row in temporal_data.iter_rows(named=True):
                date_obj = row["date"]
                date_str = (
                    date_obj.strftime("%Y-%m-%d")
                    if hasattr(date_obj, "strftime")
                    else str(date_obj)
                )
                result.append(
                    {
                        "period": date_str,
                        "period_value": date_str,
                        "prompt_count": int(row["prompt_count"]),
                        "total_tokens": int(row["tokens_used"]),
                        "avg_quality": round(float(row["response_quality"]), 2),
                        "unique_users": int(row["user_id"]),
                    }
                )

        elif period == "weekly":
            # Group by week - we'll use a different approach for polars
            df_with_week = self.df.with_columns(
                [pl.col("timestamp").dt.strftime("%Y-W%U").alias("week")]
            )

            temporal_data = (
                df_with_week.group_by("week")
                .agg(
                    [
                        pl.col("prompt").count().alias("prompt_count"),
                        pl.col("tokens_used").sum().alias("tokens_used"),
                        pl.col("response_quality").mean().alias("response_quality"),
                        pl.col("user_id").n_unique().alias("user_id"),
                    ]
                )
                .sort("week")
            )

            result = []
            for row in temporal_data.iter_rows(named=True):
                week_str = row["week"]
                result.append(
                    {
                        "period": f"Week of {week_str}",
                        "period_value": week_str,
                        "prompt_count": int(row["prompt_count"]),
                        "total_tokens": int(row["tokens_used"]),
                        "avg_quality": round(float(row["response_quality"]), 2),
                        "unique_users": int(row["user_id"]),
                    }
                )

        return {
            "period_type": period,
            "data": sorted(result, key=lambda x: x["period_value"]),
        }

    def get_model_performance(self) -> Dict[str, Any]:
        """Get model performance analysis"""
        if self.df is None or len(self.df) == 0:
            return {}

        agg_cols = [
            pl.col("prompt").count().alias("prompt_count"),
            pl.col("tokens_used").sum().alias("tokens_used_sum"),
            pl.col("tokens_used").mean().alias("tokens_used_mean"),
            pl.col("response_quality").mean().alias("response_quality_mean"),
        ]

        # Add optional columns if they exist
        if "response_time_ms" in self.df.columns:
            agg_cols.append(
                pl.col("response_time_ms").mean().alias("response_time_ms_mean")
            )

        if "cost" in self.df.columns:
            agg_cols.append(pl.col("cost").sum().alias("cost_sum"))

        model_stats = (
            self.df.group_by("model")
            .agg(agg_cols)
            .sort("prompt_count", descending=True)
        )

        result = []
        total_prompts = len(self.df)
        for row in model_stats.iter_rows(named=True):
            result.append(
                {
                    "model": row["model"],
                    "prompt_count": int(row["prompt_count"]),
                    "total_tokens": int(row["tokens_used_sum"]),
                    "avg_tokens": round(float(row["tokens_used_mean"]), 1),
                    "avg_quality": round(float(row["response_quality_mean"]), 2),
                    "avg_response_time": round(
                        float(row.get("response_time_ms_mean", 0)), 0
                    ),
                    "total_cost": round(float(row.get("cost_sum", 0)), 3),
                    "usage_percentage": round(
                        (row["prompt_count"] / total_prompts) * 100, 1
                    ),
                }
            )

        return {"models": result}

    def get_category_analysis(self) -> Dict[str, Any]:
        """Get category analysis"""
        if self.df is None or len(self.df) == 0:
            return {}

        category_stats = (
            self.df.group_by("category")
            .agg(
                [
                    pl.col("prompt").count().alias("prompt_count"),
                    pl.col("tokens_used").mean().alias("tokens_used"),
                    pl.col("response_quality").mean().alias("response_quality"),
                    pl.col("prompt_length").mean().alias("prompt_length"),
                ]
            )
            .sort("prompt_count", descending=True)
        )

        result = []
        total_prompts = len(self.df)
        for row in category_stats.iter_rows(named=True):
            result.append(
                {
                    "category": row["category"],
                    "prompt_count": int(row["prompt_count"]),
                    "avg_tokens": round(float(row["tokens_used"]), 1),
                    "avg_quality": round(float(row["response_quality"]), 2),
                    "avg_prompt_length": round(float(row["prompt_length"]), 1),
                    "usage_percentage": round(
                        (row["prompt_count"] / total_prompts) * 100, 1
                    ),
                }
            )

        return {"categories": result}

    def get_quality_insights(self) -> Dict[str, Any]:
        """Get quality insights and patterns"""
        if self.df is None or len(self.df) == 0:
            return {}

        # Quality distribution using polars cut-like functionality
        df_with_quality_bins = self.df.with_columns(
            [
                pl.when(pl.col("response_quality") <= 2.0)
                .then(pl.lit("Poor"))
                .when(pl.col("response_quality") <= 3.0)
                .then(pl.lit("Fair"))
                .when(pl.col("response_quality") <= 4.0)
                .then(pl.lit("Good"))
                .otherwise(pl.lit("Excellent"))
                .alias("quality_bin")
            ]
        )

        quality_dist = (
            df_with_quality_bins.group_by("quality_bin")
            .agg(pl.count().alias("count"))
            .to_dict(as_series=False)
        )

        # Convert to dictionary
        quality_distribution = {
            bin_name: count
            for bin_name, count in zip(
                quality_dist["quality_bin"], quality_dist["count"]
            )
        }

        # Low quality analysis
        low_quality = self.df.filter(pl.col("response_quality") < 3.0)

        # Get statistics
        avg_quality_val = self.df["response_quality"].mean()
        quality_std_val = self.df["response_quality"].std()

        # Convert to python types safely using our converter
        avg_quality = convert_to_json_serializable(avg_quality_val)
        quality_std = convert_to_json_serializable(quality_std_val)

        insights = {
            "quality_distribution": quality_distribution,
            "avg_quality": round(float(avg_quality), 2)
            if avg_quality is not None and isinstance(avg_quality, (int, float))
            else 0.0,
            "quality_std": round(float(quality_std), 2)
            if quality_std is not None and isinstance(quality_std, (int, float))
            else 0.0,
            "low_quality_count": len(low_quality),
            "low_quality_characteristics": {},
        }

        if len(low_quality) > 0:
            # Get most common category and model for low quality
            most_common_category = (
                low_quality.group_by("category")
                .agg(pl.count().alias("count"))
                .sort("count", descending=True)
                .head(1)
            )

            most_common_model = (
                low_quality.group_by("model")
                .agg(pl.count().alias("count"))
                .sort("count", descending=True)
                .head(1)
            )

            avg_prompt_length_val = low_quality["prompt_length"].mean()
            avg_prompt_length = convert_to_json_serializable(avg_prompt_length_val)

            insights["low_quality_characteristics"] = {
                "avg_prompt_length": round(float(avg_prompt_length), 1)
                if avg_prompt_length is not None
                and isinstance(avg_prompt_length, (int, float))
                else 0.0,
                "most_common_category": most_common_category.item(0, 0)
                if len(most_common_category) > 0
                else "N/A",
                "most_common_model": most_common_model.item(0, 0)
                if len(most_common_model) > 0
                else "N/A",
            }

        return insights


# Global instance
data_service = PromptDataService()
