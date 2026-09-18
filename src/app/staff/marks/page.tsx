'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Users,
  School,
  BookOpen,
  Award,
  Search
} from 'lucide-react';

function StaffMarksContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSecId = searchParams.get('sectionId') || '';

  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  
  const [exams, setExams] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Load Meta: Classes, Exams, Subjects
  useEffect(() => {
    async function loadMeta() {
      try {
        const [eRes, cRes] = await Promise.all([
          fetch('/api/exams', { cache: 'no-store' }),
          fetch('/api/classes', { cache: 'no-store' })
        ]);

        if (eRes.ok) {
          const eData = await eRes.json();
          const exList = eData.exams || [];
          setExams(exList);
          if (exList.length > 0) setSelectedExam(String(exList[0].id));
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          const list = cData.assignedClassList || [];
          setAssignedList(list);
          setAllSubjects(cData.subjects || []);

          if (list.length > 0) {
            const matched = list.find((item: any) => String(item.sectionId) === String(initialSecId));
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
        console.error('Failed to load marks meta:', e);
      }
    }
    loadMeta();
  }, [initialClassId, initialSecId]);

  const currentAssignment = assignedList.find(a => String(a.sectionId) === String(selectedSectionId)) || assignedList[0];

  // Filter subjects for the selected class
  const classSubjects = allSubjects.filter(sub => 
    !currentAssignment || String(sub.class_id) === String(currentAssignment.classId)
  );

  useEffect(() => {
    if (classSubjects.length > 0) {
      const stillValid = classSubjects.some(s => String(s.id) === String(selectedSubject));
      if (!stillValid) setSelectedSubject(String(classSubjects[0].id));
    } else {
      setSelectedSubject('');
    }
  }, [selectedSectionId, allSubjects]);

  // 2. Load Marks for Selected Exam, Section, Subject
  const loadMarks = async () => {
    if (!selectedExam || !selectedSectionId || !selectedSubject) return;
    setLoading(true);
    setMsg(null);
    setSaveStatus('');
    try {
      const res = await fetch(`/api/marks?examId=${selectedExam}&sectionId=${selectedSectionId}&subjectId=${selectedSubject}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Failed to fetch marks' });
      }
    } catch (e) {
      console.error('Marks fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarks();
  }, [selectedExam, selectedSectionId, selectedSubject]);

  // Handle Mark Change
  const handleMarkChange = (studentId: number, val: string) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        const mNum = val === '' ? '' : Number(val);
        let grade = '';
        const passMark = s.pass_marks || 40;
        const maxMark = s.max_marks || 100;

        if (mNum !== '') {
          const n = Number(mNum);
          const pct = maxMark > 0 ? (n / maxMark) * 100 : 0;
          if (pct >= 90) grade = 'A+';
          else if (pct >= 80) grade = 'A';
          else if (pct >= 70) grade = 'B+';
          else if (pct >= 60) grade = 'B';
          else if (pct >= 50) grade = 'C+';
          else if (pct >= 40) grade = 'C';
          else grade = 'F';
        }
        return { 
          ...s, 
          marks_obtained: mNum, 
          grade, 
          is_pass: mNum !== '' ? (Number(mNum) >= passMark ? 1 : 0) : 0 
        };
      }
      return s;
    }));
    setSaveStatus('Unsaved changes');
  };

  // Save Marks
  const handleSaveMarks = async (status: 'Draft' | 'Approved') => {
    if (!selectedExam || !selectedSectionId || !selectedSubject || students.length === 0) return;
    setSaving(true);
    setSaveStatus('Saving to database...');
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        marks_obtained: s.marks_obtained !== undefined && s.marks_obtained !== '' ? Number(s.marks_obtained) : 0,
        grade: s.grade || (Number(s.marks_obtained || 0) >= (s.pass_marks || 40) ? 'B' : 'F'),
        remarks: s.remarks || (Number(s.marks_obtained || 0) >= (s.pass_marks || 40) ? 'Jayyid (Good)' : 'Needs Improvement'),
        max_marks: s.max_marks || 100,
        pass_marks: s.pass_marks || 40
      }));

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          sectionId: selectedSectionId,
          subjectId: selectedSubject,
          status,
          records
        })
      });

      if (res.ok) {
        setSaveStatus('✓ Saved to database');
        setMsg({ type: 'success', text: `Marks successfully saved as ${status} for ${records.length} students!` });
        loadMarks();
        setTimeout(() => {
          setMsg(null);
          setSaveStatus('');
        }, 3500);
      } else {
        const d = await res.json();
        setSaveStatus('Error saving');
        setMsg({ type: 'error', text: d.error || 'Failed to save marks' });
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return s.full_name?.toLowerCase().includes(q) || s.admission_no?.toLowerCase().includes(q) || String(s.roll_no) === q;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header & Class Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Staff Marks Grader
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                Automated Grading
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-emerald-800" />
              <span>Examination Marks & Evaluation</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select your assigned class, exam, and subject to input and evaluate student marks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveMarks('Draft')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveMarks('Approved')}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SELECTORS AT TOP: Class [▼] Exam [▼] Subject [▼]              */}
        {/* ============================================================ */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fbfbf8] to-slate-50 border border-slate-200 flex flex-wrap items-center gap-4">
          
          {/* Assigned Class Switcher */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Assigned Class:</label>
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
                      <School className="w-3.5 h-3.5" />
                      <span>{item.className} — {item.wing}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-400">Loading assignments...</span>
            )}
          </div>

          {/* Exam Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Examination:</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
            >
              {classSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          {/* Save Status */}
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

      {/* Marks Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              {currentAssignment?.className} ({currentAssignment?.wing}) • Student Evaluation Roster
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {students.length} Students
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-700" />
            Loading student marks roster...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            No enrolled students found for this classroom and exam.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-14 sticky left-0 bg-slate-900 z-10">Roll</th>
                  <th className="py-3 px-4 min-w-[160px] sticky left-14 bg-slate-900 z-10">Student Name</th>
                  <th className="py-3 px-3">Admission</th>
                  <th className="py-3 px-3 text-center">Max Marks</th>
                  <th className="py-3 px-3 text-center">Pass Marks</th>
                  <th className="py-3 px-4 text-center">Marks Obtained (Edit)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Evaluation Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((s, idx) => {
                  const maxM = s.max_marks || 100;
                  const passM = s.pass_marks || 40;
                  const obtM = s.marks_obtained;
                  const isPass = obtM !== undefined && obtM !== '' ? Number(obtM) >= passM : false;

                  return (
                    <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                      {/* Sticky Roll */}
                      <td className="py-3 px-3 text-center font-black text-slate-900 sticky left-0 bg-white shadow-sm z-10 font-mono">
                        {s.roll_no || idx + 1}
                      </td>

                      {/* Sticky Name */}
                      <td className="py-3 px-4 whitespace-nowrap sticky left-14 bg-white shadow-sm z-10 font-bold text-slate-900">
                        {s.full_name}
                      </td>

                      {/* Admission */}
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {s.admission_no}
                      </td>

                      {/* Max Marks */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                        {maxM}
                      </td>

                      {/* Pass Marks */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                        {passM}
                      </td>

                      {/* Marks Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={maxM}
                          value={obtM !== undefined ? obtM : ''}
                          onChange={(e) => handleMarkChange(s.student_id, e.target.value)}
                          placeholder="Marks"
                          className="w-24 px-3 py-1.5 text-center rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-white shadow-sm"
                        />
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-3 text-center">
                        <span className={`w-8 h-8 rounded-xl inline-flex items-center justify-center font-black text-xs shadow-sm ${
                          s.grade === 'A+' || s.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.grade === 'B+' || s.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : s.grade === 'C+' || s.grade === 'C'
                            ? 'bg-amber-100 text-amber-900'
                            : s.grade === 'F'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {s.grade || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={s.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudents(prev => prev.map(item => item.student_id === s.student_id ? { ...item, remarks: val } : item));
                            setSaveStatus('Unsaved changes');
                          }}
                          placeholder="Evaluation notes..."
                          className="w-full px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-semibold">
            Auto-calculates grades based on institutional standards.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveMarks('Draft')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveMarks('Approved')}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Publish Marks'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function StaffMarksPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400 text-xs font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
        Loading Marks Grader...
      </div>
    }>
      <StaffMarksContent />
    </Suspense>
  );
}
