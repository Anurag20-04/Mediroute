-- MediRoute AI — Supabase Schema
-- Run this in: Supabase → SQL Editor → New Query → Run

-- Drop existing table if it has wrong constraints
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

-- Index for fast ward queries
CREATE INDEX idx_patients_ward       ON patients(ward);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON patients FOR ALL USING (true);
