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
  RefreshCw,
  Calendar,
  Layers,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MONTHS } from '@/lib/constants';

const YEARS = [2024, 2025, 2026, 2027, 2028];

function AttendanceContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSec = searchParams.get('sectionId') || '';

  // Selectors
  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSec);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(8); // September (0-indexed: 8)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [date, setDate] = useState('2026-09-08');

  // Data
  const [monthlyData, setMonthlyData] = useState<any>({});
  const [dailyStudents, setDailyStudents] = useState<any[]>([]);
  const [cellEdits, setCellEdits] = useState<Record<number, Record<number, string>>>({}); // { [studentId]: { [day]: 'Present'|'Absent'|'Not Marked' } }
  const [search, setSearch] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const monthStr = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;

  // 1. Load Staff Assigned Classes
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/classes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = data.assignedClassList || [];
          setAssignedList(list);

          if (list.length > 0) {
            const matched = list.find((item: any) => String(item.sectionId) === String(initialSec));
            const matchedClass = list.find((item: any) => String(item.classId) === String(initialClassId));
            if (matched) {
              setSelectedSectionId(String(matched.sectionId));
            } else if (matchedClass) {
              setSelectedSectionId(String(matchedClass.sectionId));
            } else if (!selectedSectionId) {
              setSelectedSectionId(String(list[0].sectionId));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load class metadata for staff:', e);
      }
    }
    loadMeta();
  }, [initialClassId, initialSec]);

  // 2. Fetch Attendance (Monthly or Daily)
  const fetchAttendance = async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    setMsg(null);
    setSaveStatus('');
    try {
      if (viewMode === 'monthly') {
        const res = await fetch(`/api/attendance?view=monthly&sectionId=${selectedSectionId}&month=${monthStr}`, { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setMonthlyData(d);
          // Initialize cell edits from loaded data
          const initialMap: Record<number, Record<number, string>> = {};
          (d.students || []).forEach((st: any) => {
            initialMap[st.student_id] = { ...(st.dailyMap || {}) };
          });
          setCellEdits(initialMap);
        } else {
          const err = await res.json();
          setMsg({ type: 'error', text: err.error || 'Failed to load monthly attendance' });
        }
      } else {
        const res = await fetch(`/api/attendance?sectionId=${selectedSectionId}&date=${date}`, { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setDailyStudents(d.students || []);
        } else {
          const err = await res.json();
          setMsg({ type: 'error', text: err.error || 'Failed to load daily attendance' });
        }
      }
    } catch (e) {
      console.error('Fetch attendance error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSectionId) {
      fetchAttendance();
    }
  }, [selectedSectionId, monthStr, viewMode, date]);

  // Handle cell toggle in monthly view: Present -> Absent -> Not Marked -> Present
  const handleToggleMonthlyCell = (studentId: number, day: number) => {
    setCellEdits((prev) => {
      const studentMap = { ...(prev[studentId] || {}) };
      const current = studentMap[day];
      let next = 'Present';
      if (current === 'Present') next = 'Absent';
      else if (current === 'Absent') next = 'Not Marked';
      else next = 'Present';

      studentMap[day] = next;
      return { ...prev, [studentId]: studentMap };
    });
    setSaveStatus('Unsaved changes');
  };

  // Bulk operation for monthly view
  const handleBulkMonthly = (type: 'all_present_day' | 'all_absent_day' | 'all_present_month' | 'clear_month', dayParam?: number) => {
    const daysInMonth = monthlyData.daysInMonth || 30;
    const students = monthlyData.students || [];

    setCellEdits((prev) => {
      const updated = { ...prev };

      if (type === 'all_present_day' && dayParam) {
        students.forEach((s: any) => {
          if (!updated[s.student_id]) updated[s.student_id] = {};
          updated[s.student_id][dayParam] = 'Present';
        });
      } else if (type === 'all_absent_day' && dayParam) {
        students.forEach((s: any) => {
          if (!updated[s.student_id]) updated[s.student_id] = {};
          updated[s.student_id][dayParam] = 'Absent';
        });
      } else if (type === 'all_present_month') {
        students.forEach((s: any) => {
          if (!updated[s.student_id]) updated[s.student_id] = {};
          for (let d = 1; d <= daysInMonth; d++) {
            updated[s.student_id][d] = 'Present';
          }
        });
      } else if (type === 'clear_month') {
        students.forEach((s: any) => {
          updated[s.student_id] = {};
        });
      }

      return updated;
    });
    setSaveStatus('Unsaved changes');
  };

  // Save monthly edits directly to database
  const handleSaveMonthly = async () => {
    if (!selectedSectionId) return;
    setSaving(true);
    setSaveStatus('Saving to database...');
    try {
      const daysInMonth = monthlyData.daysInMonth || 30;
      const recordsToSave: Array<{ student_id: number; date: string; status: string }> = [];

      Object.entries(cellEdits).forEach(([sIdStr, days]) => {
        const sId = Number(sIdStr);
        for (let d = 1; d <= daysInMonth; d++) {
          const st = days[d];
          if (st) {
            const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
            recordsToSave.push({
              student_id: sId,
              date: dateStr,
              status: st
            });
          }
        }
      });

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date: `${monthStr}-01`,
          records: recordsToSave
        })
      });

      if (res.ok) {
        setSaveStatus('✓ Saved to database');
        setMsg({ type: 'success', text: `Monthly attendance updated & saved for ${monthlyData.students?.length || 0} students!` });
        fetchAttendance();
        setTimeout(() => {
          setMsg(null);
          setSaveStatus('');
        }, 3500);
      } else {
        const err = await res.json();
        setSaveStatus('Error saving');
        setMsg({ type: 'error', text: err.error || 'Failed to save attendance' });
      }
    } catch (e) {
      console.error('Save error:', e);
      setSaveStatus('Error saving');
    } finally {
      setSaving(false);
    }
  };

  // Handle Daily View Status Toggle
  const handleToggleDaily = (studentId: number) => {
    setDailyStudents((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          let next = 'Present';
          if (s.status === 'Present') next = 'Absent';
          else if (s.status === 'Absent') next = 'Late';
          else next = 'Present';
          return { ...s, status: next };
        }
        return s;
      })
    );
  };

  // Save Daily View
  const handleSaveDaily = async () => {
    if (!selectedSectionId || dailyStudents.length === 0) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date,
          records: dailyStudents.map((s) => ({ student_id: s.student_id, status: s.status }))
        })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `✓ Daily attendance saved for ${dailyStudents.length} students on ${date}!` });
        setTimeout(() => setMsg(null), 3500);
      } else {
        const d = await res.json();
        setMsg({ type: 'error', text: d.error || 'Failed to save attendance' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const currentAssignment = assignedList.find((a) => String(a.sectionId) === String(selectedSectionId)) || assignedList[0];

  const filteredMonthlyStudents = (monthlyData.students || []).filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return s.full_name?.toLowerCase().includes(q) || String(s.roll_no) === q;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header & Selectors Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Staff Classroom Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                Excel Register Mode
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-emerald-800" />
              <span>Monthly Attendance Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select Month, Year, and Assigned Class to fully view and edit attendance.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'monthly'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Monthly Register</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1-Tap Daily</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SELECTORS AT THE TOP: Month [▼] Year [▼] Class [▼] Wing [▼] */}
        {/* ============================================================ */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fbfbf8] to-slate-50 border border-slate-200 flex flex-wrap items-center gap-4">
          
          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Month:</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
                className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
                className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Assigned Class & Wing Selector (Only Assigned Classes Shown) */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Assigned Class & Wing:</label>
            {assignedList.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {assignedList.map((item: any) => {
                  const isSelected = String(item.sectionId) === String(selectedSectionId);
                  return (
                    <button
                      key={item.sectionId}
                      type="button"
                      onClick={() => setSelectedSectionId(String(item.sectionId))}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{item.className} — {item.wing}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">Loading assignments...</span>
            )}
          </div>

          {/* Daily Date Picker (only in daily mode) */}
          {viewMode === 'daily' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Select Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
              />
            </div>
          )}

          {/* Save Status Indicator */}
          {saveStatus && (
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                saveStatus.includes('✓') 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : saveStatus.includes('Saving') 
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {saveStatus}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MONTHLY REGISTER VIEW (EXCEL-STYLE SPREADSHEET)         */}
      {/* ========================================================= */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          
          {/* Action & Legend Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                {currentAssignment?.className} ({currentAssignment?.wing}) • {MONTHS[selectedMonthIndex]} {selectedYear}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {monthlyData.students?.length || 0} Students
              </span>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkMonthly('all_present_month')}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1 transition-colors"
                title="Mark all days Present for all students"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkMonthly('clear_month')}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                title="Clear all markings for this month"
              >
                Clear Month
              </button>

              <button
                type="button"
                onClick={handleSaveMonthly}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {/* Cell Legend */}
          <div className="px-4 py-2 bg-[#fcfcf9] border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-semibold">Click any cell to toggle:</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">✓ Present</span>
              <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px]">✗ Absent</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-bold text-[11px]">— Not Marked</span>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter students in table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Spreadsheet Table */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-700" />
              Loading monthly attendance register...
            </div>
          ) : filteredMonthlyStudents.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs font-semibold">
              No students enrolled in this assigned section.
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-2 text-center w-10 sticky left-0 bg-slate-900 z-20">Roll</th>
                    <th className="py-2.5 px-3 min-w-[150px] sticky left-10 bg-slate-900 z-20">Student Name</th>
                    {Array.from({ length: monthlyData.daysInMonth || 30 }, (_, i) => i + 1).map((d) => (
                      <th key={d} className="py-2 px-1 text-center w-8 border-l border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleBulkMonthly('all_present_day', d)}
                          className="hover:text-amber-300 transition-colors block w-full text-center"
                          title={`Click to mark Day ${d} all Present`}
                        >
                          {d}
                        </button>
                      </th>
                    ))}
                    <th className="py-2.5 px-2 text-center bg-emerald-950 text-emerald-200 border-l border-slate-800 w-12">Present</th>
                    <th className="py-2.5 px-2 text-center bg-rose-950 text-rose-200 border-l border-slate-800 w-12">Absent</th>
                    <th className="py-2.5 px-2 text-center bg-slate-800 text-amber-300 border-l border-slate-800 w-14">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMonthlyStudents.map((st: any) => {
                    const studentCellMap = cellEdits[st.student_id] || {};
                    const daysInMonth = monthlyData.daysInMonth || 30;

                    let presentCount = 0;
                    let absentCount = 0;
                    for (let d = 1; d <= daysInMonth; d++) {
                      const val = studentCellMap[d];
                      if (val === 'Present') presentCount++;
                      else if (val === 'Absent') absentCount++;
                    }
                    const totalMarked = presentCount + absentCount;
                    const pct = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : '100.0';

                    return (
                      <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Sticky Roll */}
                        <td className="py-2 px-2 text-center font-black text-slate-800 sticky left-0 bg-white shadow-sm z-10">
                          {st.roll_no}
                        </td>

                        {/* Sticky Name */}
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap sticky left-10 bg-white shadow-sm z-10">
                          {st.full_name}
                        </td>

                        {/* Days 1 .. 31 Interactive Cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                          const status = studentCellMap[d];
                          const isPresent = status === 'Present';
                          const isAbsent = status === 'Absent';

                          return (
                            <td key={d} className="py-1 px-0.5 text-center border-l border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleToggleMonthlyCell(st.student_id, d)}
                                className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition-all mx-auto ${
                                  isPresent
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : isAbsent
                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                    : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                                title={`Day ${d}: ${status || 'Not Marked'} (Click to toggle)`}
                              >
                                {isPresent ? '✓' : isAbsent ? '✗' : '—'}
                              </button>
                            </td>
                          );
                        })}

                        {/* Totals */}
                        <td className="py-2 px-2 text-center font-black text-emerald-800 bg-emerald-50/50 border-l border-slate-200">
                          {presentCount}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-rose-800 bg-rose-50/50 border-l border-slate-200">
                          {absentCount}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-slate-900 bg-slate-100 border-l border-slate-200">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredMonthlyStudents.length}</strong> students. Click any cell to toggle Present/Absent/Not Marked.
            </span>
            <button
              type="button"
              onClick={handleSaveMonthly}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Persist Attendance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DAILY 1-TAP VIEW                                       */}
      {/* ========================================================= */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>Date:</span>
              <strong className="font-mono text-emerald-900 text-sm">{date}</strong>
              <span className="text-slate-400">•</span>
              <span>{currentAssignment?.className} ({currentAssignment?.wing})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDailyStudents(prev => prev.map(s => ({ ...s, status: 'Present' })))}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => setDailyStudents(prev => prev.map(s => ({ ...s, status: 'Absent' })))}
                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSaveDaily}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Day'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-700" />
              Loading daily attendance...
            </div>
          ) : dailyStudents.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs font-semibold">
              No students enrolled in this assigned section.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-16">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4 text-center">Tap Status</th>
                    <th className="py-3 px-4 text-center">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyStudents.map((s, idx) => {
                    const isPresent = s.status === 'Present';
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          {s.roll_no || idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {s.full_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {s.admission_no}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDaily(s.student_id)}
                            className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all shadow-sm ${
                              isPresent
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : s.status === 'Absent'
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {isPresent ? '✓ PRESENT' : s.status === 'Absent' ? '✗ ABSENT' : '◐ LATE'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Tap any status pill to cycle Present ➔ Absent ➔ Late.
            </span>
            <button
              type="button"
              onClick={handleSaveDaily}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow"
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
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400 text-xs font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
        Loading Attendance Module...
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  );
}
