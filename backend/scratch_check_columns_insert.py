import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

try:
    # Try to insert a dummy record with NO doctor to see what we get back
    payload = {
        "name": "Schema Check",
        "symptoms": "Checking columns"
    }
    res = requests.post(f"{url}/rest/v1/patients", headers=headers, json=payload)
    if res.status_code == 201:
        data = res.json()
        print("Columns returned from insert:", data[0].keys())
        # Clean up
        inserted_id = data[0].get('id')
        if inserted_id:
            requests.delete(f"{url}/rest/v1/patients?id=eq.{inserted_id}", headers=headers)
    else:
        print("Insert failed:", res.text)
except Exception as e:
    print("Error:", e)
