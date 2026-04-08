from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import datetime
import uuid
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MediRoute AI API",
    description="Intelligent Hospital Triage & Patient Routing System",
    version="2.0.0",
)

# ── CORS Configuration ──────────────────────────────────────────
_raw_origins = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:3000")
# Strip whitespace and trailing slashes for robust matching
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Environment Variables ────────────────────────────────────────
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")
SUPABASE_URL    = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY    = os.getenv("SUPABASE_KEY", "")

print(f"🌐 CORS Origins : {ALLOWED_ORIGINS}")
print(f"🔗 n8n Webhook  : {'✅ ' + N8N_WEBHOOK_URL[:50] + '...' if N8N_WEBHOOK_URL else '⚠️  NOT SET — using local fallback'}")
print(f"🗄 Supabase     : {'✅ Connected' if SUPABASE_URL else '⚠️  NOT SET — register endpoint will simulate'}")


# ── Doctor Database (loaded from embedded data) ─────────────────
# Maps ward → list of doctor names for assignment
DOCTORS_BY_WARD = {
    "Emergency Ward": [
        "Dr. Aditya Kumar", "Dr. Nisha Malhotra", "Dr. Suresh Gupta",
        "Dr. Pooja Verma", "Dr. Meera Singh", "Dr. Rahul Joshi"
    ],
    "Mental Health Ward": [
        "Dr. Sanjay Pillai", "Dr. Ritu Sharma",
        "Dr. Kavita Anand", "Dr. Manish Agarwal"
    ],
    "General Ward": [
        "Dr. Arjun Sharma", "Dr. Priya Mehta", "Dr. Rohan Kapoor",
        "Dr. Sneha Iyer", "Dr. Kiran Patel", "Dr. Ananya Nair",
        "Dr. Vikram Bose", "Dr. Divya Reddy"
    ],
    "Orthopedics": [
        "Dr. Deepak Sinha", "Dr. Sunita Chopra"
    ],
}

import random
def assign_doctor(ward: str) -> str:
    """Randomly assign an available doctor from the ward."""
    doctors = DOCTORS_BY_WARD.get(ward, DOCTORS_BY_WARD.get("General Ward"))
    return random.choice(doctors) if doctors else "Dr. On-Call"


# ── Ward Classification (LOCAL — robust heuristic) ──────────────
def classify_ward_local(symptoms_text: str):
    """
    Robust local heuristic that catches common symptom keywords
    including typos and partial matches.
    """
    symp = symptoms_text.lower().strip()

    emergency_kw = [
        # Trauma / Accidents
        "accident", "accidnt", "acident", "crash", "collision", "hit by",
        "fell", "fall", "fallen", "injury", "injured", "trauma",
        # Bleeding / Wounds
        "bleeding", "blood", "wound", "stab", "shot", "gunshot",
        "cut", "cuts", "gash", "laceration", "deep cut", "severe bleeding",
        # Fractures
        "fracture", "broken bone", "broken arm", "broken leg", "compound fracture",
        # Critical
        "chest pain", "heart attack", "cardiac", "stroke", "seizure", "seizures",
        "unconscious", "unresponsive", "fainted", "collapse", "collapsed",
        "choking", "can't breathe", "not breathing", "breathing difficulty",
        "severe pain", "intense pain", "unbearable pain",
        # Toxicology
        "overdose", "poisoning", "poison", "drug overdose",
        # Burns / Other
        "burn", "burns", "burned", "electric shock", "electrocution",
        "drowning", "near drowning",
        # Violence
        "attack", "assault", "fight", "beaten",
    ]

    mental_kw = [
        "anxiety", "panic", "panic attack", "depression", "depressed",
        "trauma", "ptsd", "hallucination", "hallucinating",
        "suicidal", "suicide", "self harm", "self-harm",
        "mental", "mental health", "paranoid", "paranoia",
        "psychosis", "schizophrenia", "bipolar", "manic",
        "eating disorder", "anorexia", "bulimia",
        "insomnia", "can't sleep", "afraid", "phobia",
    ]

    ortho_kw = [
        "fracture", "sprain", "sprained", "joint pain", "joint",
        "knee", "shoulder", "dislocation", "dislocated",
        "back pain", "spine", "hip pain", "wrist", "ankle",
        "ligament", "torn ligament", "acl", "meniscus",
    ]

    # Check in priority order (emergency first)
    if any(k in symp for k in emergency_kw):
        return "Emergency Ward", "Emergency"
    elif any(k in symp for k in mental_kw):
        return "Mental Health Ward", "High"
    elif any(k in symp for k in ortho_kw):
        return "Orthopedics", "Medium"
    else:
        return "General Ward", "Low"


# ── Models ───────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str
    context: dict = {}

class ChatResponse(BaseModel):
    reply: str
    context: dict
    is_complete: bool
    summary: dict | None = None

class PatientSummary(BaseModel):
    name: str | None = None
    age: int | None = None
    email: str | None = None
    symptoms: str | None = None
    urgency_level: str | None = None
    ward: str | None = None
    doctor: str | None = None


# ── Health Check ─────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "MediRoute AI API",
        "version": "2.0.0",
        "supabase_connected": bool(SUPABASE_URL),
        "n8n_connected": bool(N8N_WEBHOOK_URL),
    }


# ── Chat Endpoint ───────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    try:
        context = request.context.copy()
        reply_text = ""
        is_complete = False

        if not context.get("symptoms"):
            context["symptoms"] = request.message
            reply_text = "I've noted your symptoms. May I know your full name?"
        elif not context.get("name"):
            context["name"] = request.message
            reply_text = f"Thank you, {context['name']}. What is your age?"
        elif not context.get("age"):
            try:
                context["age"] = int(''.join(filter(str.isdigit, request.message)))
            except (ValueError, TypeError):
                context["age"] = 30
            reply_text = "Could you please provide your email address for the doctor's booking confirmation?"
        elif not context.get("email"):
            context["email"] = request.message
            is_complete = True

        data = {"reply": reply_text, "context": context, "is_complete": is_complete}

        if is_complete:
            # Local heuristic check for safety override
            heuristic_ward, heuristic_urgency = classify_ward_local(context.get("symptoms", ""))

            # Try n8n first (if configured)
            if N8N_WEBHOOK_URL:
                try:
                    print(f"📡 Firing n8n webhook for patient: {context.get('name')}")
                    webhook_payload = {"body": {"context": context}}
                    res = requests.post(N8N_WEBHOOK_URL, json=webhook_payload, timeout=12)
                    res.raise_for_status()
                    n8n_response = res.json()
                    print(f"✅ n8n response: {n8n_response}")

                    n8n_ward = n8n_response.get("ward", "").strip()
                    valid_wards = ["Emergency Ward", "Mental Health Ward", "General Ward", "Orthopedics"]
                    
                    if n8n_ward in valid_wards:
                        ward_assigned = n8n_ward
                        # SAFETY OVERRIDE: If n8n says General but heuristic says Emergency, trust the heuristic
                        if ward_assigned == "General Ward" and heuristic_ward == "Emergency Ward":
                            print("🚨 SAFETY OVERRIDE: n8n returned General Ward for high-risk symptoms. Upgrading to Emergency.")
                            ward_assigned = "Emergency Ward"
                            urgency = "Emergency"
                        else:
                            if "Emergency" in ward_assigned: urgency = "Emergency"
                            elif "Mental Health" in ward_assigned: urgency = "High"
                            elif "Orthopedics" in ward_assigned: urgency = "Medium"
                            else: urgency = "Low"
                    else:
                        print(f"⚠️ n8n returned invalid/unknown ward: '{n8n_ward}' — falling back to local heuristic")
                        ward_assigned, urgency = heuristic_ward, heuristic_urgency
                except Exception as e:
                    print(f"❌ n8n webhook error: {e}")
                    ward_assigned, urgency = heuristic_ward, heuristic_urgency
            else:
                print("⚙️ n8n not configured — using local heuristic routing")
                ward_assigned, urgency = heuristic_ward, heuristic_urgency

            # Final check to ensure ward_assigned isn't None
            if not ward_assigned:
                ward_assigned, urgency = "General Ward", "Low"

            # Assign a doctor from the ward database
            doctor_name = assign_doctor(ward_assigned)
            print(f"👨‍⚕️ Final Assignment: {doctor_name} in {ward_assigned}")

            # Build the reply message with doctor assignment
            reply_text = (
                f"Your triage analysis is complete.\n\n"
                f"🏥 You have been routed to: **{ward_assigned}**\n"
                f"👨‍⚕️ Your assigned doctor: **{doctor_name}**\n"
                f"⚡ Urgency Level: **{urgency}**\n\n"
                f"Please proceed to the ward reception. Your doctor has been notified."
            )
            data["reply"] = reply_text

            data["summary"] = {
                "name": context.get("name"),
                "age": context.get("age"),
                "email": context.get("email"),
                "symptoms": context.get("symptoms"),
                "urgency_level": urgency,
                "ward": ward_assigned,
                "doctor": doctor_name,
            }

        return ChatResponse(**data)

    except Exception as e:
        print(f"Error in chat: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            reply="The neural routing core is currently initializing. Please standby.",
            context=request.context,
            is_complete=False,
        )


# ── Register Patient ────────────────────────────────────────────
@app.post("/register")
async def register_patient(summary: PatientSummary):
    """Saves the finalized patient to Supabase."""
    print(f"📝 Register endpoint called with: {summary}")

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            client = create_client(SUPABASE_URL, SUPABASE_KEY)

            insert_data = {
                "name": summary.name,
                "age": summary.age,
                "symptoms": summary.symptoms,
                "urgency_level": summary.urgency_level,
                "ward": summary.ward,
            }
            if summary.email:
                insert_data["email"] = summary.email

            print(f"🗓️ Inserting into Supabase: {insert_data}")
            response = client.table('patients').insert(insert_data).execute()
            print(f"✅ Supabase insert success: {response.data}")

            return {
                "status": "success",
                "message": f"Patient {summary.name} saved to database and routed to {summary.ward}.",
                "data": response.data,
            }
        except Exception as e:
            print(f"❌ Supabase error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "message": f"Supabase failed: {str(e)}. Patient data was NOT saved.",
                "data": summary.model_dump(),
            }

    # Fallback
    print("⚠️ Supabase not configured — simulating save")
    return {
        "status": "simulated",
        "message": f"[SIMULATED] Patient {summary.name} routed to {summary.ward}. Configure Supabase to persist data.",
        "data": summary.model_dump(),
    }


# ── Supabase Debug ──────────────────────────────────────────────
@app.get("/debug/supabase")
async def debug_supabase():
    """Debug endpoint to check Supabase connectivity and data."""
    result = {
        "supabase_url_set": bool(SUPABASE_URL),
        "supabase_key_set": bool(SUPABASE_KEY),
        "supabase_url_preview": SUPABASE_URL[:30] + "..." if SUPABASE_URL else "NOT SET",
    }

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            client = create_client(SUPABASE_URL, SUPABASE_KEY)
            response = client.table('patients').select("*").order('created_at', desc=True).limit(5).execute()
            result["status"] = "connected"
            result["patient_count"] = len(response.data)
            result["recent_patients"] = response.data
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)
    else:
        result["status"] = "not_configured"

    return result


# ── Recent Summaries ────────────────────────────────────────────
@app.get("/summary")
async def get_recent_summaries():
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            client = create_client(SUPABASE_URL, SUPABASE_KEY)
            response = client.table('patients').select("*").order('created_at', desc=True).limit(20).execute()
            return {"status": "success", "patients": response.data}
        except Exception as e:
            print(f"❌ Supabase fetch error: {e}")

    return {
        "status": "success",
        "patients": [{
            "id": str(uuid.uuid4()),
            "name": "Jane Doe", "age": 45,
            "symptoms": "Chest pain and dizziness",
            "urgency_level": "Emergency",
            "ward": "Emergency Ward",
            "created_at": str(datetime.datetime.now()),
        }],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
