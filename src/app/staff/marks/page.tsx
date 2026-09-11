'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StaffMarksPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [eRes, cRes] = await Promise.all([
          fetch('/api/exams'),
          fetch('/api/classes')
        ]);
        if (eRes.ok) {
          const eData = await eRes.json();
          setExams(eData.exams || []);
          if (eData.exams?.length > 0) setSelectedExam(String(eData.exams[0].id));
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          setSections(cData.sections || []);
          setSubjects(cData.subjects || []);
          if (cData.sections?.length > 0) setSelectedSection(String(cData.sections[0].id));
          if (cData.subjects?.length > 0) setSelectedSubject(String(cData.subjects[0].id));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  const loadMarks = async () => {
    if (!selectedExam || !selectedSection || !selectedSubject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marks?examId=${selectedExam}&sectionId=${selectedSection}&subjectId=${selectedSubject}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarks();
  }, [selectedExam, selectedSection, selectedSubject]);

  const handleMarkChange = (studentId: number, val: string) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        const mNum = val === '' ? '' : Number(val);
        let grade = '';
        if (mNum !== '') {
          const n = Number(mNum);
          if (n >= 90) grade = 'A+';
          else if (n >= 80) grade = 'A';
          else if (n >= 70) grade = 'B+';
          else if (n >= 60) grade = 'B';
          else if (n >= 50) grade = 'C+';
          else if (n >= 40) grade = 'C';
          else grade = 'F';
        }
        return { ...s, marks_obtained: mNum, grade, is_pass: Number(mNum) >= (s.pass_marks || 40) ? 1 : 0 };
      }
      return s;
    }));
  };

  const handleSaveMarks = async (status: 'Draft' | 'Approved') => {
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        marks_obtained: s.marks_obtained !== undefined ? s.marks_obtained : 0,
        grade: s.grade,
        remarks: s.remarks || (s.grade === 'A+' ? 'Mumtaz (Excellent)' : 'Jayyid (Good)'),
        max_marks: s.max_marks || 100,
        pass_marks: s.pass_marks || 40
      }));

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          subjectId: selectedSubject,
          sectionId: selectedSection,
          status,
          records
        })
      });

      if (res.ok) {
        setMsg(`Marks saved successfully as ${status}!`);
        loadMarks();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
            <span>Fast Marks Entry & Auto-Grader</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter marks (0–100). Grades (A+, A, B+, B, C+, C, F) and Pass/Fail status calculate in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveMarks('Draft')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSaveMarks('Approved')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Submit to Office</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white min-w-[180px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Class Wing</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white min-w-[150px]"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.class_name} {sec.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white min-w-[180px]"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Marks List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl border border-slate-200">
            Loading mark sheet...
          </div>
        ) : (
          students.map((s) => (
            <div
              key={s.student_id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-extrabold flex items-center justify-center text-sm">
                  #{s.roll_no}
                </div>
                <div>
                  <strong className="text-slate-900 text-sm block">{s.full_name}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">{s.admission_no}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Mark / 100</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={s.marks_obtained !== undefined ? s.marks_obtained : ''}
                    onChange={(e) => handleMarkChange(s.student_id, e.target.value)}
                    placeholder="—"
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-sm outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                  />
                </div>

                <div className="text-center min-w-[50px]">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Grade</span>
                  <span className={`inline-block px-2 py-1 rounded font-extrabold text-xs ${
                    s.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                    s.grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {s.grade || '—'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}