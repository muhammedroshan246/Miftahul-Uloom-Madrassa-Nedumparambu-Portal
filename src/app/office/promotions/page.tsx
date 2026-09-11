'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle, Users, ArrowRight } from 'lucide-react';

export default function PromotionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [fromSectionId, setFromSectionId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function loadSections() {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        if (data.sections?.length > 0) {
          setFromSectionId(String(data.sections[0].id));
          if (data.sections.length > 2) setToSectionId(String(data.sections[2].id));
        }
      }
    }
    loadSections();
  }, []);

  const loadStudents = async () => {
    if (!fromSectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.students || []).filter((s: any) => String(s.section_id) === fromSectionId);
        setStudents(list);
        setSelectedStudentIds(list.map((s: any) => s.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [fromSectionId]);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePromote = async () => {
    if (!toSectionId || selectedStudentIds.length === 0) return;
    try {
      const res = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'promote_batch',
          fromSectionId,
          toSectionId,
          studentIds: selectedStudentIds
        })
      });
      if (res.ok) {
        setMsg(`Successfully promoted ${selectedStudentIds.length} students!`);
        loadStudents();
        setTimeout(() => setMsg(''), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-emerald-800" />
          <span>Academic Year Class Promotion System</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Promote student batches to the next higher grade (e.g. Class 7 Boys → Class 8 Boys) or transition senior +2 students to alumni.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Promotion Config Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Source Class & Section (Promote From)
            </label>
            <select
              value={fromSectionId}
              onChange={(e) => setFromSectionId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.class_name} {sec.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Destination Class & Section (Promote To)
            </label>
            <select
              value={toSectionId}
              onChange={(e) => setToSectionId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.class_name} {sec.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Selection Roster */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Select Students to Promote ({selectedStudentIds.length} Selected)</span>
            <button
              onClick={() => setSelectedStudentIds(students.map(s => s.id))}
              className="text-emerald-800 font-bold hover:underline text-[11px]"
            >
              Select All
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
            {students.map((s) => (
              <label key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <div>
                    <strong className="text-slate-900">{s.full_name}</strong>
                    <div className="text-[10px] text-slate-400 font-mono">Adm: {s.admission_no} • Roll: #{s.roll_no}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                  {s.status}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handlePromote}
            disabled={selectedStudentIds.length === 0}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <span>Execute Promotion for {selectedStudentIds.length} Students</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}