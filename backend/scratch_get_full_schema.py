import os
import requests
import json
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
    res = requests.get(f"{url}/rest/v1/", headers=headers)
    res.raise_for_status()
    schema = res.json()
    definitions = schema.get('definitions', {})
    patients = definitions.get('patients', {})
    properties = patients.get('properties', {})
    print("Full column list for 'patients' table:")
    for prop in properties:
        print(f"- {prop}")
except Exception as e:
    print("Error:", e)
