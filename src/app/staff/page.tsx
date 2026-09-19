'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { useStaffClass } from './StaffClassContext';

export default function StaffDashboardPage() {
  const { assignedClasses, selectedClassId, selectedClass, setSelectedClassId, user } = useStaffClass();
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const cRes = await fetch('/api/classes');
        if (cRes.ok) {
          const cData = await cRes.json();
          setSections(cData.sections || []);
          setSubjects(cData.subjects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSections(false);
      }
    }
    loadData();
  }, []);

  // Filter sections for the currently selected class
  const currentSections = sections.filter((s: any) => Number(s.class_id) === Number(selectedClassId));
  const currentTotalStudents = currentSections.reduce((acc: number, s: any) => acc + (Number(s.student_count) || 0), 0);
  const currentSubjects = subjects.filter((sub: any) => Number(sub.class_id) === Number(selectedClassId));

  return (
    <div className="space-y-6">
      
      {/* Welcome Card */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-amber-400 text-xs font-bold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Faculty Classroom Desk</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Assalamu Alaikum, {user?.full_name || 'Usthad'}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl leading-relaxed">
          You are currently managing <span className="font-black text-amber-300">{selectedClass?.className || 'your assigned class'}</span>.
          All student lists, attendance registers, fee records, and marks will automatically filter to this class.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/staff/students"
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Class Students ({currentTotalStudents})</span>
          </Link>
          <Link
            href="/staff/attendance"
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance Register</span>
          </Link>
          <Link
            href="/staff/fees"
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>Monthly Fees</span>
          </Link>
          <Link
            href="/staff/marks"
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Marks Grader</span>
          </Link>
          <Link
            href="/staff/salary"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Banknote className="w-4 h-4 text-amber-400" />
            <span>My Salary</span>
          </Link>
        </div>
      </div>

      {/* Class Switcher Desk */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <span>Assigned Classrooms</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select a classroom to switch all active portal registers</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {assignedClasses.length} Assigned {assignedClasses.length === 1 ? 'Class' : 'Classes'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedClasses.map((ac) => {
            const isSelected = ac.classId === selectedClassId;
            const classSecs = sections.filter((s: any) => Number(s.class_id) === ac.classId);
            const totalCount = classSecs.reduce((acc: number, s: any) => acc + (Number(s.student_count) || 0), 0);

            return (
              <div 
                key={ac.classId} 
                className={'p-5 rounded-2xl border transition-all ' + (
                  isSelected 
                    ? 'bg-emerald-50/60 border-emerald-600 shadow-md ring-2 ring-emerald-600/30' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">{ac.className}</span>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedClassId(ac.classId)}
                          className="px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-extrabold transition-all"
                        >
                          Switch Here
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {classSecs.map((s: any) => `${s.name} (${s.student_count || 0})`).join(' • ') || 'Class Sections'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{totalCount}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Students</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-200 mt-3">
                  <Link
                    href="/staff/students"
                    onClick={() => setSelectedClassId(ac.classId)}
                    className="py-2 px-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs text-center shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Students</span>
                  </Link>
                  <Link
                    href="/staff/attendance"
                    onClick={() => setSelectedClassId(ac.classId)}
                    className="py-2 px-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs text-center shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </Link>
                  <Link
                    href="/staff/fees"
                    onClick={() => setSelectedClassId(ac.classId)}
                    className="py-2 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs text-center shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Fees</span>
                  </Link>
                  <Link
                    href="/staff/marks"
                    onClick={() => setSelectedClassId(ac.classId)}
                    className="py-2 px-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs text-center shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Marks</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum & Assigned Subjects for Active Class */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <span>Curriculum Subjects for {selectedClass?.className || 'Selected Class'}</span>
        </h2>

        {currentSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentSubjects.map((sub: any) => (
              <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-mono text-xs font-bold text-emerald-800">{sub.code}</div>
                <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>
                <div className="text-[11px] text-slate-500">Max: {sub.max_marks} • Pass: {sub.pass_marks}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No specific subjects configured for this class yet.</div>
        )}
      </div>

    </div>
  );
}
