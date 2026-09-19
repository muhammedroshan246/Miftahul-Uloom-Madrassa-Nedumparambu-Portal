'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Award,
  Sparkles
} from 'lucide-react';
import { useStaffClass } from '../StaffClassContext';

function calculateGrade(marks: number, max: number = 100): string {
  const pct = max > 0 ? (marks / max) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'F';
}

export default function StaffMarksPage() {
  const { selectedClassId, selectedClass, assignedClasses, setSelectedClassId } = useStaffClass();

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch exams and classes data on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [eRes, cRes] = await Promise.all([
          fetch('/api/exams'),
          fetch('/api/classes')
        ]);

        if (eRes.ok) {
          const eData = await eRes.json();
          const list = eData.exams || [];
          setExams(list);
          if (list.length > 0) setSelectedExamId(list[0].id);
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          setSections(cData.sections || []);
          setSubjects(cData.subjects || []);
        }
      } catch (err) {
        console.error('Error loading marks metadata:', err);
      }
    }

    loadMeta();
  }, []);

  // Filter sections and subjects for selectedClassId
  const classSections = sections.filter((s) => Number(s.class_id) === Number(selectedClassId));
  const classSubjects = subjects.filter((s) => Number(s.class_id) === Number(selectedClassId));

  // Default section and subject whenever selectedClassId changes
  useEffect(() => {
    if (classSections.length > 0) {
      setSelectedSectionId(classSections[0].id);
    } else {
      setSelectedSectionId(null);
    }

    if (classSubjects.length > 0) {
      setSelectedSubjectId(classSubjects[0].id);
    } else {
      setSelectedSubjectId(null);
    }
  }, [selectedClassId, sections.length, subjects.length]);

  // 2. Fetch marks table for selectedExamId, selectedSectionId, selectedSubjectId
  useEffect(() => {
    if (!selectedExamId || !selectedSectionId || !selectedSubjectId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSaveSuccess(null);

    async function fetchMarks() {
      try {
        const res = await fetch(
          `/api/marks?examId=${selectedExamId}&sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load marks');
        }

        const data = await res.json();
        if (isMounted) {
          setStudents(data.students || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading marks table');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMarks();

    return () => {
      isMounted = false;
    };
  }, [selectedExamId, selectedSectionId, selectedSubjectId]);

  // Handle local marks change
  const handleMarkChange = (studentId: number, val: string) => {
    const num = val === '' ? 0 : Math.max(0, Number(val));
    setStudents((prev) =>
      prev.map((st) => {
        if (st.student_id !== studentId) return st;
        const maxM = Number(st.max_marks) || 100;
        const passM = Number(st.pass_marks) || 40;
        const grade = calculateGrade(num, maxM);
        const isPass = num >= passM ? 1 : 0;
        return {
          ...st,
          marks_obtained: num,
          grade,
          is_pass: isPass
        };
      })
    );
  };

  // Save marks to SQLite
  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSectionId || !selectedSubjectId) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const records = students.map((st) => ({
        student_id: st.student_id,
        marks_obtained: Number(st.marks_obtained) || 0,
        grade: st.grade || 'F',
        is_pass: st.is_pass === 1 ? 1 : 0,
        remarks: st.remarks || ''
      }));

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: Number(selectedExamId),
          sectionId: Number(selectedSectionId),
          subjectId: Number(selectedSubjectId),
          status: 'Approved',
          records
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save marks');
      }

      setSaveSuccess('Marks recorded and saved to SQLite database successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving marks');
    } finally {
      setSaving(false);
    }
  };

  const currentSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                Marks Grader
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedClass?.className || 'Selected Class'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
              <span>{selectedClass?.className} Examination Marks</span>
            </h1>
            <p className="text-xs text-slate-500">
              Enter terminal or evaluation marks. Grades and pass status are calculated automatically.
            </p>
          </div>

          <button
            onClick={handleSaveMarks}
            disabled={saving || loading || students.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{saving ? 'Saving...' : 'Save Marks'}</span>
          </button>
        </div>

        {/* Top Controls: Exam, Wing/Section, Subject */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Select */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-marks-exam-select" className="text-xs font-bold text-slate-500">Exam:</label>
              <select
                id="staff-marks-exam-select"
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(Number(e.target.value))}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            {/* Wing / Section Select */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-marks-wing-select" className="text-xs font-bold text-slate-500">Wing:</label>
              <select
                id="staff-marks-wing-select"
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name} Wing</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-marks-subject-select" className="text-xs font-bold text-slate-500">Subject:</label>
              <select
                id="staff-marks-subject-select"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {classSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
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
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Marks Grading Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            {selectedClass?.className} • {currentSection?.name} Wing ({students.length} Students)
          </div>
          <div className="text-xs text-slate-400">
            Pass Marks: {students[0]?.pass_marks || 40} / {students[0]?.max_marks || 100}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading marks table...
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">
            No students found for this class and section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 border-r border-slate-200 text-center">Roll</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[180px]">Student Name</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24 text-center">Admission</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-32 text-center">Marks Obtained</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24 text-center">Grade</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24 text-center">Result</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const isPass = st.is_pass === 1;
                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 border-r border-slate-200 font-mono font-bold text-slate-700 text-center">
                        {st.roll_no || '—'}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900">
                        {st.full_name}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 font-mono text-slate-500 text-center">
                        {st.admission_no}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={st.max_marks || 100}
                            value={st.marks_obtained ?? ''}
                            onChange={(e) => handleMarkChange(st.student_id, e.target.value)}
                            className="w-20 text-center font-mono font-bold text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                          <span className="text-slate-400 font-mono text-[11px]">/ {st.max_marks || 100}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span className={'px-2.5 py-1 rounded-xl text-xs font-black ' + (
                          st.grade === 'A+' || st.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.grade === 'B+' || st.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : st.grade === 'C+' || st.grade === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        )}>
                          {st.grade || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                          isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        )}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={st.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudents((prev) =>
                              prev.map((s) => (s.student_id === st.student_id ? { ...s, remarks: val } : s))
                            );
                          }}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-slate-200 focus:bg-white focus:outline-none"
                        />
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
