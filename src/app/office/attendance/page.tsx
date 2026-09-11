'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Save, 
  Layers, 
  Check, 
  AlertCircle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function OfficeAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('Boys');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'matrix'>('daily');

  const [dailyData, setDailyData] = useState<any>({});
  const [monthlyData, setMonthlyData] = useState<any>({});
  const [matrixData, setMatrixData] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Classes and Sections
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
          setSections(data.sections || []);
          if (data.classes?.length > 0 && !selectedClassId) {
            setSelectedClassId(String(data.classes[0].id));
          }
        }
      } catch (e) {
        console.error('Failed to load class metadata:', e);
      }
    }
    loadMeta();
  }, []);

  const currentSection = sections.find(
    (s) => String(s.class_id) === String(selectedClassId) && s.name.toLowerCase() === selectedGender.toLowerCase()
  );

  // Fetch Attendance based on viewMode
  const fetchAttendance = async () => {
    setLoading(true);
    setMsg(null);
    try {
      if (viewMode === 'daily') {
        const secId = currentSection?.id;
        const url = secId 
          ? `/api/attendance?sectionId=${secId}&date=${date}`
          : `/api/attendance?classId=${selectedClassId}&gender=${selectedGender}&date=${date}`;
        const res = await fetch(url);
        if (res.ok) setDailyData(await res.json());
      } else if (viewMode === 'monthly') {
        const secId = currentSection?.id;
        const url = secId 
          ? `/api/attendance?view=monthly&sectionId=${secId}&month=${selectedMonth}`
          : `/api/attendance?view=monthly&classId=${selectedClassId}&gender=${selectedGender}&month=${selectedMonth}`;
        const res = await fetch(url);
        if (res.ok) setMonthlyData(await res.json());
      } else {
        const res = await fetch(`/api/attendance?date=${date}`);
        if (res.ok) setMatrixData(await res.json());
      }
    } catch (e) {
      console.error('Fetch attendance error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId || viewMode === 'matrix') {
      fetchAttendance();
    }
  }, [selectedClassId, selectedGender, date, selectedMonth, viewMode, sections]);

  // Handle single student status change (Present = tick, Absent = untick)
  const handleTogglePresent = (studentId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    setDailyData((prev: any) => {
      const updated = (prev.students || []).map((st: any) => {
        if (st.student_id === studentId) {
          return { ...st, status: nextStatus };
        }
        return st;
      });
      return { ...prev, students: updated };
    });
  };

  const handleStatusSelect = (studentId: number, status: 'Present' | 'Absent') => {
    setDailyData((prev: any) => {
      const updated = (prev.students || []).map((st: any) => {
        if (st.student_id === studentId) {
          return { ...st, status };
        }
        return st;
      });
      return { ...prev, students: updated };
    });
  };

  // Bulk mark all
  const handleMarkAll = (status: 'Present' | 'Absent') => {
    setDailyData((prev: any) => {
      const updated = (prev.students || []).map((st: any) => ({ ...st, status }));
      return { ...prev, students: updated };
    });
  };

  // Save Daily Attendance
  const handleSaveAttendance = async () => {
    const secId = dailyData.sectionId || currentSection?.id;
    if (!secId) {
      setMsg({ type: 'error', text: 'Please select a valid class and section.' });
      return;
    }
    if (!dailyData.students || dailyData.students.length === 0) {
      setMsg({ type: 'error', text: 'No students to record attendance for.' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const records = dailyData.students.map((st: any) => ({
        student_id: st.student_id,
        status: st.status || 'Present',
        remarks: st.remarks || null
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: secId,
          date,
          records
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `✓ Attendance saved successfully for ${records.length} students on ${date}!` });
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save attendance.' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error communicating with server.' });
    } finally {
      setSaving(false);
    }
  };

  const currentClassObj = classes.find((c) => String(c.id) === String(selectedClassId));
  const dailyStudents = dailyData.students || [];
  const presentCount = dailyStudents.filter((s: any) => s.status === 'Present').length;
  const absentCount = dailyStudents.filter((s: any) => s.status === 'Absent').length;
  const totalEnrolled = dailyStudents.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-800" />
            <span>Institutional Attendance Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fast daily checkbox-tick attendance, monthly 1..31 student breakdown, and institutional overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'daily' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Entry (☑/☐)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'monthly' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'matrix' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24 Sections Matrix
            </button>
          </div>

          <a
            href="/api/reports?type=attendance&format=csv"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Class Dropdown */}
            {viewMode !== 'matrix' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Academic Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white min-w-[140px] focus:ring-2 focus:ring-emerald-600"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Wing Tab Selector */}
            {viewMode !== 'matrix' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Section / Wing
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedGender('Boys')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedGender === 'Boys'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Boys Wing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGender('Girls')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedGender === 'Girls'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Girls Wing
                  </button>
                </div>
              </div>
            )}

            {/* Date Picker (for Daily / Matrix) */}
            {viewMode !== 'monthly' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white focus:ring-2 focus:ring-emerald-600 shadow-sm"
                />
              </div>
            )}

            {/* Month Picker (for Monthly View) */}
            {viewMode === 'monthly' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Month & Year
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white focus:ring-2 focus:ring-emerald-600 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Quick Actions (Daily View) */}
          {viewMode === 'daily' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                  {totalEnrolled} Enrolled
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {presentCount} Present
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                  {absentCount} Absent
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving || totalEnrolled === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usthad Assignment Banner */}
        {viewMode !== 'matrix' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              <span className="font-bold text-slate-900">
                {currentClassObj?.name || dailyData.className || monthlyData.className} — {selectedGender} Wing
              </span>
              {(dailyData.teacherName || monthlyData.teacherName) && (
                <span className="ml-2 text-slate-500 font-medium">
                  (Class Usthad: <strong className="text-emerald-900">{dailyData.teacherName || monthlyData.teacherName}</strong>)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {viewMode === 'daily' ? 'Check Present (☑) or Absent (☐) per student.' : 'Monthly breakdown (✓ = Present, A = Absent, - = No Class)'}
            </span>
          </div>
        )}
      </div>

      {/* Feedback Toast Message */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. DAILY ATTENDANCE TABLE (CHECKBOX / TICK SYSTEM) */}
      {/* ==================================================== */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-900">
              {currentClassObj?.name || dailyData.className} — {selectedGender} Student Attendance ({totalEnrolled} Students)
            </span>
            <span className="text-xs text-slate-500">Date: {date}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
              Loading students...
            </div>
          ) : dailyStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No students enrolled in this section yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Roll No.</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4 w-36">Admission No</th>
                    <th className="py-3.5 px-4 text-center w-28">Present</th>
                    <th className="py-3.5 px-4 text-center w-28">Absent</th>
                    <th className="py-3.5 px-4 text-right pr-6 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyStudents.map((s: any, idx: number) => {
                    const isPresent = s.status === 'Present';
                    const isAbsent = s.status === 'Absent' || !isPresent;

                    return (
                      <tr
                        key={s.student_id}
                        className={`transition-colors ${
                          isPresent ? 'hover:bg-emerald-50/40' : 'bg-rose-50/30 hover:bg-rose-50/60'
                        }`}
                      >
                        {/* Roll No */}
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-xs">
                            {s.roll_no || idx + 1}
                          </span>
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-4">
                          <strong className="text-slate-900 text-sm block">{s.full_name}</strong>
                          <span className="text-[10px] text-slate-400">{s.gender} Wing</span>
                        </td>

                        {/* Admission No */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {s.admission_no}
                        </td>

                        {/* Present Tick Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={() => handleTogglePresent(s.student_id, s.status)}
                              className="w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Absent Untick Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={!isPresent}
                              onChange={() => handleStatusSelect(s.student_id, 'Absent')}
                              className="w-5 h-5 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-right pr-6">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center gap-1 shadow-sm ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPresent ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{isPresent ? 'PRESENT' : 'ABSENT'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Bar */}
          {dailyStudents.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Showing all <strong>{totalEnrolled}</strong> students in {currentClassObj?.name} {selectedGender}.
              </span>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Submit Attendance'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. MONTHLY ATTENDANCE MATRIX (GRID 1 .. 30/31) */}
      {/* ==================================================== */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              {currentClassObj?.name || monthlyData.className} — {selectedGender} → Monthly Record ({selectedMonth})
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Total Working Days: <strong>{monthlyData.totalWorkingDays || 0}</strong></span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">✓ = Present</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">A = Absent</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">- = No Session</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
              Loading monthly matrix...
            </div>
          ) : (monthlyData.students || []).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No student records found for this section.
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-2 text-center w-10 sticky left-0 bg-slate-900 z-10">Roll</th>
                    <th className="py-2.5 px-3 min-w-[140px] sticky left-10 bg-slate-900 z-10">Student</th>
                    {Array.from({ length: monthlyData.daysInMonth || 30 }, (_, i) => i + 1).map((d) => (
                      <th key={d} className="py-2.5 px-1 text-center w-7 border-l border-slate-800">
                        {d}
                      </th>
                    ))}
                    <th className="py-2.5 px-2 text-center bg-emerald-950 text-emerald-200 border-l border-slate-800">Present</th>
                    <th className="py-2.5 px-2 text-center bg-rose-950 text-rose-200 border-l border-slate-800">Absent</th>
                    <th className="py-2.5 px-3 text-center bg-slate-800 text-amber-300 border-l border-slate-800">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.students.map((st: any) => (
                    <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-center font-black text-slate-800 sticky left-0 bg-white shadow-sm">
                        {st.roll_no}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap sticky left-10 bg-white shadow-sm">
                        {st.full_name}
                      </td>
                      {Array.from({ length: monthlyData.daysInMonth || 30 }, (_, i) => i + 1).map((d) => {
                        const status = st.dailyMap?.[d];
                        return (
                          <td
                            key={d}
                            className={`py-2 px-1 text-center font-extrabold border-l border-slate-100 ${
                              status === 'Present'
                                ? 'text-emerald-700 bg-emerald-50/40'
                                : status === 'Absent'
                                ? 'text-rose-700 bg-rose-50/50'
                                : status === 'Late'
                                ? 'text-amber-700 bg-amber-50/40'
                                : 'text-slate-300'
                            }`}
                          >
                            {status === 'Present' ? '✓' : status === 'Absent' ? 'A' : status === 'Late' ? 'L' : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-black text-emerald-800 bg-emerald-50/60 border-l border-slate-200">
                        {st.presentCount}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-rose-800 bg-rose-50/60 border-l border-slate-200">
                        {st.absentCount}
                      </td>
                      <td className="py-2 px-3 text-center font-black text-slate-900 bg-slate-100 border-l border-slate-200">
                        {st.percentage !== '-' ? `${st.percentage}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. 24-SECTION INSTITUTIONAL OVERVIEW MATRIX */}
      {/* ==================================================== */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-500">Total Marked Today</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {matrixData.overall?.total_marked || 0}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm text-center">
              <span className="text-xs font-bold text-emerald-700">Present</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">
                {matrixData.overall?.present_count || 0}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm text-center">
              <span className="text-xs font-bold text-rose-700">Absent</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1">
                {matrixData.overall?.absent_count || 0}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm text-center">
              <span className="text-xs font-bold text-amber-700">Late Arrivals</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
                {matrixData.overall?.late_count || 0}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Institution-Wide Breakdown across 24 Dual Wings for {date}</span>
              <span className="text-xs font-normal text-slate-500">Total 303 Active Students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Class & Wing</th>
                    <th className="py-3 px-4">Class Usthad</th>
                    <th className="py-3 px-4 text-center">Enrolled</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(matrixData.sections || []).map((sec: any) => {
                    const isMarked = Number(sec.present_count || 0) + Number(sec.absent_count || 0) > 0;
                    return (
                      <tr key={sec.section_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                              sec.section_name === 'Boys' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {sec.class_name} {sec.section_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{sec.teacher_name || '—'}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{sec.total_students || 0}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{sec.present_count || 0}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700">{sec.absent_count || 0}</td>
                        <td className="py-3 px-4 text-center">
                          {isMarked ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Recorded
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right pr-6">
                          <button
                            type="button"
                            onClick={() => {
                              const matchingClass = classes.find((c) => c.name === sec.class_name);
                              if (matchingClass) setSelectedClassId(String(matchingClass.id));
                              setSelectedGender(sec.section_name);
                              setViewMode('daily');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 font-bold text-[11px] transition-all"
                          >
                            Open Daily Entry
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
