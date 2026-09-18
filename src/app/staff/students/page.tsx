'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Phone, 
  CalendarCheck, 
  FileSpreadsheet, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export default function StaffStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<{ className: string; wing: string } | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const [stRes, cRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes')
      ]);

      if (stRes.ok) {
        const data = await stRes.json();
        setStudents(data.students || []);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.assignedClass && cData.assignedSection) {
          setClassInfo({
            className: cData.assignedClass.name,
            wing: cData.assignedSection.wing || cData.assignedSection.name
          });
        } else if (cData.sections && cData.sections.length > 0) {
          setClassInfo({
            className: cData.sections[0].class_name,
            wing: cData.sections[0].name
          });
        }
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.admission_no?.toLowerCase().includes(q) ||
      String(s.roll_no) === q ||
      s.primary_phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Class Teacher Registry
            </span>
            {classInfo && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                {classInfo.className} — {classInfo.wing}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-800" />
            <span>My Class Students Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled student records strictly locked to your authorized class section.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/staff/attendance"
            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance</span>
          </Link>
          <Link
            href="/staff/marks"
            className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Marks</span>
          </Link>
          <Link
            href="/staff/fees"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Fees</span>
          </Link>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll no, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200">
            Total Enrolled: <strong className="text-emerald-900">{students.length}</strong>
          </span>
          {search && (
            <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              Matching: <strong>{filteredStudents.length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <th className="py-3.5 px-4 w-16 text-center">Roll #</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-3">Admission No</th>
                <th className="py-3.5 px-3">Class & Section</th>
                <th className="py-3.5 px-3">Parent / Guardian</th>
                <th className="py-3.5 px-3">Contact Phone</th>
                <th className="py-3.5 px-3 text-center">Attendance</th>
                <th className="py-3.5 px-3 text-center">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div>Loading classroom student roster...</div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <div className="font-bold text-slate-700">No students found</div>
                    <div className="text-xs">No active students matching your search in this classroom.</div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-black text-slate-800">
                      {String(st.roll_no).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 text-xs">{st.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">DOB: {st.dob || '-'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {st.admission_no}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.gender === 'Boys' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {st.class_name} ({st.section_name})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {st.father_name || st.guardian_name || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {st.primary_phone ? (
                        <a href={`tel:${st.primary_phone}`} className="hover:text-emerald-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{st.primary_phone}</span>
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {st.attendance_pct || 95}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.fee_status === 'Paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.fee_status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
