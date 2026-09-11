'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, Award, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudentResultsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load Exams list
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/exams');
        if (res.ok) {
          const eData = await res.json();
          setExams(eData.exams || []);
          if (eData.exams?.length > 0) {
            setSelectedExamId(String(eData.exams[0].id));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadExams();
  }, []);

  // Fetch results for selected exam
  const fetchResults = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marks?examId=${selectedExamId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Fetch student results error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExamId]);

  const student = data?.student || {};
  const marks = data?.marks || [];
  const totalObtained = data?.totalObtained || 0;
  const totalMax = data?.totalMax || 0;
  const overallPercentage = data?.overallPercentage || '0';
  const isAllPassed = data?.isAllPassed;

  const currentExamObj = exams.find((e) => String(e.id) === String(selectedExamId));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-800" />
            <span>Academic Marksheets & Progress Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official terminal results certified by Mifthahul Uloom Madrassa Board.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Exam Selector */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white shadow-sm focus:ring-2 focus:ring-emerald-600"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Marksheet</span>
          </button>
        </div>
      </div>

      {/* Official Report Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
        
        {/* Madrassa Letterhead */}
        <div className="text-center pb-6 border-b-2 border-emerald-900/40 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/branding/madrassa_logo.png"
            alt="Madrassa Logo"
            className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-sm"
          />
          <div className="font-serif text-xl text-emerald-900 font-bold">مدرسة مفتاح العلوم الثانوية العليا</div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            MIFTHAHUL ULOOM HIGHER SECONDARY MADRASSA
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Madrassa No: 5090 • Range: Vengara (No: 50) • Nedumparambu
          </p>
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold mt-2 uppercase tracking-wide">
            {currentExamObj?.name || 'TERMINAL EXAMINATION PROGRESS REPORT'} (2026-2027)
          </div>
        </div>

        {/* Student Meta Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
            <strong className="text-slate-900 text-sm">{student.full_name || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission No</span>
            <strong className="text-slate-900 font-mono text-sm">{student.admission_no || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Wing</span>
            <strong className="text-slate-900 text-sm">
              {student.class_name} {student.section_name}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll Number</span>
            <strong className="text-slate-900 text-sm">#{student.roll_no || '—'}</strong>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-center">Marks Obtained</th>
                <th className="py-3 px-4 text-center">Total Mark</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-700" />
                    <span>Loading results...</span>
                  </td>
                </tr>
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No examination marks published yet for {currentExamObj?.name || 'this exam'}.
                  </td>
                </tr>
              ) : (
                marks.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">{m.subject_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{m.subject_code || '—'}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">{m.marks_obtained}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">{m.max_marks || 100}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{m.percentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-black text-slate-900 text-xs">
                        {m.grade || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.is_pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.is_pass ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {marks.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 uppercase text-slate-600">Grand Total:</td>
                  <td className="py-3.5 px-4 text-center text-emerald-900 font-black text-sm">{totalObtained}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-mono font-bold">{totalMax}</td>
                  <td colSpan={2} className="py-3.5 px-4 text-center text-emerald-800 font-black">
                    Overall: {overallPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black shadow-sm ${
                        isAllPassed ? 'bg-emerald-800 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isAllPassed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Official Signatures */}
        <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold">Class Usthad</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold">Head Examiner</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold">Sadr Usthad & Seal</div>
          </div>
        </div>

      </div>
    </div>
  );
}
