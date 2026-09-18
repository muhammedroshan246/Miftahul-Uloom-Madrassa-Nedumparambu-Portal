'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Users, 
  Search, 
  Phone, 
  CalendarCheck, 
  FileSpreadsheet, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  School,
  RefreshCw
} from 'lucide-react';

function StaffStudentsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSecId = searchParams.get('sectionId') || '';

  const [students, setStudents] = useState<any[]>([]);
  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSecId);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load staff assignments from /api/classes
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/classes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = data.assignedClassList || [];
          setAssignedList(list);

          if (list.length > 0) {
            // Check if initialSecId is in assigned list
            const matched = list.find((item: any) => String(item.sectionId) === String(initialSecId));
            const matchedClass = list.find((item: any) => String(item.classId) === String(initialClassId));
            if (matched) {
              setSelectedSectionId(String(matched.sectionId));
            } else if (matchedClass) {
              setSelectedSectionId(String(matchedClass.sectionId));
            } else if (!selectedSectionId) {
              setSelectedSectionId(String(list[0].sectionId));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load classes for staff:', e);
      }
    }
    loadMeta();
  }, [initialClassId, initialSecId]);

  // Load students when selectedSectionId changes
  useEffect(() => {
    if (!selectedSectionId) return;

    async function loadStudents() {
      setLoading(true);
      try {
        const res = await fetch(`/api/students?sectionId=${selectedSectionId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (e) {
        console.error('Failed to load students:', e);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [selectedSectionId]);

  const currentAssignment = assignedList.find(a => String(a.sectionId) === String(selectedSectionId)) || assignedList[0];

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
      
      {/* Header & Class Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Class Teacher Registry
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              Up to 2 Classes Assigned
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-800" />
            <span>My Class Students Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled student records strictly locked to your authorized class section.
          </p>
        </div>

        {/* Assigned Classes Switcher */}
        {assignedList.length > 0 && (
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase px-2">Assigned Class:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignedList.map((item: any) => {
                const isSelected = String(item.sectionId) === String(selectedSectionId);
                return (
                  <button
                    key={item.sectionId}
                    type="button"
                    onClick={() => setSelectedSectionId(String(item.sectionId))}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>{item.className} — {item.wing}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Shortcuts for Selected Class */}
      {currentAssignment && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950 text-white p-4 rounded-2xl shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-300">Active Classroom:</span>
            <strong className="text-amber-300 font-extrabold text-sm">
              {currentAssignment.className} ({currentAssignment.wing} Wing)
            </strong>
            <span className="text-emerald-400">({students.length} students enrolled)</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <Link
              href={`/staff/attendance?classId=${currentAssignment.classId}&sectionId=${currentAssignment.sectionId}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Mark Attendance</span>
            </Link>
            <Link
              href={`/staff/fees?classId=${currentAssignment.classId}&wing=${currentAssignment.wing}`}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Fees</span>
            </Link>
            <Link
              href={`/staff/marks?classId=${currentAssignment.classId}&sectionId=${currentAssignment.sectionId}`}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Marks</span>
            </Link>
          </div>
        </div>
      )}

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
            Enrolled in Roster: <strong className="text-emerald-900">{students.length}</strong>
          </span>
          {search && (
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
              Matching Search: <strong>{filteredStudents.length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
            <span className="text-xs font-bold">Loading enrolled student roster...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No student records found</h3>
            <p className="text-xs text-slate-400">
              {search ? 'Try clearing your search query.' : 'No active students enrolled in this assigned classroom.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-16">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Parent / Guardian</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Fee Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-black text-slate-900">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-xs font-mono">
                        {s.roll_no || idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {s.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <strong className="block text-slate-900 text-xs font-extrabold">{s.full_name}</strong>
                          <span className="text-[10px] text-slate-400">{s.gender} Wing</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-bold text-[11px]">
                      {s.admission_no}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-semibold">{s.father_name || s.guardian_name || 'N/A'}</div>
                      {s.address && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.address}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {s.primary_phone ? (
                        <a 
                          href={`tel:${s.primary_phone}`} 
                          className="inline-flex items-center gap-1 font-mono text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{s.primary_phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.attendance_pct || 95}% Present
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        s.fee_status === 'Paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {s.fee_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/staff/attendance?classId=${s.class_id}&sectionId=${s.section_id}`}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                          title="Attendance"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/staff/fees?classId=${s.class_id}&wing=${s.gender === 'Girl' ? 'Girls' : 'Boys'}`}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors"
                          title="Fees"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
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

export default function StaffStudentsPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400 text-xs font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
        Loading Students Roster...
      </div>
    }>
      <StaffStudentsContent />
    </Suspense>
  );
}
