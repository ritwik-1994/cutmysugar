import csv
import os

SOURCE_PATH = "/Users/ritwikmac/Cutmysugar/Database/Gi_gl_master_Final_with_search_text.csv"
DEST_PATH = "/Users/ritwikmac/Cutmysugar/src/assets/data/gi_gl_master.csv"

# Mapping from Source Header -> Destination Header
# Note: Source headers must match EXACTLY (keys are case sensitive and space sensitive)
HEADER_MAPPING = {
    "food_id": "food_id",
    "canonical_name": "canonical_name",
    "canonical_name_original": "canonical_name_original",
    "primary_category": "primary_category",
    "serving_type": "serving_type",
    "Serving size G": "serving_size_g",
    "Serving size min ": "serving_size_min_g", # Note the trailing space
    "Serving Size Max": "serving_size_max_g",
    "Serving size confidence": "serving_size_confidence",
    "gi": "gi",
    "gi_evidence": "gi_evidence",
    "gl_median": "gl_median",
    "gl_min": "gl_min",
    "gl_max": "gl_max",
    "gl_category": "gl_category",
    "confidence_score": "confidence_score",
    "available_carbs_g": "available_carbs_g",
    "notes": "notes",
    "aliases_compiled": "aliases_compiled",
    "search_text": "search_text"
}

def migrate_csv():
    print(f"Reading from: {SOURCE_PATH}")
    
    if not os.path.exists(SOURCE_PATH):
        print(f"Error: Source file not found at {SOURCE_PATH}")
        return

    with open(SOURCE_PATH, 'r', encoding='utf-8') as source_file:
        reader = csv.DictReader(source_file)
        
        # Verify headers
        source_headers = reader.fieldnames
        if not source_headers:
            print("Error: Empty source CSV")
            return
            
        print(f"Source Headers: {source_headers}")
        
        # Prepare destination data
        rows_to_write = []
        seen_ids = set()
        
        for i, row in enumerate(reader):
            # deduplication check
            f_id = row.get("food_id")
            if f_id in seen_ids:
                continue
            if f_id:
                seen_ids.add(f_id)

            new_row = {}
            for src_key, dest_key in HEADER_MAPPING.items():
                if src_key in row:
                    new_row[dest_key] = row[src_key]
                else:
                    # Handle slightly messy CSV headers if exact match check failed
                    found = False
                    for k in row.keys():
                        if k.strip() == src_key.strip():
                             new_row[dest_key] = row[k]
                             found = True
                             break
                    if not found:
                        if i == 0: print(f"Warning: Column '{src_key}' not found in source row.")
                        new_row[dest_key] = "" # Default empty
            
            # --- PATCH: Fix shifted rows (e.g., Masala omelette) ---
            # Issue: gl_category contains a number (8.28), actual category (Low) is in confidence_score
            gl_cat = new_row.get("gl_category", "")
            if gl_cat and gl_cat.replace('.', '', 1).isdigit() and "Low" not in gl_cat and "Medium" not in gl_cat and "High" not in gl_cat:
                # Detected corrupted row
                print(f"Fixing corrupted row: {new_row.get('canonical_name')} (gl_category='{gl_cat}')")
                
                # Shift values
                real_category = new_row.get("confidence_score") # e.g., "Low"
                real_confidence = new_row.get("available_carbs_g") # e.g., "0.45"
                
                new_row["gl_category"] = real_category
                new_row["confidence_score"] = real_confidence
                
                # Recalculate missing carbs: (GL * 100) / GI
                try:
                    gl_median = float(new_row.get("gl_median", 0))
                    gi = float(new_row.get("gi", 0))
                    if gi > 0:
                        recalc_carbs = (gl_median * 100) / gi
                        new_row["available_carbs_g"] = round(recalc_carbs, 2)
                        print(f"  -> Recalculated carbs: {new_row['available_carbs_g']}g")
                    else:
                        new_row["available_carbs_g"] = 0
                except Exception as e:
                    print(f"  -> Failed to recalculate carbs: {e}")
            # -------------------------------------------------------

            rows_to_write.append(new_row)

    print(f"Writing {len(rows_to_write)} rows to: {DEST_PATH}")
    
    dest_headers = list(HEADER_MAPPING.values())
    
    os.makedirs(os.path.dirname(DEST_PATH), exist_ok=True)
    
    with open(DEST_PATH, 'w', encoding='utf-8', newline='') as dest_file:
        writer = csv.DictWriter(dest_file, fieldnames=dest_headers)
        writer.writeheader()
        writer.writerows(rows_to_write)
        
    print("Migration complete.")

if __name__ == "__main__":
    migrate_csv()
