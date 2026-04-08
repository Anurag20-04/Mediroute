import React, { useState } from 'react';
import {
  User, Calendar, AlertCircle, Mail, MapPin,
  Check, Loader2, ArrowRight, FileText, Heart, Sparkles, Shield, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';

const WARD_THEME = {
  'Emergency Ward':     { dotColor: 'bg-red-500',    borderAccent: 'border-l-red-500',    glow: 'shadow-red-500/10'    },
  'Mental Health Ward': { dotColor: 'bg-amber-500',  borderAccent: 'border-l-amber-500',  glow: 'shadow-amber-500/10'  },
  'General Ward':       { dotColor: 'bg-teal-500',   borderAccent: 'border-l-teal-500',   glow: 'shadow-teal-500/10'   },
  'Orthopedics':        { dotColor: 'bg-blue-500',   borderAccent: 'border-l-blue-500',   glow: 'shadow-blue-500/10'   },
};

const URGENCY_LABEL = {
  'Emergency': { text: 'EMERGENCY', class: 'badge badge-emergency' },
  'High':      { text: 'HIGH',      class: 'badge badge-warning'   },
  'Medium':    { text: 'MEDIUM',    class: 'badge badge-info'      },
  'Low':       { text: 'LOW',       class: 'badge badge-success'   },
};

function DataRow({ icon: Icon, label, value, accent, highlight }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent || 'bg-slate-50'}`}>
        <Icon size={13} className={highlight ? 'text-teal-600' : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
        <p className={`text-[13px] mt-0.5 break-words ${highlight ? 'text-teal-700 font-bold' : 'text-slate-700 font-semibold'}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function PatientSummary({ summary }) {
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered]   = useState(false);
  const [regMessage, setRegMessage]   = useState('');

  // Empty state
  if (!summary) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center text-center p-8"
        style={{ height: '560px' }}>
        <div className="w-14 h-14 rounded-2xl bg-slate-100/80 flex items-center justify-center mb-5">
          <FileText size={24} className="text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-bold text-slate-600 mb-1.5">Awaiting Triage Data</h3>
        <p className="text-[12px] text-slate-400 max-w-[220px] leading-relaxed">
          Complete the AI triage conversation to generate a patient routing profile.
        </p>
        <div className="mt-6 space-y-2.5 w-full max-w-[200px]">
          {['Describe symptoms', 'Provide identity', 'Confirm email', 'AI routes patient'].map((s, i) => (
            <div key={s} className="flex items-center gap-2.5 text-[11px] text-slate-400">
              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0
                text-[9px] font-bold text-slate-500">
                {i + 1}
              </div>
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { name, age, email, symptoms, urgency_level, ward, doctor } = summary;
  const wt = WARD_THEME[ward] || WARD_THEME['General Ward'];
  const ul = URGENCY_LABEL[urgency_level] || URGENCY_LABEL['Low'];

  const handleRegister = async () => {
    setRegistering(true);
    setRegMessage('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setRegistered(true);
        setRegMessage('✅ Patient saved to Supabase database');
      } else if (data.status === 'simulated') {
        setRegistered(true);
        setRegMessage('⚠️ Simulated save (Supabase not configured)');
      } else {
        setRegMessage(`❌ ${data.message || 'Save failed'}`);
      }
    } catch (e) {
      console.error('Registration error:', e);
      setRegMessage('❌ Network error — is the backend running?');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`glass-panel flex flex-col overflow-hidden border-l-4 ${wt.borderAccent}`}
      style={{ height: '560px' }}
    >
      {/* Ward Header */}
      <div className="px-4 py-3 border-b border-white/15 bg-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-slate-400" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ward Assignment</span>
          </div>
          <span className={ul.class}>{ul.text}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${wt.dotColor} shadow-lg ${wt.glow}`} />
          <h3 className="text-base font-black text-slate-800 tracking-tight">{ward}</h3>
        </div>
      </div>

      {/* Doctor Assignment — HIGHLIGHTED */}
      {doctor && (
        <div className="px-4 py-3 bg-gradient-to-r from-teal-500/8 to-emerald-500/5 border-b border-teal-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600
              flex items-center justify-center shadow-md shadow-teal-500/20">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] text-teal-600 font-bold uppercase tracking-widest">Assigned Doctor</p>
              <p className="text-[14px] text-slate-800 font-black tracking-tight">{doctor}</p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Label */}
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Heart size={11} className="text-teal-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Patient Profile</span>
        </div>
      </div>

      {/* Data Rows */}
      <div className="flex-1 overflow-y-auto px-4 divide-y divide-slate-100/50">
        <DataRow icon={User}        label="Full Name"        value={name}                          accent="bg-teal-50" />
        <DataRow icon={Calendar}    label="Age"              value={age ? `${age} years` : null}   accent="bg-indigo-50" />
        {email && <DataRow icon={Mail} label="Email"         value={email}                         accent="bg-cyan-50" />}
        <DataRow icon={AlertCircle} label="Chief Complaint"  value={symptoms}                      accent="bg-rose-50" />
        <DataRow icon={MapPin}      label="Routed To"        value={ward}                          accent="bg-emerald-50" />
      </div>

      {/* Status Message */}
      {regMessage && (
        <div className="px-4 py-2 shrink-0 border-t border-white/10">
          <p className="text-[11px] text-slate-600 font-medium text-center">{regMessage}</p>
        </div>
      )}

      {/* CTA Button */}
      <div className="p-3 border-t border-white/15 shrink-0 bg-white/10">
        <button
          onClick={handleRegister}
          disabled={registering || registered}
          className={`w-full py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2
            transition-all duration-300 ${
              registered
                ? 'bg-teal-50 text-teal-700 border border-teal-200 cursor-default'
                : registering
                  ? 'bg-slate-100 text-slate-500 cursor-wait'
                  : 'btn-primary !w-full !rounded-xl'
            }`}
        >
          {registered ? (
            <><Check size={14} strokeWidth={2.5} /> Saved to Database</>
          ) : registering ? (
            <><Loader2 size={14} className="animate-spin" /> Saving to Supabase...</>
          ) : (
            <><ArrowRight size={14} /> Confirm & Register Patient</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
