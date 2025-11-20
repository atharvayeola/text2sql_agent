from text2sql_agent.database import load_database
from text2sql_agent.schema import extract_schema
from pathlib import Path
import json

# Path to the complex db
db_path = Path("tests/data/complex_sales.db")

try:
    context = load_database(db_path)
    print(f"Tables found: {[t.fqn for t in context.tables]}")
    
    schema = extract_schema(context)
    print("Schema extracted successfully.")
    
    # Print the first table's schema to check structure
    first_table = list(schema.keys())[0]
    print(f"First table: {first_table}")
    print(f"Columns: {schema[first_table].columns}")
    print(f"Sample rows: {len(schema[first_table].sample_rows)}")
    
except Exception as e:
    print(f"Error: {e}")
