'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudentAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?month=${selectedMonth}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Fetch student attendance error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const student = data?.student || {};
  const totalWorkingDays = Number(data?.totalWorkingDays || 0);
  const presentDays = Number(data?.presentCount || 0);
  const absentDays = Number(data?.absentCount || 0);
  const lateDays = Number(data?.lateCount || 0);
  const percentage = data?.percentage || '100.0';
  const records = data?.records || [];

  // Format month for display (e.g. September 2026)
  const [y, m] = selectedMonth.split('-').map(Number);
  const monthDisplay = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-800" />
            <span>Monthly Attendance Record</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View-only attendance tracking for <strong>{student.full_name || 'Student'}</strong> ({student.class_name} {student.section_name} • Roll #{student.roll_no}).
          </p>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="font-extrabold text-xs text-slate-800 px-2 min-w-[130px] text-center">
            {monthDisplay}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Working Days</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalWorkingDays}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">Recorded sessions</div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Present</span>
          <div className="text-3xl font-black text-emerald-900 mt-1">{presentDays}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Attended sessions</div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-rose-600">Absent</span>
          <div className="text-3xl font-black text-rose-900 mt-1">{absentDays}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">Recorded leaves</div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-amber-600">Attendance %</span>
          <div className="text-3xl font-black text-amber-900 mt-1">{percentage}%</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {Number(percentage) >= 75 ? '✓ Exam Compliant' : '⚠ Below 75%'}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Calendar List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-extrabold text-sm text-slate-900">
            {monthDisplay} — Daily Session Breakdown
          </span>
          <span className="text-xs text-slate-500">
            {totalWorkingDays} working days recorded
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No attendance records logged for {monthDisplay} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r: any, idx: number) => {
                  const isPresent = r.status === 'Present';
                  const isAbsent = r.status === 'Absent';
                  const isLate = r.status === 'Late';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {r.dayName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAbsent
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isAbsent && <XCircle className="w-3.5 h-3.5" />}
                          {isLate && <Clock className="w-3.5 h-3.5" />}
                          <span>{isPresent ? '✓ Present' : isAbsent ? 'A Absent' : 'Late Arrival'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium text-[11px]">
                        {r.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
