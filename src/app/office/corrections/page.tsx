'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Check } from 'lucide-react';

export default function OfficeCorrectionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corrections');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleUpdateStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch('/api/corrections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, status })
      });
      if (res.ok) {
        setMsg(`Request #${id} marked as ${status}!`);
        loadRequests();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-800" />
          <span>Student Profile Correction Requests</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review profile correction requests submitted by students and parents (spelling, phone, address).
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Adm No</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Requested Correction Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading correction requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No correction requests found.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900">{r.student_name}</strong>
                      <div className="text-[10px] text-slate-400 font-mono">{r.admission_no}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{r.class_name} {r.gender}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{r.field_name || 'Personal Info Correction'}</div>
                      <div className="text-[11px] text-emerald-800 font-semibold">{r.requested_value}</div>
                      {r.reason && <div className="text-[10px] text-slate-500 italic">Reason: {r.reason}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 font-semibold text-[11px] hover:bg-rose-50 hover:text-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}