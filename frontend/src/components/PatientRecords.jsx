import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Users } from 'lucide-react';
import patientData from '../data/patients.json';

const WARD_BADGES = {
  'Emergency Ward': 'badge badge-emergency',
  'Mental Health Ward': 'badge badge-warning',
  'General Ward': 'badge badge-success',
  'Orthopedics': 'badge badge-info',
};

export default function PatientRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return patientData.filter(p =>
      p['Patient Name']?.toLowerCase().includes(q) ||
      p['Doctor Name']?.toLowerCase().includes(q) ||
      p['Summary']?.toLowerCase().includes(q) ||
      p['Ward Name']?.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-[15px] font-black text-slate-800 tracking-tight">Master Patient Index</h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            <span className="text-slate-600 font-bold">{filteredData.length}</span> records found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, doctor, ward, or diagnosis..."
              className="input-field !pl-9 !py-2 !h-9 !text-[12px] w-64 md:w-80 !rounded-lg"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button className="btn-outline !py-1.5 !h-9 !text-[12px] !rounded-lg">
            <Filter size={13} /> Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200/60">
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-64">Patient</th>
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ward</th>
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-72">Summary</th>
              <th className="px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {currentData.map((p, i) => (
              <tr key={i} className="hover:bg-white/50 transition-colors duration-150 group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100
                      flex items-center justify-center text-teal-700 font-bold text-[11px] shrink-0">
                      {p['Patient Name']?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-700">{p['Patient Name'] || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        #{String(i + 1000).padStart(4, '0')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={WARD_BADGES[p['Ward Name']] || 'badge badge-neutral'}>
                    {p['Ward Name']}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[12px] text-slate-600 font-semibold">{p['Doctor Name']}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[12px] text-slate-500 font-medium">{p['Available Time']}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    p['Status'] === 'Free'
                      ? 'bg-emerald-50 text-emerald-600'
                      : p['Status'] === 'EMERGENCY'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                  }`}>
                    {p['Status']}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                    {p['Summary'] || '—'}
                  </p>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors
                    opacity-0 group-hover:opacity-100">
                    <MoreVertical size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <Users size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-[13px] font-medium">
              No records matching "<span className="text-slate-600">{searchTerm}</span>"
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-5 py-3.5 border-t border-white/15 bg-white/10 flex items-center justify-between shrink-0">
        <p className="text-[11px] text-slate-500 font-medium">
          Showing <span className="text-slate-700 font-bold">{(currentPage-1)*itemsPerPage + 1}</span> to{' '}
          <span className="text-slate-700 font-bold">{Math.min(currentPage*itemsPerPage, filteredData.length)}</span>{' '}
          of <span className="text-slate-700 font-bold">{filteredData.length}</span>
        </p>

        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="w-8 h-8 rounded-lg border border-slate-200/60 bg-white/60 text-slate-500
              disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all
              flex items-center justify-center"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="px-3 text-[12px] font-bold text-slate-600 tabular-nums">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="w-8 h-8 rounded-lg border border-slate-200/60 bg-white/60 text-slate-500
              disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all
              flex items-center justify-center"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
