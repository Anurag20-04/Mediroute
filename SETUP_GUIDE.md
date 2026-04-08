# MediRoute AI — Complete Setup & Deployment Guide

> **MediRoute AI** is an intelligent hospital triage system that uses AI to classify patient symptoms, assign wards, notify doctors, and store records — all in real-time.

---

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   Vercel         │────▶│   Render         │────▶│   Supabase       │
│   (Frontend)     │     │   (Backend API)  │     │   (Database)     │
│   React + Vite   │     │   FastAPI        │     │   PostgreSQL     │
│                  │     │                  │     │                  │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                 │
                                 ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │                  │     │                  │
                         │   n8n Cloud      │────▶│   Google Sheets  │
                         │   (Workflow AI)  │     │   (Doctor Data)  │
                         │   + OpenAI       │     │                  │
                         │                  │     └──────────┬───────┘
                         └──────────────────┘                │
                                                             ▼
                                                     ┌──────────────┐
                                                     │   Gmail      │
                                                     │   (Doctor    │
                                                     │    Emails)   │
                                                     └──────────────┘
```

---

## Step 1: Supabase Setup (Database)

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `mediroute-ai`
   - **Database Password**: Use a strong password (save it!)
   - **Region**: Choose the closest to your users
4. Click **"Create new project"** — wait ~2 minutes for provisioning

### 1.2 Create the Patients Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Paste the following SQL:

```sql
-- MediRoute AI — Supabase Schema

DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text        NOT NULL,
  age           integer,
  email         text,
  symptoms      text,
  urgency_level text,
  ward          text,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_patients_ward       ON patients(ward);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for the anon key)
CREATE POLICY "Allow all operations" ON patients
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click **"Run"** — you should see "Success"

### 1.3 Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these two values:

| Key | Where to find it | Example |
|-----|------------------|---------|
| **Project URL** | Under "Project URL" | `https://abcdefghijk.supabase.co` |
| **Anon public key** | Under "Project API keys" → `anon` `public` | `eyJhbGciOiJIUzI1NiIs...` |

> ⚠️ **Never use the `service_role` key in the frontend or commit it to GitHub!**

### 1.4 Verify

1. Go to **Table Editor** in Supabase dashboard
2. You should see the `patients` table with columns: `id`, `name`, `age`, `email`, `symptoms`, `urgency_level`, `ward`, `created_at`

---

## Step 2: Google Sheets Setup (Doctor Data)

### 2.1 Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it: **Hospital dummy data**
3. Set up the header row (Row 1) with these exact columns:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Doctor Name** | **Email** | **Phone Number** | **Ward Name** | **Available Time** | **Status** | **Patient Name** | **Summary** |

### 2.2 Import Dummy Data

1. Open the file `database/hospital_dummy_data.csv` from this repo
2. In Google Sheets: **File** → **Import** → **Upload** → Select the CSV
3. Choose **"Replace current sheet"**
4. The data should populate with ~100 rows of doctor/patient records

### 2.3 Note the Spreadsheet ID

From the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       Copy this part
```

You'll need this ID when setting up n8n.

---

## Step 3: n8n Cloud Setup (AI Workflow Engine)

### 3.1 Create Account

1. Go to [n8n.cloud](https://n8n.cloud) and sign up for a free account
2. You get a personal instance like `https://yourname.app.n8n.cloud`

### 3.2 Import the Workflow

1. In n8n, click **"Add workflow"** → **"Import from File"**
2. Select `n8n/workflow.json` from this repo
3. The workflow will appear with these nodes:

```
Webhook Trigger → AI Ward Classifier → Respond to Frontend
                                     → Is General Ward? → Get General Doctor → Email → Append to Sheet
                                                        → Is Emergency? → Append Emergency
                                                                        → Append Mental Health
```

### 3.3 Set Up Credentials

You need to configure 3 credential sets:

#### A) OpenAI API (for AI Ward Classifier)

1. Click the **"AI Ward Classifier"** node
2. Under "Credential", click **"Create New"**
3. Enter your OpenAI API key (get one from [platform.openai.com](https://platform.openai.com))
4. **OR** use n8n's free built-in OpenAI credits (if available)

#### B) Google Sheets OAuth2 (for reading/writing doctor data)

1. Click any **Google Sheets** node
2. Under "Credential", click **"Create New"** → **"Google Sheets OAuth2 API"**
3. Follow the OAuth prompt to connect your Google account
4. Grant access to Google Sheets
5. Update the **Document ID** in each Google Sheets node to YOUR spreadsheet ID (from Step 2.3)

#### C) Gmail OAuth2 (for emailing doctors)

1. Click the **"Email General Doctor"** node
2. Under "Credential", click **"Create New"** → **"Gmail OAuth2"**
3. Follow the OAuth prompt to connect your Gmail account
4. Grant "Send email" permission

### 3.4 Update Spreadsheet References

In each Google Sheets node (there are 4 of them):
1. Click the node
2. Update the **"Document"** field to select YOUR Google Spreadsheet
3. Make sure **"Sheet"** is set to `Sheet1`

### 3.5 Activate the Workflow

1. Toggle the **"Active"** switch in the top-right corner to **ON**
2. Copy your webhook URL — it will look like:
   ```
   https://yourname.app.n8n.cloud/webhook/triage
   ```
3. **This is your `N8N_WEBHOOK_URL`** — save it for the next steps

### 3.6 Test the Webhook

You can test with curl:
```bash
curl -X POST https://yourname.app.n8n.cloud/webhook/triage \
  -H "Content-Type: application/json" \
  -d '{"body":{"context":{"name":"Test Patient","age":30,"email":"test@test.com","symptoms":"chest pain"}}}'
```

Expected response:
```json
{"ward": "Emergency Ward", "is_complete": true}
```

---

## Step 4: Deploy Backend to Render

### 4.1 Push to GitHub

Make sure your code is pushed to a GitHub repo.

> ⚠️ Verify that `.env` is in your `.gitignore` — NEVER push real secrets!

### 4.2 Create Render Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `mediroute-ai-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Python` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### 4.3 Set Environment Variables

In Render Dashboard → **Environment** tab, add:

| Key | Value |
|-----|-------|
| `N8N_WEBHOOK_URL` | `https://yourname.app.n8n.cloud/webhook/triage` |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIs...` (your anon key) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (set after Vercel deploy) |

### 4.4 Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (~2-3 minutes)
3. Your backend URL will be: `https://mediroute-ai-backend.onrender.com`

### 4.5 Verify

```bash
curl https://mediroute-ai-backend.onrender.com/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "MediRoute AI API",
  "version": "2.0.0",
  "supabase_connected": true,
  "n8n_connected": true
}
```

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 5.2 Set Environment Variable

In Vercel → **Settings** → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://mediroute-ai-backend.onrender.com` |

> ⚠️ The `VITE_` prefix is required — Vite only exposes variables with this prefix to the browser.

### 5.3 Deploy

1. Click **"Deploy"**
2. Wait for the build (~1-2 minutes)
3. Your frontend URL will be: `https://your-app.vercel.app`

### 5.4 Update CORS on Render

After getting your Vercel URL, go back to Render:
1. **Environment** tab
2. Update `FRONTEND_URL` to: `https://your-app.vercel.app`
3. Render will auto-redeploy

---

## Step 6: End-to-End Testing Checklist

Run through this checklist to verify everything works:

### Basic Flow
- [ ] Open your Vercel frontend URL
- [ ] The Glass UI loads with sidebar, header, and triage console
- [ ] Type symptoms (e.g. "severe chest pain") → bot asks for name
- [ ] Enter name → bot asks for age
- [ ] Enter age → bot asks for email
- [ ] Enter email → bot processes and shows Patient Summary card
- [ ] Summary shows correct ward assignment and urgency level
- [ ] Click "Confirm & Register Patient" → saves successfully

### Supabase Verification
- [ ] Go to Supabase → Table Editor → `patients` table
- [ ] The registered patient should appear with all fields populated
- [ ] `created_at` timestamp should be correct

### n8n Verification
- [ ] In n8n dashboard, go to **Executions**
- [ ] You should see a successful execution for each triage
- [ ] Check that the ward classification matches the symptoms
- [ ] Verify that the Google Sheet has a new row appended
- [ ] Check the doctor's email inbox for the notification (if Gmail credentials are set)

### Navigation
- [ ] Click "Records" → patient table loads with search and pagination
- [ ] Click "Wards" → ward management cards with occupancy bars
- [ ] Other nav items show placeholder panels

### CORS
- [ ] Open browser DevTools → Console tab
- [ ] No CORS errors should appear during any interaction

---

## Local Development

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be at `http://localhost:5173` and will proxy API calls to `http://localhost:8000`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS errors in browser | Check `FRONTEND_URL` env var on Render matches your Vercel URL exactly |
| "Neural link interrupted" chat error | Backend may be sleeping (free Render tier). Wait 30s and retry |
| Supabase "websockets" error | Fix: Ensure `websockets>=12.0` is in `requirements.txt`. (Already added) |
| Supabase insert fails | Verify `SUPABASE_URL` and `SUPABASE_KEY`. Check RLS policies are "Allow all" |
| n8n webhook timeout | Check n8n workflow is **Active**. Verify the webhook URL is correct |
| Google Sheets "Permission denied" | Re-authorize the Google Sheets OAuth credential in n8n |
| Empty patient records page | Now dynamically fetches from Supabase. Ensure backend is running |
| Build fails on Vercel | Ensure `VITE_API_URL` does NOT have a trailing slash |
| Wrong ward for "accident" | Robust local heuristic now overrides n8n if emergency is detected |

---

## Environment Variables Summary

### Backend (Render Dashboard)
| Variable | Required | Description |
|----------|----------|-------------|
| `FRONTEND_URL` | ✅ | Comma-separated allowed CORS origins |
| `SUPABASE_URL` | Optional | Supabase project URL |
| `SUPABASE_KEY` | Optional | Supabase anon key |
| `N8N_WEBHOOK_URL` | Optional | n8n webhook endpoint |

### Frontend (Vercel Dashboard)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Full URL of the Render backend |
