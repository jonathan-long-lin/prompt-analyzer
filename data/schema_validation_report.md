# Schema Validation Report

## Summary
After running a comprehensive validation against the defined schema, here are the findings:

### Overall Results
- **Files validated:** 4
- **Files fully compliant:** 2 (50%)
- **Total records:** 140
- **Valid records:** 40 (28.6%)
- **Invalid records:** 100 (71.4%)

## File-by-File Analysis

### ✅ COMPLIANT FILES

#### 1. `prompts.jsonl`
- **Status:** ✅ FULLY COMPLIANT
- **Records:** 25/25 valid
- **Issues:** None
- **Notes:** This file follows the schema perfectly with all required fields present and correctly formatted.

#### 2. `recent_prompts.jsonl`
- **Status:** ✅ FULLY COMPLIANT
- **Records:** 15/15 valid
- **Issues:** None
- **Notes:** This file also follows the schema correctly, including optional fields like `prompt_length`, `response_time_ms`, and `cost_usd`.

### ❌ NON-COMPLIANT FILES

#### 3. `expanded_prompts.jsonl`
- **Status:** ❌ NON-COMPLIANT
- **Records:** 0/50 valid
- **Issues:** Multiple schema violations

**Major Issues:**
1. **Different field structure:** Uses different field names than the schema expects
   - Has `user_name` instead of `user`
   - Has `model_used` instead of `model`
   - Has `quality_score` instead of `response_quality`
   - Contains additional fields: `prompt_id`, `response`, `language`, `cost`, `response_time`

2. **User ID format mismatch:** Uses format `u_XXX` instead of required `usr_XXX`

3. **Category values in Japanese:** Uses Japanese category names (e.g., "教育", "技術") instead of English enum values defined in schema

4. **Missing required fields:** 
   - `user` (uses `user_name` instead)
   - `model` (uses `model_used` instead)
   - `response_quality` (uses `quality_score` instead)
   - `session_id`

#### 4. `expanded_prompts_2.jsonl`
- **Status:** ❌ NON-COMPLIANT
- **Records:** 0/50 valid
- **Issues:** Same issues as `expanded_prompts.jsonl`

**Major Issues:**
- Identical structure and issues to `expanded_prompts.jsonl`
- Same field naming inconsistencies
- Same user ID format issues
- Same Japanese category values
- Same missing required fields

## Detailed Issue Analysis

### 1. Field Name Mismatches
The expanded prompt files use a different schema structure:

| Schema Field | Expanded Files Field | Status |
|--------------|---------------------|--------|
| `user` | `user_name` | ❌ Mismatch |
| `model` | `model_used` | ❌ Mismatch |
| `response_quality` | `quality_score` | ❌ Mismatch |
| `tokens_used` | `tokens_used` | ✅ Match |
| `timestamp` | `timestamp` | ✅ Match |

### 2. Additional Fields in Expanded Files
The expanded files contain extra fields not in the schema:
- `prompt_id`
- `user_name` (instead of `user`)
- `response`
- `model_used` (instead of `model`)
- `quality_score` (instead of `response_quality`)
- `response_time` (similar to optional `response_time_ms`)
- `cost` (similar to optional `cost_usd`)
- `language`

### 3. Format Issues
- **User IDs:** Schema expects `usr_XXX`, but expanded files use `u_XXX`
- **Categories:** Schema defines English categories, but expanded files use Japanese categories

### 4. Language/Localization Issues
The expanded files appear to be localized versions with:
- Japanese category names
- Japanese user names
- Mixed language content

## Recommendations

### Option 1: Update Schema to Accommodate Expanded Files
If the expanded files represent the desired format:
1. Update schema to include additional fields
2. Add Japanese category mappings
3. Allow alternative user ID format
4. Add language field support

### Option 2: Transform Expanded Files to Match Schema
If the current schema is authoritative:
1. Map field names (e.g., `user_name` → `user`)
2. Convert Japanese categories to English equivalents
3. Transform user IDs from `u_XXX` to `usr_XXX` format
4. Add missing required fields like `session_id`

### Option 3: Separate Schema Versions
Create different schema versions for different data types:
1. Keep current schema for basic prompt data
2. Create extended schema for detailed/expanded data
3. Define clear transformation mappings between schemas

## Category Mapping Needed
If keeping expanded files, create mapping for Japanese categories:
- "教育" → "education"
- "技術" → "technology"  
- "ビジネス" → "business"
- "デザイン" → "design"
- "健康" → "health"
- "料理" → "cooking"
- "フィットネス" → "fitness"
- "ライフスタイル" → "self-improvement"
- "仕事" → "business"
- "セキュリティ" → "security"
- "金融" → "finance"
- "環境" → "environment"

## Next Steps
1. Decide on the authoritative schema approach
2. Either update schema or transform data files
3. Implement consistent field naming
4. Resolve category and format mismatches
5. Re-validate after changes
