import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

try:
    # Get one record to see keys
    res = supabase.table('patients').select('*').limit(1).execute()
    if res.data:
        print("Columns in patients table:", res.data[0].keys())
    else:
        print("No data in patients table, cannot infer columns easily.")
        # Alternatively, try a select that definitely fails but gives error info? 
        # Or try known common names.
except Exception as e:
    print("Error:", e)
