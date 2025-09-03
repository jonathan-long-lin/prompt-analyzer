#!/usr/bin/env python3
"""
Data transformation script to fix expanded_prompts.jsonl and expanded_prompts_2.jsonl
to comply with the schema.
"""

import json
import sys
from typing import Dict, Any


class DataTransformer:
    def __init__(self):
        """Initialize the transformer with category mappings."""
        # Mapping from Japanese categories to English schema categories
        self.category_mapping = {
            "教育": "education",
            "技術": "technology",
            "ビジネス": "business",
            "デザイン": "design",
            "健康": "health",
            "料理": "cooking",
            "フィットネス": "fitness",
            "ライフスタイル": "self-improvement",
            "仕事": "business",
            "セキュリティ": "security",
            "金融": "finance",
            "環境": "environment",
            "nonprofit": "business",  # Map nonprofit to business as closest match
            "sustainability": "environment",  # Map sustainability to environment
        }

        # Counter for generating session IDs
        self.session_counter = 1

    def transform_user_id(self, user_id: str) -> str:
        """Transform user_id from u_XXX format to usr_XXX format."""
        if user_id.startswith("u_"):
            # Extract the number part and reformat
            number_part = user_id[2:]
            return f"usr_{number_part.zfill(3)}"
        return user_id

    def transform_category(self, category: str) -> str:
        """Transform category from Japanese to English."""
        return self.category_mapping.get(category, category.lower())

    def generate_session_id(self) -> str:
        """Generate a session ID in the required format."""
        session_id = f"sess_{self.session_counter:06d}"
        self.session_counter += 1
        return session_id

    def map_model_name(self, model_used: str) -> str:
        """Map model names to schema-compliant values."""
        model_mapping = {
            "gpt-4": "gpt-4",
            "gpt-3.5-turbo": "gpt-3.5-turbo",
            "claude-3": "claude-3-opus",  # Map claude-3 to claude-3-opus
            "claude-3-opus": "claude-3-opus",
            "claude-3-sonnet": "claude-3-sonnet",
            "gemini-pro": "gemini-pro",
            "gpt-4-turbo": "gpt-4-turbo",
        }
        return model_mapping.get(model_used, "gpt-4")  # Default to gpt-4 if unknown

    def transform_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a single record to comply with the schema."""
        transformed = {}

        # Copy basic fields that match the schema
        if "prompt" in record:
            transformed["prompt"] = record["prompt"]

        # Transform user_name to user
        if "user_name" in record:
            transformed["user"] = record["user_name"]

        # Transform user_id format
        if "user_id" in record:
            transformed["user_id"] = self.transform_user_id(record["user_id"])

        # Copy timestamp as-is
        if "timestamp" in record:
            transformed["timestamp"] = record["timestamp"]

        # Transform model_used to model
        if "model_used" in record:
            transformed["model"] = self.map_model_name(record["model_used"])

        # Transform category
        if "category" in record:
            transformed["category"] = self.transform_category(record["category"])

        # Copy tokens_used as-is
        if "tokens_used" in record:
            transformed["tokens_used"] = record["tokens_used"]

        # Transform quality_score to response_quality
        if "quality_score" in record:
            transformed["response_quality"] = record["quality_score"]

        # Generate session_id (required field that's missing)
        transformed["session_id"] = self.generate_session_id()

        # Add optional fields if they exist and map them correctly
        if "prompt_length" in record:
            transformed["prompt_length"] = record["prompt_length"]

        # Map response_time to response_time_ms
        if "response_time" in record:
            transformed["response_time_ms"] = record["response_time"]

        # Map cost to cost_usd
        if "cost" in record:
            transformed["cost_usd"] = record["cost"]

        return transformed

    def transform_file(self, input_file: str, output_file: str) -> Dict[str, Any]:
        """Transform an entire file."""
        results = {
            "input_file": input_file,
            "output_file": output_file,
            "records_processed": 0,
            "records_transformed": 0,
            "errors": [],
        }

        try:
            with open(input_file, "r", encoding="utf-8") as infile:
                with open(output_file, "w", encoding="utf-8") as outfile:
                    for line_num, line in enumerate(infile, 1):
                        line = line.strip()
                        if not line:
                            continue

                        try:
                            record = json.loads(line)
                            results["records_processed"] += 1

                            transformed_record = self.transform_record(record)

                            # Write the transformed record
                            json.dump(transformed_record, outfile, ensure_ascii=False)
                            outfile.write("\n")

                            results["records_transformed"] += 1

                        except json.JSONDecodeError as e:
                            error_msg = f"Line {line_num}: Invalid JSON - {str(e)}"
                            results["errors"].append(error_msg)
                        except Exception as e:
                            error_msg = (
                                f"Line {line_num}: Transformation error - {str(e)}"
                            )
                            results["errors"].append(error_msg)

        except Exception as e:
            results["errors"].append(f"File processing error: {str(e)}")

        return results


def main():
    """Main transformation function."""
    files_to_transform = [
        ("expanded_prompts.jsonl", "expanded_prompts_fixed.jsonl"),
        ("expanded_prompts_2.jsonl", "expanded_prompts_2_fixed.jsonl"),
    ]

    print("🔧 Transforming expanded prompt files to comply with schema...")
    print("=" * 70)

    transformer = DataTransformer()
    overall_results = {
        "total_files": 0,
        "successful_files": 0,
        "total_records": 0,
        "transformed_records": 0,
    }

    for input_file, output_file in files_to_transform:
        print(f"\n📄 Transforming: {input_file} → {output_file}")
        print("-" * 50)

        results = transformer.transform_file(input_file, output_file)
        overall_results["total_files"] += 1
        overall_results["total_records"] += results["records_processed"]
        overall_results["transformed_records"] += results["records_transformed"]

        if (
            results["records_transformed"] == results["records_processed"]
            and not results["errors"]
        ):
            overall_results["successful_files"] += 1
            print("✅ SUCCESS - All records transformed")
        else:
            print("⚠️  PARTIAL SUCCESS - Some issues encountered")

        print(f"   Records processed: {results['records_processed']}")
        print(f"   Records transformed: {results['records_transformed']}")

        if results["errors"]:
            print("\n🚨 ERRORS:")
            for error in results["errors"][:5]:  # Show first 5 errors
                print(f"   • {error}")
            if len(results["errors"]) > 5:
                print(f"   ... and {len(results['errors']) - 5} more errors")

    # Overall summary
    print("\n" + "=" * 70)
    print("📊 TRANSFORMATION SUMMARY")
    print("=" * 70)
    print(f"Files processed: {overall_results['total_files']}")
    print(f"Files successfully transformed: {overall_results['successful_files']}")
    print(f"Total records: {overall_results['total_records']}")
    print(f"Records transformed: {overall_results['transformed_records']}")

    if overall_results["transformed_records"] == overall_results["total_records"]:
        print("\n🎉 All records successfully transformed!")
        print("\nNext steps:")
        print("1. Validate the transformed files with: python3 validate_schema.py")
        print("2. If validation passes, replace the original files:")
        print("   mv expanded_prompts_fixed.jsonl expanded_prompts.jsonl")
        print("   mv expanded_prompts_2_fixed.jsonl expanded_prompts_2.jsonl")
        return 0
    else:
        success_rate = (
            overall_results["transformed_records"] / overall_results["total_records"]
        ) * 100
        print(f"\n📈 Transformation success rate: {success_rate:.1f}%")
        print("Please review the errors above before proceeding.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
