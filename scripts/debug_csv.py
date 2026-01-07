import csv

FILE = "/Users/ritwikmac/Cutmysugar/Database/Gi_gl_master_Final_with_search_text.csv"

with open(FILE, 'r') as f:
    reader = csv.reader(f)
    headers = next(reader)
    print(f"Header Count: {len(headers)}")
    print(f"Headers: {headers}")
    
    for row in reader:
        if "Masala omelette" in row:
            print(f"\nRow Count: {len(row)}")
            print("Row Values:")
            for i, val in enumerate(row):
                h = headers[i] if i < len(headers) else f"EXTRA_{i}"
                print(f"  {i} [{h}]: {val}")
