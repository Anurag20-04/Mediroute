import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, Users, BarChart3, Clock, ChevronRight,
  Database, Search, Bell, Settings, Menu, Plus, Heart,
  AlertTriangle, TrendingUp, Stethoscope, X
} from 'lucide-react';
import './App.css';

// Components
import ChatInterface from './components/ChatInterface';
import PatientSummary from './components/PatientSummary';
import PatientRecords from './components/PatientRecords';
import WardManagement from './components/WardManagement';

// Data
import patientData from './data/patients.json';

// ==============================
// NAV CONFIG
// ==============================
const NAV_ITEMS = [
  { id: 'triage',    icon: Activity,  label: 'AI Triage' },
  { id: 'records',   icon: Database,  label: 'Records' },
  { id: 'wards',     icon: Shield,    label: 'Wards' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'staff',     icon: Users,     label: 'Staff' },
  { id: 'settings',  icon: Settings,  label: 'Settings' },
];

// ==============================
// LIVE CLOCK
// ==============================
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-right select-none">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <p className="text-[15px] text-slate-800 font-black tracking-tight tabular-nums">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </p>
    </div>
  );
}

// ==============================
// STAT CARD (Triage Dashboard)
// ==============================
function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ==============================
// BACKGROUND DECORATOR
// ==============================
function BgDecorator() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%]
        rounded-full bg-gradient-to-br from-teal-400/15 to-cyan-300/10 blur-[160px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%]
        rounded-full bg-gradient-to-br from-indigo-400/12 to-violet-300/8 blur-[160px]" />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%]
        rounded-full bg-gradient-to-br from-emerald-300/8 to-teal-200/5 blur-[120px]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

// ==============================
// PLACEHOLDER VIEW
// ==============================
function PlaceholderView({ title, icon: Icon }) {
  return (
    <div className="placeholder-panel h-[500px] flex flex-col items-center justify-center text-center p-10">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Icon size={28} className="text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-slate-600 mb-2">{title}</h3>
      <p className="text-[13px] text-slate-400 max-w-sm leading-relaxed">
        This module is under development. Connect your Supabase database and n8n workflow to unlock full functionality.
      </p>
    </div>
  );
}

// ==============================
// MAIN APP
// ==============================
export default function App() {
  const [summary, setSummary] = useState(null);
  const [activeNav, setActiveNav] = useState('triage');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Computed stats from patient data
  const stats = useMemo(() => {
    const total = patientData.length;
    const emergency = patientData.filter(p => p['Ward Name'] === 'Emergency Ward').length;
    const consulting = patientData.filter(p => p['Status'] === 'Consulting').length;
    const free = patientData.filter(p => p['Status'] === 'Free').length;
    return { total, emergency, consulting, free };
  }, []);

  // View titles
  const VIEW_TITLES = {
    triage: 'AI Triage Console',
    records: 'Patient Records',
    wards: 'Ward Management',
    analytics: 'Analytics Dashboard',
    staff: 'Staff Management',
    settings: 'System Settings',
  };

  return (
    <div className="h-screen w-full flex overflow-hidden relative
      bg-gradient-to-br from-slate-50 via-white to-slate-50">

      <BgDecorator />

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className="relative z-20 flex flex-col shrink-0 transition-all duration-500 ease-out"
        style={{ width: sidebarOpen ? 260 : 76 }}
      >
        <div className="h-full m-3 mr-0 rounded-3xl sidebar-glass flex flex-col overflow-hidden">

          {/* Logo */}
          <div className="h-[72px] flex items-center px-5 gap-3.5 border-b border-white/25 shrink-0">
            <div className="w-10 h-10 rounded-xl
              bg-gradient-to-br from-teal-500 to-indigo-600
              flex items-center justify-center text-white font-black text-lg
              shadow-lg shadow-teal-500/25 shrink-0">
              M
            </div>

            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-slate-800 font-extrabold text-[16px] tracking-tight leading-none">
                  MediRoute
                </p>
                <p className="text-[9px] text-teal-600 font-bold uppercase tracking-[0.15em] mt-0.5">
                  Hospital AI
                </p>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
              const isActive = activeNav === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveNav(id)}
                  className={`w-full flex items-center gap-3.5 py-2.5 rounded-xl transition-all duration-200
                    ${sidebarOpen ? 'px-3.5' : 'justify-center px-0'}
                    ${isActive
                      ? 'nav-active text-teal-700'
                      : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                    }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`shrink-0 transition-colors nav-icon ${isActive ? 'text-teal-600' : ''}`}
                  />
                  {sidebarOpen && (
                    <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {label}
                    </span>
                  )}
                  {sidebarOpen && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(13,148,136,0.5)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: Status */}
          {sidebarOpen && (
            <div className="p-4 border-t border-white/20">
              <div className="bg-gradient-to-r from-teal-500/8 to-indigo-500/5 rounded-xl p-3.5 border border-teal-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] text-teal-700 font-bold uppercase tracking-widest">System Online</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  All services operational. Neural routing active.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0">

        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-md border border-white/40
                flex items-center justify-center hover:bg-white/70 transition-all shadow-sm"
            >
              <Menu size={18} className="text-slate-600" />
            </button>

            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                {VIEW_TITLES[activeNav]}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                MediRoute AI • Real-time Hospital Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="search-glass rounded-xl flex items-center gap-2.5 px-4 py-2.5">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                placeholder="Search patients, wards..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-[13px] font-medium text-slate-700 placeholder:text-slate-400 w-48"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-xl bg-white/50 backdrop-blur-md border border-white/40
              flex items-center justify-center hover:bg-white/70 transition-all shadow-sm">
              <Bell size={18} className="text-slate-600" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full
                border-2 border-white shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
            </button>

            {/* Clock */}
            <LiveClock />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-8 pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeNav === 'triage' && (
              <motion.div
                key="triage"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    icon={Users}
                    label="Total Patients"
                    value={stats.total}
                    accent="bg-gradient-to-br from-teal-500 to-teal-600"
                    sub="Across all wards"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Emergency"
                    value={stats.emergency}
                    accent="bg-gradient-to-br from-red-500 to-rose-600"
                    sub="Critical cases"
                  />
                  <StatCard
                    icon={Stethoscope}
                    label="Consulting"
                    value={stats.consulting}
                    accent="bg-gradient-to-br from-indigo-500 to-violet-600"
                    sub="Doctors active"
                  />
                  <StatCard
                    icon={Heart}
                    label="Available"
                    value={stats.free}
                    accent="bg-gradient-to-br from-emerald-500 to-green-600"
                    sub="Ready for intake"
                  />
                </div>

                {/* Chat + Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '560px' }}>
                  <div className="lg:col-span-2">
                    <ChatInterface onSummaryUpdate={setSummary} />
                  </div>
                  <div className="lg:col-span-1">
                    <PatientSummary summary={summary} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeNav === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PatientRecords />
              </motion.div>
            )}

            {activeNav === 'wards' && (
              <motion.div
                key="wards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <WardManagement />
              </motion.div>
            )}

            {activeNav === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PlaceholderView title="Analytics Dashboard" icon={BarChart3} />
              </motion.div>
            )}

            {activeNav === 'staff' && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PlaceholderView title="Staff Management" icon={Users} />
              </motion.div>
            )}

            {activeNav === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PlaceholderView title="System Settings" icon={Settings} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
