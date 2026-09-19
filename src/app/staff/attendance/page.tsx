'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  XCircle, 
  Minus, 
  AlertCircle,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { useStaffClass } from '../StaffClassContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StaffAttendancePage() {
  const { selectedClassId, selectedClass, assignedClasses, setSelectedClassId } = useStaffClass();

  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [wingFilter, setWingFilter] = useState<'All' | 'Boys' | 'Girls'>('All');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Grid data: list of students with their daily status map { 1: 'Present', 2: 'Absent', ... }
  const [students, setStudents] = useState<any[]>([]);
  const [daysInMonth, setDaysInMonth] = useState(30);

  // Compute formatted month string, e.g. "2026-09"
  const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
  const monthStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSaveStatus(null);

    async function fetchAttendance() {
      try {
        let url = `/api/attendance?classId=${selectedClassId}&month=${monthStr}&view=monthly`;
        if (wingFilter !== 'All') {
          url += `&gender=${wingFilter}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch attendance register');
        }

        const data = await res.json();
        if (isMounted) {
          setDaysInMonth(data.daysInMonth || 30);
          setStudents(data.students || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading attendance data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAttendance();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, monthStr, wingFilter]);

  // Toggle status for a student on day d
  const handleCellClick = (studentId: number, day: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id !== studentId) return s;
        const cur = s.days ? s.days[day] : null;
        let next: string | null = null;
        if (!cur || cur === 'Not Marked' || cur === '—') next = 'Present';
        else if (cur === 'Present') next = 'Absent';
        else if (cur === 'Absent') next = null; // Clear to not marked

        const updatedDays = { ...(s.days || {}) };
        if (next) updatedDays[day] = next;
        else delete updatedDays[day];

        return { ...s, days: updatedDays };
      })
    );
  };

  // Mark all days up to today as Present
  const handleMarkAllPresent = () => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const curDate = today.getDate();

    const targetYear = Number(selectedYear);
    const targetMonth = monthIndex;

    let maxDayToMark = daysInMonth;
    if (targetYear === curYear && targetMonth === curMonth) {
      maxDayToMark = Math.min(curDate, daysInMonth);
    } else if (targetYear > curYear || (targetYear === curYear && targetMonth > curMonth)) {
      maxDayToMark = 0; // Future month
    }

    if (maxDayToMark === 0) {
      alert('Cannot mark attendance for future dates.');
      return;
    }

    setStudents((prev) =>
      prev.map((s) => {
        const updatedDays = { ...(s.days || {}) };
        for (let d = 1; d <= maxDayToMark; d++) {
          updatedDays[d] = 'Present';
        }
        return { ...s, days: updatedDays };
      })
    );
  };

  // Clear all days in current month
  const handleClearMonth = () => {
    if (!confirm('Are you sure you want to clear all marked attendance for this month?')) return;
    setStudents((prev) => prev.map((s) => ({ ...s, days: {} })));
  };

  // Save changes to SQLite database
  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveStatus(null);
    setError(null);

    try {
      // Group records by section
      const recordsBySection: Record<number, any[]> = {};

      students.forEach((s) => {
        const secId = Number(s.section_id || (wingFilter === 'Girls' ? (selectedClassId ? Number(selectedClassId) * 2 : 50) : 49));
        if (!recordsBySection[secId]) recordsBySection[secId] = [];

        for (let d = 1; d <= daysInMonth; d++) {
          const dayFormatted = String(d).padStart(2, '0');
          const dateStr = `${monthStr}-${dayFormatted}`;
          const status = s.days && s.days[d] ? s.days[d] : 'Not Marked';

          recordsBySection[secId].push({
            student_id: s.student_id,
            date: dateStr,
            status
          });
        }
      });

      // Post to /api/attendance for each section
      for (const [secId, recs] of Object.entries(recordsBySection)) {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: Number(secId),
            date: `${monthStr}-01`,
            records: recs
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save attendance');
        }
      }

      setSaveStatus('Attendance saved to SQLite database successfully!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // Array of 1..daysInMonth
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                Monthly Register
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedClass?.className || 'Selected Class'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-emerald-800" />
              <span>{selectedClass?.className} Monthly Attendance Register</span>
            </h1>
            <p className="text-xs text-slate-500">
              Interactive Excel-style attendance register. Click any day cell to toggle Present (✓), Absent (✗), or Clear.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              disabled={loading || students.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleClearMonth}
              disabled={loading || students.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Month, Year, and Wing Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-att-month-select" className="text-xs font-bold text-slate-500">Month:</label>
              <select
                id="staff-att-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-att-year-select" className="text-xs font-bold text-slate-500">Year:</label>
              <select
                id="staff-att-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {['2024', '2025', '2026', '2027', '2028'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs font-bold text-slate-500">Wing:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                {(['All', 'Boys', 'Girls'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWingFilter(w)}
                    className={'px-3 py-1 rounded-lg transition-all ' + (
                      wingFilter === w
                        ? 'bg-white text-emerald-900 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Classroom quick switch if multiple assigned */}
          {assignedClasses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Switch Class:</span>
              {assignedClasses.map((c) => (
                <button
                  key={c.classId}
                  onClick={() => setSelectedClassId(c.classId)}
                  className={'px-2.5 py-1 rounded-xl text-xs font-bold transition-all ' + (
                    c.classId === selectedClassId
                      ? 'bg-emerald-800 text-amber-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {c.className}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Excel-Style Monthly Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            {selectedMonth} {selectedYear} • {selectedClass?.className} ({students.length} Students)
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block text-center text-white text-[9px]">✓</span> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-600 inline-block text-center text-white text-[9px]">✗</span> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block text-center text-slate-500 text-[9px]">—</span> Not Marked
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading monthly register...
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">
            No students found for {selectedClass?.className} ({wingFilter} wing).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10 text-left w-12 border-r border-slate-200">Roll</th>
                  <th className="py-2.5 px-3 sticky left-12 bg-slate-50 z-10 text-left min-w-[150px] border-r border-slate-200">Student Name</th>
                  {daysArray.map((d) => (
                    <th key={d} className="py-2 px-1 min-w-[28px] border-r border-slate-100 font-mono text-[11px]">
                      {d}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 bg-emerald-50 text-emerald-800 w-12 font-black border-l border-slate-200">P</th>
                  <th className="py-2.5 px-2 bg-rose-50 text-rose-800 w-12 font-black">A</th>
                  <th className="py-2.5 px-2 bg-slate-100 text-slate-800 w-14 font-black">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  let pCount = 0;
                  let aCount = 0;
                  daysArray.forEach((d) => {
                    const status = st.days ? st.days[d] : null;
                    if (status === 'Present') pCount++;
                    else if (status === 'Absent') aCount++;
                  });
                  const markedTotal = pCount + aCount;
                  const pct = markedTotal > 0 ? ((pCount / markedTotal) * 100).toFixed(0) : '—';

                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 sticky left-0 bg-white z-10 text-left font-mono font-bold text-slate-700 border-r border-slate-200">
                        {st.roll_no || '—'}
                      </td>
                      <td className="py-2 px-3 sticky left-12 bg-white z-10 text-left border-r border-slate-200">
                        <div className="font-bold text-slate-900 truncate max-w-[160px]">{st.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{st.admission_no} • {st.gender}</div>
                      </td>
                      {daysArray.map((d) => {
                        const status = st.days ? st.days[d] : null;
                        return (
                          <td 
                            key={d} 
                            onClick={() => handleCellClick(st.student_id, d)}
                            className="p-0 border-r border-slate-100 cursor-pointer hover:bg-amber-100/50 transition-colors"
                          >
                            <div className="h-8 flex items-center justify-center font-bold text-[11px]">
                              {status === 'Present' ? (
                                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              ) : status === 'Absent' ? (
                                <span className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center text-[10px]">
                                  ✗
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 bg-emerald-50/50 text-emerald-800 font-bold border-l border-slate-200">{pCount}</td>
                      <td className="py-2 px-2 bg-rose-50/50 text-rose-800 font-bold">{aCount}</td>
                      <td className="py-2 px-2 bg-slate-50 text-slate-800 font-extrabold">{pct}%</td>
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
