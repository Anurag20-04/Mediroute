import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

try:
    # Get one record
    res = requests.get(f"{url}/rest/v1/patients?limit=1", headers=headers)
    res.raise_for_status()
    data = res.json()
    if data:
        print("Columns in patients table:", data[0].keys())
    else:
        print("No data in patients table.")
        # Try to get the schema via PostgREST OpenAPI if available
        res = requests.get(f"{url}/rest/v1/", headers=headers)
        if res.status_code == 200:
            print("Successfully fetched OpenAPI schema. Searching for 'patients' table...")
            schema = res.json()
            paths = schema.get('paths', {})
            if '/patients' in paths:
                params = paths['/patients'].get('post', {}).get('parameters', [])
                cols = [p.get('name') for p in params if p.get('in') == 'query']
                print("Likely columns (from query params):", cols)
            else:
                print("Patients table not found in OpenAPI schema.")
        else:
            print("Could not fetch OpenAPI schema.")
except Exception as e:
    print("Error:", e)
