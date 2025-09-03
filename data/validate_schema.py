#!/usr/bin/env python3
"""
Schema validation script for prompt analyzer data files.
Validates JSONL files against the defined schema.
"""

import json
import sys
from datetime import datetime
from typing import Dict, List, Any
import re
import os


class SchemaValidator:
    def __init__(self, schema_path: str):
        """Initialize validator with schema file."""
        with open(schema_path, "r") as f:
            self.schema = json.load(f)
        self.fields = self.schema["fields"]
        self.errors = []
        self.warnings = []

    def validate_field_type(
        self, value: Any, expected_type: str, field_name: str
    ) -> bool:
        """Validate field type."""
        type_mapping = {"string": str, "integer": int, "number": (int, float)}

        expected_python_type = type_mapping.get(expected_type)
        if expected_python_type and not isinstance(value, expected_python_type):
            self.errors.append(
                f"Field '{field_name}': expected {expected_type}, got {type(value).__name__}"
            )
            return False
        return True

    def validate_enum(
        self, value: Any, enum_values: List[str], field_name: str
    ) -> bool:
        """Validate enum values."""
        if value not in enum_values:
            self.errors.append(
                f"Field '{field_name}': '{value}' not in allowed values {enum_values}"
            )
            return False
        return True

    def validate_format(self, value: str, format_spec: str, field_name: str) -> bool:
        """Validate field format."""
        if format_spec == "usr_XXX":
            if not re.match(r"^usr_\d{3}$", value):
                self.errors.append(
                    f"Field '{field_name}': '{value}' doesn't match format 'usr_XXX'"
                )
                return False
        elif format_spec == "sess_XXXXXX":
            if not re.match(r"^sess_[a-zA-Z0-9]{6}$", value):
                self.errors.append(
                    f"Field '{field_name}': '{value}' doesn't match format 'sess_XXXXXX'"
                )
                return False
        elif format_spec == "YYYY-MM-DDTHH:mm:ssZ":
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                self.errors.append(
                    f"Field '{field_name}': '{value}' doesn't match ISO 8601 format"
                )
                return False
        return True

    def validate_range(self, value: Any, field_spec: Dict, field_name: str) -> bool:
        """Validate numeric ranges."""
        if "minimum" in field_spec and value < field_spec["minimum"]:
            self.errors.append(
                f"Field '{field_name}': {value} is below minimum {field_spec['minimum']}"
            )
            return False
        if "maximum" in field_spec and value > field_spec["maximum"]:
            self.errors.append(
                f"Field '{field_name}': {value} is above maximum {field_spec['maximum']}"
            )
            return False
        return True

    def validate_record(self, record: Dict, record_num: int) -> bool:
        """Validate a single record against the schema."""
        record_valid = True
        record_errors = []

        # Check required fields
        for field_name, field_spec in self.fields.items():
            if field_spec.get("required", False) and field_name not in record:
                record_errors.append(f"Missing required field '{field_name}'")
                record_valid = False
                continue

            if field_name not in record:
                continue  # Optional field not present

            value = record[field_name]

            # Type validation
            if not self.validate_field_type(value, field_spec["type"], field_name):
                record_valid = False
                continue

            # Enum validation
            if "enum" in field_spec:
                if not self.validate_enum(value, field_spec["enum"], field_name):
                    record_valid = False

            # Format validation
            if "format" in field_spec and isinstance(value, str):
                if not self.validate_format(value, field_spec["format"], field_name):
                    record_valid = False

            # Range validation for numbers
            if field_spec["type"] in ["integer", "number"]:
                if not self.validate_range(value, field_spec, field_name):
                    record_valid = False

        # Check for unexpected fields (not in schema)
        schema_fields = set(self.fields.keys())
        record_fields = set(record.keys())
        unexpected_fields = record_fields - schema_fields

        if unexpected_fields:
            self.warnings.append(
                f"Record {record_num}: Unexpected fields found: {unexpected_fields}"
            )

        if record_errors:
            for error in record_errors:
                self.errors.append(f"Record {record_num}: {error}")

        return record_valid

    def validate_file(self, file_path: str) -> Dict[str, Any]:
        """Validate a JSONL file."""
        results = {
            "file": file_path,
            "total_records": 0,
            "valid_records": 0,
            "invalid_records": 0,
            "errors": [],
            "warnings": [],
        }

        if not os.path.exists(file_path):
            results["errors"].append(f"File not found: {file_path}")
            return results

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        record = json.loads(line)
                        results["total_records"] += 1

                        # Reset errors and warnings for this record
                        self.errors = []
                        self.warnings = []

                        if self.validate_record(record, i):
                            results["valid_records"] += 1
                        else:
                            results["invalid_records"] += 1

                        # Collect errors and warnings
                        results["errors"].extend(self.errors)
                        results["warnings"].extend(self.warnings)

                    except json.JSONDecodeError as e:
                        results["errors"].append(f"Line {i}: Invalid JSON - {str(e)}")
                        results["invalid_records"] += 1

        except Exception as e:
            results["errors"].append(f"Error reading file: {str(e)}")

        return results


def main():
    """Main validation function."""
    # File paths
    schema_path = "/Users/jo-lin/prompt-analyzer/data/schema.json"
    data_files = [
        "/Users/jo-lin/prompt-analyzer/data/prompts.jsonl",
        "/Users/jo-lin/prompt-analyzer/data/recent_prompts.jsonl",
        "/Users/jo-lin/prompt-analyzer/data/expanded_prompts.jsonl",
        "/Users/jo-lin/prompt-analyzer/data/expanded_prompts_2.jsonl",
    ]

    print("🔍 Validating prompt analyzer data against schema...")
    print("=" * 60)

    # Initialize validator
    validator = SchemaValidator(schema_path)

    overall_results = {
        "total_files": 0,
        "valid_files": 0,
        "total_records": 0,
        "valid_records": 0,
        "invalid_records": 0,
    }

    # Validate each file
    for file_path in data_files:
        print(f"\n📄 Validating: {os.path.basename(file_path)}")
        print("-" * 40)

        results = validator.validate_file(file_path)
        overall_results["total_files"] += 1
        overall_results["total_records"] += results["total_records"]
        overall_results["valid_records"] += results["valid_records"]
        overall_results["invalid_records"] += results["invalid_records"]

        if results["invalid_records"] == 0 and not results["errors"]:
            overall_results["valid_files"] += 1
            print("✅ VALID - All records comply with schema")
        else:
            print("❌ INVALID - Schema violations found")

        print(f"   Total records: {results['total_records']}")
        print(f"   Valid records: {results['valid_records']}")
        print(f"   Invalid records: {results['invalid_records']}")

        if results["errors"]:
            print("\n🚨 ERRORS:")
            for error in results["errors"][:10]:  # Show first 10 errors
                print(f"   • {error}")
            if len(results["errors"]) > 10:
                print(f"   ... and {len(results['errors']) - 10} more errors")

        if results["warnings"]:
            print("\n⚠️  WARNINGS:")
            for warning in results["warnings"][:5]:  # Show first 5 warnings
                print(f"   • {warning}")
            if len(results["warnings"]) > 5:
                print(f"   ... and {len(results['warnings']) - 5} more warnings")

    # Overall summary
    print("\n" + "=" * 60)
    print("📊 OVERALL SUMMARY")
    print("=" * 60)
    print(f"Files validated: {overall_results['total_files']}")
    print(f"Files fully compliant: {overall_results['valid_files']}")
    print(f"Total records: {overall_results['total_records']}")
    print(f"Valid records: {overall_results['valid_records']}")
    print(f"Invalid records: {overall_results['invalid_records']}")

    if overall_results["invalid_records"] == 0:
        print("\n🎉 All data is schema-compliant!")
        return 0
    else:
        compliance_rate = (
            overall_results["valid_records"] / overall_results["total_records"]
        ) * 100
        print(f"\n📈 Schema compliance rate: {compliance_rate:.1f}%")
        return 1


if __name__ == "__main__":
    sys.exit(main())
