'use client';

import React, { useState, useEffect } from 'react';
import { School, Users, UserCheck, Edit, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editSection, setEditSection] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/teachers')
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setClasses(cData.classes || []);
        setSections(cData.sections || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTeachers(tData.teachers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: editSection.id,
          classTeacherId: selectedTeacherId || null
        })
      });
      if (res.ok) {
        setEditSection(null);
        setMsg('Class teacher assigned successfully!');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <School className="w-6 h-6 text-purple-700" />
          <span>Classes & Sections Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Class 1 to +2 with dual wings (Boys & Girls). Assign and manage dedicated Class Teachers for each section.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const classSections = sections.filter((sec) => sec.class_id === cls.id);
          const boysSec = classSections.find((s) => s.name === 'Boys');
          const girlsSec = classSections.find((s) => s.name === 'Girls');

          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-extrabold text-base text-slate-900">{cls.name}</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Order #{cls.numeric_order}
                </span>
              </div>

              {/* Boys Wing */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>{cls.name} Boys</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Teacher: <strong className="text-slate-800">{boysSec?.teacher_name || 'Not Assigned'}</strong>
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-1">
                    {boysSec?.student_count || 0} Students Enrolled
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditSection(boysSec);
                    setSelectedTeacherId(String(boysSec?.class_teacher_id || ''));
                  }}
                  className="px-2.5 py-1 rounded bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold shadow-sm"
                >
                  Assign Teacher
                </button>
              </div>

              {/* Girls Wing */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>{cls.name} Girls</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Teacher: <strong className="text-slate-800">{girlsSec?.teacher_name || 'Not Assigned'}</strong>
                  </div>
                  <div className="text-[10px] text-rose-700 font-semibold mt-1">
                    {girlsSec?.student_count || 0} Students Enrolled
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditSection(girlsSec);
                    setSelectedTeacherId(String(girlsSec?.class_teacher_id || ''));
                  }}
                  className="px-2.5 py-1 rounded bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold shadow-sm"
                >
                  Assign Teacher
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Teacher Modal */}
      {editSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">
              Assign Class Teacher for {editSection.class_name} ({editSection.name})
            </h3>
            <p className="text-xs text-slate-500">
              The assigned Class Teacher will have administrative oversight of attendance and marks for this section.
            </p>

            <form onSubmit={handleSaveClassTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Faculty Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none bg-white"
                >
                  <option value="">-- No Class Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.staff_id})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditSection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-md"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}