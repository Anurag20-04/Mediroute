import React from 'react';
import { Shield, Users, Activity, AlertTriangle, ArrowUpRight, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import patientData from '../data/patients.json';

const WARDS = [
  { id: 'Emergency Ward',     icon: Zap,       gradient: 'from-red-500 to-rose-600',    bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600'    },
  { id: 'Mental Health Ward', icon: Heart,      gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-600'  },
  { id: 'General Ward',       icon: Shield,     gradient: 'from-teal-500 to-teal-600',  bg: 'bg-teal-50',   border: 'border-teal-100',   text: 'text-teal-600'   },
  { id: 'Orthopedics',        icon: Activity,   gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600'   },
];

export default function WardManagement() {
  const stats = WARDS.map(w => {
    const patients = patientData.filter(p => p['Ward Name'] === w.id);
    const occupancy = Math.floor((patients.length / 50) * 100);
    return {
      ...w,
      count: patients.length,
      occupancy: Math.min(occupancy, 100),
      emergencies: patients.filter(p => p['Status'] === 'EMERGENCY').length,
      consulting: patients.filter(p => p['Status'] === 'Consulting').length,
      free: patients.filter(p => p['Status'] === 'Free').length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Ward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="glass-card p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient}
                flex items-center justify-center shadow-lg`}>
                <s.icon className="text-white" size={22} />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Occupancy</p>
                <p className="text-xl font-black text-slate-800">{s.occupancy}%</p>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">{s.id}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <Users size={11} /> {s.count} Total
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md">
                  {s.consulting} Active
                </div>
                {s.emergencies > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                    <AlertTriangle size={9} /> {s.emergencies}
                  </div>
                )}
              </div>
            </div>

            {/* Occupancy Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Load</span>
                <span className={`flex items-center gap-0.5 ${
                  s.occupancy > 80 ? 'text-red-500' : 'text-teal-500'
                }`}>
                  <ArrowUpRight size={9} /> Trending
                </span>
              </div>
              <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.occupancy}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    s.occupancy > 80 ? 'from-red-400 to-red-500'
                    : s.occupancy > 50 ? 'from-amber-400 to-amber-500'
                    : 'from-teal-400 to-teal-500'
                  }`}
                />
              </div>
            </div>

            <button className="btn-outline !py-1.5 !text-[11px] w-full !rounded-lg mt-1">
              Manage Ward
            </button>
          </motion.div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Indices */}
        <div className="glass-panel p-6">
          <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-5">Ward Performance Indices</h3>
          <div className="space-y-4">
            {[
              { label: 'Average Response Time',    value: '4.2 min', status: 'Optimal',  bar: 85 },
              { label: 'Patient Turnaround Rate',  value: '0.85',    status: 'Stable',   bar: 78 },
              { label: 'Staff-to-Patient Ratio',   value: '1 : 4',   status: 'Good',     bar: 70 },
              { label: 'Critical Care Availability', value: '82%',   status: 'Warning',  bar: 45 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between pb-3.5 border-b border-slate-100/60 last:border-0 last:pb-0">
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">{item.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-1 w-10 rounded-full ${
                      item.status === 'Warning' ? 'bg-amber-400' : 'bg-teal-400'
                    }`} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.status}</p>
                  </div>
                </div>
                <p className="text-[15px] font-black text-slate-800 tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Telemetry */}
        <div className="glass-panel p-6">
          <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-1.5">Facility Telemetry</h3>
          <p className="text-[11px] text-slate-400 font-medium mb-5">Resource utilization across the hospital campus</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ICU Beds',      value: '2 available',  sub: 'of 12 total',     color: 'border-l-red-400'    },
              { label: 'Ventilators',    value: '5 standby',    sub: 'of 8 units',      color: 'border-l-amber-400'  },
              { label: 'Nursing Staff',  value: '28 Active',    sub: 'on current shift', color: 'border-l-teal-400'   },
              { label: 'Ambulances',     value: '3 Ready',      sub: '1 in transit',    color: 'border-l-blue-400'   },
            ].map(t => (
              <div key={t.label} className={`bg-white/60 backdrop-blur-sm border border-slate-200/50 border-l-4 ${t.color}
                rounded-xl p-3.5 shadow-sm`}>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.label}</p>
                <p className="text-[14px] font-black text-slate-700 mt-1.5 tracking-tight">{t.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
