'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  UserCheck, 
  CalendarCheck, 
  CreditCard, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Edit3, 
  X, 
  Sparkles,
  Building2,
  Phone,
  ShieldCheck
} from 'lucide-react';

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Correction Modal
  const [showCorrection, setShowCorrection] = useState(false);
  const [fieldName, setFieldName] = useState('Phone Number');
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [corrMsg, setCorrMsg] = useState('');

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const mData = await meRes.json();
        const sId = mData.student?.id || mData.user?.student_id || 1;
        const sRes = await fetch(`/api/students/${sId}`);
        if (sRes.ok) {
          setProfile(await sRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: profile.student.id,
          fieldName,
          requestedValue,
          reason
        })
      });
      if (res.ok) {
        setShowCorrection(false);
        setCorrMsg('Correction request submitted to Madrassa office desk!');
        setTimeout(() => setCorrMsg(''), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const student = profile?.student || {};
  const attStats = profile?.attendanceStats || {};
  const feeStats = profile?.feeStats || {};
  const attPercent = attStats.total_days > 0 ? ((Number(attStats.present_days) / Number(attStats.total_days)) * 100).toFixed(0) : '100';

  return (
    <div className="space-y-8">
      
      {corrMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{corrMsg}</span>
        </div>
      )}

      {/* Top Section: ID Badge + Quick Academic Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Modern Islamic Student ID Badge (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-emerald-700/60 relative overflow-hidden space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-md">
                MU
              </div>
              <div>
                <div className="font-bold text-xs">Mifthahul Uloom Madrassa</div>
                <div className="text-[9px] text-amber-300">Official Student Identity Card</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-amber-300 text-[10px] font-bold">
              2026-27
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-2xl shadow-inner shrink-0">
              {student.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">{student.full_name}</h2>
              <div className="font-mono text-xs font-bold text-amber-400 mt-0.5">{student.admission_no}</div>
              <div className="text-[11px] text-emerald-200 mt-1">Roll No: #{student.roll_no} • {student.class_name} ({student.gender})</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-emerald-800/80 text-emerald-100">
            <div>Father: <strong className="text-white">{student.father_name || 'Guardian'}</strong></div>
            <div>Mobile: <strong className="text-white">{student.primary_phone}</strong></div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => window.print()}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Student ID Badge</span>
            </button>
          </div>
        </div>

        {/* Quick Academic Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500">Attendance</span>
                <CalendarCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{attPercent}%</div>
              <div className="text-[10px] text-emerald-700 font-semibold">{attStats.present_days || 0} / {attStats.total_days || 0} Academic Days</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500">Monthly Fees</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">₹{feeStats.total_paid || 0}</div>
              <div className="text-[10px] text-amber-700 font-semibold">₹100/mo Standard Rate</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500">Status</span>
                <ShieldCheck className="w-4 h-4 text-purple-700" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-800">{student.status || 'Active'}</div>
              <div className="text-[10px] text-slate-500">Verified Madrassa Scholar</div>
            </div>

          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Need corrections in your Madrassa record?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Submit spelling corrections, updated phone numbers, or residential address changes.</p>
            </div>

            <button
              onClick={() => setShowCorrection(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
              <span>Submit Correction Request</span>
            </button>
          </div>
        </div>

      </div>

      {/* Navigation Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <Link href="/student/results" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition-all space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Official Exam Marksheets</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Download your terminal and annual examination marksheet with teacher remarks.
          </p>
        </Link>

        <Link href="/student/attendance" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition-all space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Attendance Calendar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            View your day-to-day attendance log and overall academic attendance percentage.
          </p>
        </Link>

        <Link href="/student/fees" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition-all space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">₹100/mo Fee Receipts</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review monthly payments, download computerized fee receipts, and check dues.
          </p>
        </Link>

      </div>

      {/* Correction Request Modal */}
      {showCorrection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Request Profile Correction</h3>
              <button onClick={() => setShowCorrection(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Field to Correct</label>
                <select
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none bg-white"
                >
                  <option value="Student Name Spelling">Student Name Spelling</option>
                  <option value="Date of Birth">Date of Birth</option>
                  <option value="Parent Contact Phone">Parent Contact Phone</option>
                  <option value="Residential Address">Residential Address</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corrected Value *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter the correct value..."
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Brief reason for this correction..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCorrection(false)} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}