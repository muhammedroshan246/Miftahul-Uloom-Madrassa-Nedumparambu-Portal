'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Phone, 
  GraduationCap, 
  CalendarCheck, 
  CreditCard, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useStaffClass } from '../StaffClassContext';

export default function StaffStudentsPage() {
  const { selectedClassId, selectedClass, assignedClasses, setSelectedClassId } = useStaffClass();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState<'All' | 'Boys' | 'Girls'>('All');

  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchStudents() {
      try {
        let url = `/api/students?classId=${selectedClassId}&limit=100`;
        if (wingFilter !== 'All') {
          url += `&gender=${wingFilter}`;
        }
        if (search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load students');
        }

        const data = await res.json();
        if (isMounted) {
          setStudents(data.students || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error fetching student roster');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(fetchStudents, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedClassId, wingFilter, search]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                Official Roster
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedClass?.className || 'Selected Class'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-800" />
              <span>{selectedClass?.className || 'Class'} Student Register</span>
            </h1>
            <p className="text-xs text-slate-500">
              Viewing only students enrolled in your assigned classroom.
            </p>
          </div>

          {/* Quick Classroom Switcher if multiple */}
          {assignedClasses.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
              {assignedClasses.map((c) => (
                <button
                  key={c.classId}
                  onClick={() => setSelectedClassId(c.classId)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-black transition-all ' + (
                    c.classId === selectedClassId
                      ? 'bg-emerald-900 text-amber-300 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {c.className}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">Wing:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
              {(['All', 'Boys', 'Girls'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWingFilter(w)}
                  className={'px-3 py-1 rounded-lg transition-all ' + (
                    wingFilter === w
                      ? 'bg-white text-emerald-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Enrolled Students ({students.length})
          </div>
          <div className="text-xs text-slate-400">
            Class {selectedClass?.className} • {wingFilter} Wing
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading classroom roster...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students found for this class and filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Wing</th>
                  <th className="py-3 px-4">Guardian & Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.roll_no || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{st.full_name}</div>
                      <div className="text-[10px] text-slate-400">{st.class_name} • {st.section_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{st.admission_no}</td>
                    <td className="py-3 px-4">
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                        st.gender === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      )}>
                        {st.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{st.father_name || st.mother_name || '—'}</div>
                      {st.primary_phone ? (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{st.primary_phone}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {st.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/staff/attendance?classId=${selectedClassId}&studentId=${st.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                          title="Attendance"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/staff/fees?classId=${selectedClassId}&studentId=${st.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors"
                          title="Fees"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/staff/marks?classId=${selectedClassId}&studentId=${st.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-800 transition-colors"
                          title="Marks"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
