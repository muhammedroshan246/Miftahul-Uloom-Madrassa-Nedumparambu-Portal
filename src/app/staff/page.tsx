'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  CreditCard,
  Banknote
} from 'lucide-react';

export default function StaffDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [assignedSections, setAssignedSections] = useState<any[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaffData() {
      try {
        const [meRes, cRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/classes')
        ]);
        if (meRes.ok) {
          const mData = await meRes.json();
          setUser(mData.user);
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          setAssignedSections(cData.sections?.slice(0, 6) || []);
          setAssignedSubjects(cData.subjects?.slice(0, 4) || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStaffData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Welcome Card */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-amber-400 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Faculty Classroom Desk</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Assalamu Alaikum, {user?.full_name || 'Usthad'}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl leading-relaxed">
          Record quick daily attendance, input terminal marks with automated grade computing, and view your class roster.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/staff/attendance"
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance</span>
          </Link>
          <Link
            href="/staff/marks"
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Marks Entry</span>
          </Link>
          <Link
            href="/staff/fees"
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>Class Fees (₹100)</span>
          </Link>
          <Link
            href="/staff/salary"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Banknote className="w-4 h-4 text-amber-400" />
            <span>My Salary (View Only)</span>
          </Link>
        </div>
      </div>

      {/* Fast 1-Tap Attendance Shortcuts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-800" />
            <span>Your Assigned Class Sections</span>
          </h2>
          <span className="text-xs text-slate-400">Class 1 to +2 Dual Wings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedSections.map((sec) => (
            <div key={sec.id} className="p-4 rounded-2xl bg-[#fbfbf8] border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  sec.name === 'Boys' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {sec.class_name} ({sec.name})
                </span>
                <span className="text-[11px] font-bold text-slate-500">{sec.student_count || 12} Students</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <Link
                  href={`/staff/attendance?sectionId=${sec.id}`}
                  className="w-full py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs text-center shadow-sm"
                >
                  1-Tap Mark Attendance →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum & Assigned Subjects */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <span>Curriculum Subject Specializations</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assignedSubjects.map((sub) => (
            <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-mono text-xs font-bold text-emerald-800">{sub.code}</div>
              <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>
              <div className="text-[11px] text-slate-500">Max: {sub.max_marks} • Pass: {sub.pass_marks}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}