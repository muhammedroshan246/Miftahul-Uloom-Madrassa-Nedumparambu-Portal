'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Check, 
  Building2, 
  BookOpen, 
  Award,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

export default function OfficeMarksPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGender, setSelectedGender] = useState('Boys');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjectMeta, setSubjectMeta] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Add Subject Modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubMaxMarks, setNewSubMaxMarks] = useState('50');
  const [newSubPassMarks, setNewSubPassMarks] = useState('20');
  const [subModalLoading, setSubModalLoading] = useState(false);

  // Quick Create Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('Monthly Test');
  const [newExamStart, setNewExamStart] = useState('');
  const [newExamEnd, setNewExamEnd] = useState('');
  const [examModalLoading, setExamModalLoading] = useState(false);

  // Load Meta
  const loadMeta = async () => {
    try {
      const [eRes, cRes, sRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/classes'),
        fetch('/api/subjects?status=active')
      ]);

      let firstClassId = '';
      if (cRes.ok) {
        const cData = await cRes.json();
        setClasses(cData.classes || []);
        setSections(cData.sections || []);
        if (cData.classes?.length > 0) {
          firstClassId = String(cData.classes[0].id);
          setSelectedClassId(firstClassId);
        }
      }

      if (eRes.ok) {
        const eData = await eRes.json();
        setExams(eData.exams || []);
        if (eData.exams?.length > 0) setSelectedExamId(String(eData.exams[0].id));
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setAllSubjects(sData.subjects || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  // Filter subjects for the selected class
  const classSubjects = allSubjects.filter(
    (sub) => String(sub.class_id) === String(selectedClassId)
  );

  // Auto-select first subject when class changes
  useEffect(() => {
    if (classSubjects.length > 0) {
      const exists = classSubjects.some((s) => String(s.id) === String(selectedSubjectId));
      if (!exists) {
        setSelectedSubjectId(String(classSubjects[0].id));
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedClassId, allSubjects]);

  const activeSection = sections.find(
    (s) => String(s.class_id) === String(selectedClassId) && s.name.toLowerCase() === selectedGender.toLowerCase()
  );

  // Load marks roster for selected Class + Section + Exam + Subject
  const loadMarks = async () => {
    if (!selectedExamId || !activeSection || !selectedSubjectId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/marks?examId=${selectedExamId}&sectionId=${activeSection.id}&subjectId=${selectedSubjectId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setSubjectMeta({
          subjectName: data.subjectName,
          maxMarks: data.maxMarks || 100,
          passMarks: data.passMarks || 40
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarks();
  }, [selectedExamId, selectedClassId, selectedGender, selectedSubjectId, sections]);

  // Handle Mark Input with strict Total Mark validation
  const handleMarkChange = (studentId: number, val: string) => {
    const totalMax = Number(subjectMeta.maxMarks) || 100;
    const passMarks = Number(subjectMeta.passMarks) || 40;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          const mNum = val === '' ? '' : Number(val);
          let grade = '-';
          let isPass = 1;
          let hasError = false;

          if (mNum !== '') {
            const n = Number(mNum);
            if (n < 0 || n > totalMax) {
              hasError = true;
            } else {
              const pct = (n / totalMax) * 100;
              if (pct >= 90) grade = 'A+';
              else if (pct >= 80) grade = 'A';
              else if (pct >= 70) grade = 'B+';
              else if (pct >= 60) grade = 'B';
              else if (pct >= 50) grade = 'C+';
              else if (pct >= 40) grade = 'C';
              else grade = 'F';
              isPass = n >= passMarks ? 1 : 0;
            }
          }

          return {
            ...s,
            marks_obtained: mNum,
            grade,
            is_pass: isPass,
            hasError
          };
        }
        return s;
      })
    );
  };

  // Save Marks
  const handleSaveMarks = async (status: 'Draft' | 'Approved') => {
    const totalMax = Number(subjectMeta.maxMarks) || 100;

    // Check if any student mark exceeds total mark
    const invalidEntry = students.find((s) => {
      const v = Number(s.marks_obtained);
      return !isNaN(v) && (v < 0 || v > totalMax);
    });

    if (invalidEntry) {
      setMsg({
        type: 'error',
        text: `Invalid mark for ${invalidEntry.full_name}. Mark cannot be less than 0 or exceed Total Mark of ${totalMax}.`
      });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const records = students.map((s) => ({
        student_id: s.student_id,
        marks_obtained: s.marks_obtained !== undefined && s.marks_obtained !== '' ? Number(s.marks_obtained) : 0,
        grade: s.grade || '-',
        remarks: s.remarks || null,
        max_marks: totalMax,
        pass_marks: subjectMeta.passMarks || 40
      }));

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExamId,
          sectionId: activeSection?.id,
          subjectId: selectedSubjectId,
          status,
          records
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `✓ ${data.message || 'Marks saved successfully!'}` });
        loadMarks();
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save marks.' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error communicating with server.' });
    } finally {
      setSaving(false);
    }
  };

  // Quick Subject Creation handler
  const handleQuickAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedClassId) return;

    setSubModalLoading(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubName.trim(),
          code: newSubCode.trim().toUpperCase() || null,
          classId: Number(selectedClassId),
          maxMarks: Number(newSubMaxMarks) || 50,
          passMarks: Number(newSubPassMarks) || 20,
          isActive: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubModalOpen(false);
        setNewSubName('');
        setNewSubCode('');
        await loadMeta();
        if (data.subject?.id) setSelectedSubjectId(String(data.subject.id));
        setMsg({ type: 'success', text: `Subject '${data.subject.name}' added with Total Mark: ${data.subject.max_marks}!` });
        setTimeout(() => setMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to create subject');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubModalLoading(false);
    }
  };

  // Quick Exam Creation handler
  const handleQuickAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;

    setExamModalLoading(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExamName.trim(),
          examType: newExamType,
          startDate: newExamStart || null,
          endDate: newExamEnd || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsExamModalOpen(false);
        setNewExamName('');
        await loadMeta();
        if (data.exam?.id) setSelectedExamId(String(data.exam.id));
        setMsg({ type: 'success', text: `Exam '${data.exam.name}' created successfully!` });
        setTimeout(() => setMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to create exam');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExamModalLoading(false);
    }
  };

  const currentClassObj = classes.find((c) => String(c.id) === String(selectedClassId));
  const currentExamObj = exams.find((e) => String(e.id) === String(selectedExamId));
  const currentSubObj = allSubjects.find((s) => String(s.id) === String(selectedSubjectId));

  const totalMaxMarks = Number(subjectMeta.maxMarks) || Number(currentSubObj?.max_marks) || 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
            <span>Class-wise Marks & Results Entry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter examination marks with strict Total Mark validation, auto-grading, and instant percentage calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSubModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Add Subject</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExamModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Create Exam</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveMarks('Approved')}
            disabled={saving || students.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
          >
            <Check className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Saving...' : 'Submit Marks'}</span>
          </button>
        </div>
      </div>

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

      {/* Selectors Bar: Class -> Wing -> Exam -> Subject */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. Academic Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Wing */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">2. Section / Wing</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
              <option value="Boys">Boys Section</option>
              <option value="Girls">Girls Section</option>
            </select>
          </div>

          {/* 3. Examination */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">3. Examination</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.exam_type || 'Exam'})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Subject */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">4. Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            >
              {classSubjects.length === 0 ? (
                <option value="">No subjects in {currentClassObj?.name}</option>
              ) : (
                classSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (Max: {sub.max_marks || 100})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Meta Banner */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              {currentClassObj?.name} {selectedGender} • {currentExamObj?.name} • {currentSubObj?.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold font-mono">
              Total Mark: {totalMaxMarks}
            </span>
            <span className="text-slate-400 font-medium">
              (Pass Mark: {subjectMeta.passMarks || currentSubObj?.pass_marks || 40})
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Enter marks between 0 and {totalMaxMarks}.
          </span>
        </div>
      </div>

      {/* Marks Spreadsheet Entry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-16 text-center">Roll</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4 w-32">Admission No</th>
                <th className="py-3.5 px-4 text-center w-28">Total Mark</th>
                <th className="py-3.5 px-4 text-center w-36">Mark Obtained</th>
                <th className="py-3.5 px-4 text-center w-28">Percentage</th>
                <th className="py-3.5 px-4 text-center w-20">Grade</th>
                <th className="py-3.5 px-4 text-center w-24">Pass Status</th>
                <th className="py-3.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
                    <span>Loading student marks roster...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No active students found in this section.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const mVal = s.marks_obtained !== undefined && s.marks_obtained !== '' ? Number(s.marks_obtained) : null;
                  const pct = mVal !== null && totalMaxMarks > 0 ? ((mVal / totalMaxMarks) * 100).toFixed(1) : '-';

                  return (
                    <tr
                      key={s.student_id}
                      className={`transition-colors ${
                        s.hasError
                          ? 'bg-rose-100/50'
                          : mVal !== null
                          ? 'hover:bg-emerald-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-slate-900 text-sm">
                        {s.roll_no}
                      </td>

                      <td className="py-3 px-4">
                        <strong className="text-slate-900 text-sm block">{s.full_name}</strong>
                        <span className="text-[10px] text-slate-400">{s.gender} Wing</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold text-[11px]">
                        {s.admission_no}
                      </td>

                      {/* Total Mark of this Subject */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {totalMaxMarks}
                      </td>

                      {/* Mark Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={totalMaxMarks}
                          value={s.marks_obtained !== undefined ? s.marks_obtained : ''}
                          onChange={(e) => handleMarkChange(s.student_id, e.target.value)}
                          placeholder="0"
                          className={`w-24 px-2 py-1.5 rounded-xl border font-mono font-black text-center text-sm outline-none focus:ring-2 focus:ring-emerald-700 ${
                            s.hasError
                              ? 'border-rose-500 bg-rose-50 text-rose-900'
                              : 'border-slate-300 bg-amber-50/40 text-slate-900'
                          }`}
                        />
                        {s.hasError && (
                          <span className="block text-[9px] text-rose-600 font-bold mt-0.5">
                            Max: {totalMaxMarks}
                          </span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {pct !== '-' ? `${pct}%` : '-'}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-black ${
                            s.grade === 'A+'
                              ? 'bg-amber-100 text-amber-900'
                              : s.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.grade || '-'}
                        </span>
                      </td>

                      {/* Pass Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.is_pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {s.is_pass ? 'Passed' : 'Failed'}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={s.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudents((prev) =>
                              prev.map((item) => (item.student_id === s.student_id ? { ...item, remarks: val } : item))
                            );
                          }}
                          placeholder="e.g. Good progress"
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        {students.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Editing marks for <strong>{students.length}</strong> students in {currentClassObj?.name} {selectedGender}.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveMarks('Draft')}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveMarks('Approved')}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              >
                <Check className="w-4 h-4 text-amber-400" />
                <span>{saving ? 'Saving...' : 'Submit & Publish Marks'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ADD SUBJECT MODAL */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-800" />
                <span>Add Subject for {currentClassObj?.name}</span>
              </h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Fiqh, Aqeedah, Tafseer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="e.g. FIQ-C5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Total Mark with Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Total / Maximum Mark *</label>
                  <span className="text-[10px] text-slate-400">Presets:</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {[20, 25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNewSubMaxMarks(String(preset));
                        setNewSubPassMarks(String(Math.round(preset * 0.4)));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                        Number(newSubMaxMarks) === preset
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={newSubMaxMarks}
                  onChange={(e) => {
                    setNewSubMaxMarks(e.target.value);
                    setNewSubPassMarks(String(Math.round(Number(e.target.value) * 0.4)));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pass Mark (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max={newSubMaxMarks}
                  value={newSubPassMarks}
                  onChange={(e) => setNewSubPassMarks(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subModalLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black shadow-md"
                >
                  {subModalLoading ? 'Saving...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CREATE EXAM MODAL */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                <span>Create New Examination</span>
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Name *</label>
                <input
                  type="text"
                  required
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="e.g. First Term Monthly Assessment"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Type *</label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Monthly Test">Monthly Test</option>
                  <option value="First Term Examination">First Term Examination</option>
                  <option value="Second Term Examination">Second Term Examination</option>
                  <option value="Annual Examination">Annual Examination</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newExamStart}
                    onChange={(e) => setNewExamStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newExamEnd}
                    onChange={(e) => setNewExamEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={examModalLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black shadow-md"
                >
                  {examModalLoading ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
