'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Users, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const initialSec = searchParams.get('sectionId') || '';

  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState(initialSec);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load sections
  useEffect(() => {
    async function loadSections() {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections || []);
          if (!selectedSection && data.sections?.length > 0) {
            setSelectedSection(String(data.sections[0].id));
          }
        }
      } catch (e) {
        console.error('Load sections error:', e);
      }
    }
    loadSections();
  }, []);

  // Load roster directly from /api/attendance
  const loadRoster = async () => {
    if (!selectedSection) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/attendance?sectionId=${selectedSection}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error('Attendance fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [selectedSection, date]);

  // Handle status change
  const handleStatusChange = (studentId: number, newStatus: 'Present' | 'Absent' | 'Late') => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  // 1-Tap Toggle
  const toggleStatus = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          let next = 'Present';
          if (s.status === 'Present') next = 'Absent';
          else if (s.status === 'Absent') next = 'Late';
          else if (s.status === 'Late') next = 'Present';
          return { ...s, status: next };
        }
        return s;
      })
    );
  };

  const markAll = (status: 'Present' | 'Absent') => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSection || students.length === 0) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          date,
          records: students.map((s) => ({ student_id: s.student_id, status: s.status }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `✓ Attendance saved for ${students.length} students!` });
        setTimeout(() => setMsg(null), 3500);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save attendance.' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error communicating with server.' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'Present').length;
  const absentCount = students.filter((s) => s.status === 'Absent').length;
  const lateCount = students.filter((s) => s.status === 'Late').length;

  const currentSecObj = sections.find((s) => String(s.id) === String(selectedSection));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-800" />
            <span>Classroom Daily Attendance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fast attendance recording for your assigned classes. Tap cards to toggle or use quick buttons.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save & Submit Attendance'}</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Assigned Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white min-w-[180px] focus:ring-2 focus:ring-emerald-600"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.class_name} {sec.name} ({sec.student_count || 0} Students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Live Counters & Quick Reset */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200">
            {students.length} Enrolled
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {presentCount} Present
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold border border-rose-200">
            {absentCount} Absent
          </span>
          {lateCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200">
              {lateCount} Late
            </span>
          )}
          <button
            type="button"
            onClick={() => markAll('Present')}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Interactive Student Attendance Roster Table & Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
          Loading section roster...
        </div>
      ) : students.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl border border-slate-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No students enrolled in this section yet.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-900">
              {currentSecObj?.class_name} {currentSecObj?.name} Student Roster ({students.length} Enrolled)
            </span>
            <span className="text-xs text-slate-500">Date: {date}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-32">Admission No</th>
                  <th className="py-3 px-4 text-center w-24">Present</th>
                  <th className="py-3 px-4 text-center w-24">Absent</th>
                  <th className="py-3 px-4 text-center w-24">Late</th>
                  <th className="py-3 px-4 text-right pr-6 w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => {
                  const isPresent = s.status === 'Present';
                  const isAbsent = s.status === 'Absent';
                  const isLate = s.status === 'Late';

                  return (
                    <tr
                      key={s.student_id}
                      className={`transition-colors ${
                        isPresent
                          ? 'hover:bg-emerald-50/40'
                          : isAbsent
                          ? 'bg-rose-50/30 hover:bg-rose-50/60'
                          : 'bg-amber-50/30 hover:bg-amber-50/60'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-black text-slate-900">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-xs">
                          {s.roll_no || idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.full_name}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {s.admission_no}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="radio"
                            name={`staff_att_${s.student_id}`}
                            checked={isPresent}
                            onChange={() => handleStatusChange(s.student_id, 'Present')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="radio"
                            name={`staff_att_${s.student_id}`}
                            checked={isAbsent}
                            onChange={() => handleStatusChange(s.student_id, 'Absent')}
                            className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="radio"
                            name={`staff_att_${s.student_id}`}
                            checked={isLate}
                            onChange={() => handleStatusChange(s.student_id, 'Late')}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      <td className="py-3 px-4 text-right pr-6">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 shadow-sm ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAbsent
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="w-3 h-3" />}
                          {isAbsent && <XCircle className="w-3 h-3" />}
                          {isLate && <Clock className="w-3 h-3" />}
                          <span>{s.status.toUpperCase()}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Submit Attendance'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-bold">Loading Attendance...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
