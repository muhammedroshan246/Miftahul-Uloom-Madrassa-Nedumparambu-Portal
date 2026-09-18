'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  Edit, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Download,
  CreditCard,
  History,
  Lock,
  Archive,
  RotateCcw,
  Check,
  Building2,
  FileSpreadsheet,
  Award,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { CLASSES } from '@/lib/constants';
import ImageUploader from '@/components/ImageUploader';

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [counts, setCounts] = useState({ active: 0, archived: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Archived' | 'All'>('Active');
  
  // Modals
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [archiveModal, setArchiveModal] = useState<any>(null);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [studentPassModal, setStudentPassModal] = useState<any>(null);
  const [studentCustomPass, setStudentCustomPass] = useState('');
  const [passCredModal, setPassCredModal] = useState<any>(null);
  const [passLoading, setPassLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [editTab, setEditTab] = useState<'personal' | 'academic' | 'parent' | 'portal'>('personal');

  const fetchStudents = async () => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 4000);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedClass !== 'All') params.set('classId', selectedClass);
      if (selectedGender !== 'All') params.set('gender', selectedGender);
      params.set('status', selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.counts) setCounts(data.counts);
      } else {
        console.warn('Failed to load students, status:', res.status);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedGender, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

    const handleStudentPasswordUpdate = async (action: 'generate' | 'custom') => {
    if (!studentPassModal) return;
    if (action === 'custom' && (!studentCustomPass || studentCustomPass.trim().length < 4)) {
      alert('Password must be at least 4 characters');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/office/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student',
          targetId: studentPassModal.id,
          action,
          customPassword: studentCustomPass.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStudentPassModal(null);
        setStudentCustomPass('');
        setPassCredModal({
          name: data.credentials?.name || studentPassModal.full_name,
          admissionNo: studentPassModal.admission_no,
          username: data.credentials?.username || studentPassModal.username,
          password: data.credentials?.password
        });
        setActionMessage(`Password updated for ${studentPassModal.full_name}!`);
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleOpenView = async (studentId: number) => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setViewStudent(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveStudent = async (studentId: number) => {
    try {
      const res = await fetch(`/api/students/${studentId}?action=archive`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setArchiveModal(null);
        setActionMessage(data.message || 'Student archived successfully.');
        fetchStudents();
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to archive student');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreStudent = async (studentId: number, studentName: string) => {
    if (!confirm(`Restore ${studentName} back to Active students?`)) return;

    try {
      const res = await fetch(`/api/students/${studentId}?action=restore`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Student restored successfully.');
        fetchStudents();
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to restore student');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStudent)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.newPassword) {
          setGeneratedPass(data.newPassword);
        } else {
          setEditStudent(null);
        }
        setActionMessage('Student data and portal settings saved successfully!');
        fetchStudents();
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to update student data');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-800" />
            <span>Class-wise Student Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage students by Class (1 to +2) and Wing (Boys/Girls) with soft archiving, marks, and fee tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/office/students/verify"
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Audit & Verification (303 Enrolled)</span>
          </Link>
          <Link
            href="/office/admission"
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD STUDENT</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Active vs Archived Tabs + Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setSelectedStatus('Active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedStatus === 'Active' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Active Students</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('Archived')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedStatus === 'Archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              <span>Archived Students</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
                {counts.archived}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('All')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>All ({counts.total})</span>
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, admission no, phone, father..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
            />
          </form>

        </div>

        {/* Class Hierarchy Bar (1 to 10, +1, +2) & Gender Selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Class:</span>
            <button
              onClick={() => setSelectedClass('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClass === 'All' ? 'bg-emerald-900 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Classes
            </button>
            {CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(String(c.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedClass === String(c.id) ? 'bg-emerald-900 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Wing Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Wing:</span>
            <button
              onClick={() => setSelectedGender('All')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedGender === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Both Wings
            </button>
            <button
              onClick={() => setSelectedGender('Boys')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                selectedGender === 'Boys' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
              <span>Boys Wing</span>
            </button>
            <button
              onClick={() => setSelectedGender('Girls')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                selectedGender === 'Girls' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
              <span>Girls Wing</span>
            </button>
          </div>

        </div>

      </div>

      {/* Class-wise Student Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Roll</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4 text-center">Attendance</th>
                <th className="py-3.5 px-4 text-center">Result</th>
                <th className="py-3.5 px-4 text-center">Fee Status</th>
                <th className="py-3.5 px-4 text-center">Portal Account</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>No student records found matching this class and section filter.</div>
                    <Link
                      href="/office/admission"
                      className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow"
                    >
                      + Add Student to this Class
                    </Link>
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isArchived = s.status === 'Archived' || s.status === 'Inactive';
                  const isPaid = s.fee_status === 'Paid';
                  const attPct = Number(s.attendance_pct || 95);

                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {s.roll_no}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {s.photo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={s.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {s.full_name?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div>
                            <strong className="block text-slate-900 font-bold">{s.full_name}</strong>
                            <span className="text-[10px] text-slate-400">Father: {s.father_name || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{s.class_name}</span>
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.gender === 'Boys' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {s.gender}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        {s.admission_no}
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${
                          attPct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {attPct}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-900 font-extrabold text-[11px] border border-slate-200">
                          {s.latest_result || 'A'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          <span>{s.fee_status || 'Paid'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          !isArchived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {!isArchived ? 'Active' : 'Archived'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setStudentPassModal(s);
                              setStudentCustomPass('');
                            }}
                            title="Control & Reset Student Password"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenView(s.id)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditStudent({
                                id: s.id,
                                fullName: s.full_name,
                                dob: s.dob,
                                gender: s.gender,
                                classId: s.class_id,
                                rollNo: s.roll_no,
                                admissionNo: s.admission_no,
                                status: s.status,
                                fatherName: s.father_name || '',
                                motherName: s.mother_name || '',
                                guardianName: s.guardian_name || '',
                                primaryPhone: s.primary_phone || '',
                                altPhone: s.alt_phone || '',
                                address: s.address || '',
                                photoUrl: s.photo_url || '',
                                username: s.username || '',
                                studentAccountActive: !isArchived
                              });
                              setEditTab('personal');
                            }}
                            title="Edit Student Data"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isArchived ? (
                            <button
                              onClick={() => handleRestoreStudent(s.id, s.full_name)}
                              title="Restore Student"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchiveModal(s)}
                              title="Deactivate / Archive Student"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Archive Modal */}
      {archiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Archive Student?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to archive <strong>{archiveModal.full_name}</strong> ({archiveModal.admission_no}) from <strong>{archiveModal.class_name} {archiveModal.gender}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] text-left mt-2">
                ✓ <strong>Safe Archival:</strong> Previous marks, monthly fee records, attendance history, and certificates will remain preserved in audit logs.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setArchiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleArchiveStudent(archiveModal.id)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow"
              >
                Confirm & Archive Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Student Profile View Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                {viewStudent.student?.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={viewStudent.student.photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-700 shadow" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center">
                    {viewStudent.student?.full_name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{viewStudent.student?.full_name}</h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Admission No: {viewStudent.student?.admission_no} • Roll: {viewStudent.student?.roll_no}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                      {viewStudent.student?.class_name} ({viewStudent.student?.gender})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      Status: {viewStudent.student?.status}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={() => setViewStudent(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance & Fees Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Present Days</div>
                <div className="text-lg font-extrabold text-emerald-800">{viewStudent.attendanceStats?.present_days || 0} Days</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Absent Days</div>
                <div className="text-lg font-extrabold text-rose-700">{viewStudent.attendanceStats?.absent_days || 0} Days</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Fees Paid</div>
                <div className="text-lg font-extrabold text-emerald-800">₹{viewStudent.feeStats?.total_paid || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Pending Fees</div>
                <div className="text-lg font-extrabold text-amber-700">₹{viewStudent.feeStats?.total_pending || 0}</div>
              </div>
            </div>

            {/* Parent & Contact Details */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Parent & Guardian Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Father Name</span>
                  <strong className="text-slate-800">{viewStudent.student?.father_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mother / Guardian</span>
                  <strong className="text-slate-800">{viewStudent.student?.mother_name || viewStudent.student?.guardian_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <strong className="text-slate-800">{viewStudent.student?.primary_phone || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* Recent Examination Marks */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Academic Examination Results</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Exam</th>
                      <th className="py-2 px-3 text-right">Marks</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewStudent.marks || []).length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-400">No marks recorded.</td></tr>
                    ) : (
                      viewStudent.marks.map((m: any) => (
                        <tr key={m.id}>
                          <td className="py-2 px-3 font-semibold">{m.subject_name}</td>
                          <td className="py-2 px-3 text-slate-500">{m.exam_name}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{m.marks_obtained}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {m.grade}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Full Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Edit Student Record</h3>
                <p className="text-xs text-slate-500">{editStudent.fullName} • {editStudent.admissionNo}</p>
              </div>
              <button onClick={() => { setEditStudent(null); setGeneratedPass(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditTab('personal')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${editTab === 'personal' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}
              >
                1. Personal
              </button>
              <button
                type="button"
                onClick={() => setEditTab('academic')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${editTab === 'academic' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}
              >
                2. Academic
              </button>
              <button
                type="button"
                onClick={() => setEditTab('parent')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${editTab === 'parent' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}
              >
                3. Parent
              </button>
              <button
                type="button"
                onClick={() => setEditTab('portal')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${editTab === 'portal' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}
              >
                4. Portal Account
              </button>
            </div>

            {generatedPass && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Password Reset Successfully!</span>
                </div>
                <div>New Temporary Password: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">{generatedPass}</strong></div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Tab 1: Personal */}
              {editTab === 'personal' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editStudent.fullName}
                      onChange={(e) => setEditStudent({ ...editStudent, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={editStudent.dob || ''}
                        onChange={(e) => setEditStudent({ ...editStudent, dob: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Gender / Wing</label>
                      <select
                        value={editStudent.gender}
                        onChange={(e) => setEditStudent({ ...editStudent, gender: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        <option value="Boys">Boys Wing</option>
                        <option value="Girls">Girls Wing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student Photo</label>
                    <ImageUploader
                      category="student-photo"
                      currentImage={editStudent.photoUrl}
                      onImageUploaded={(url) => setEditStudent({ ...editStudent, photoUrl: url })}
                      label="Upload Passport Photo"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Academic */}
              {editTab === 'academic' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Class</label>
                      <select
                        value={editStudent.classId}
                        onChange={(e) => setEditStudent({ ...editStudent, classId: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        {CLASSES.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                      <input
                        type="number"
                        value={editStudent.rollNo}
                        onChange={(e) => setEditStudent({ ...editStudent, rollNo: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Admission Number</label>
                      <input
                        type="text"
                        value={editStudent.admissionNo}
                        onChange={(e) => setEditStudent({ ...editStudent, admissionNo: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={editStudent.status}
                        onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        <option value="Active">Active</option>
                        <option value="Archived">Archived</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Transferred">Transferred</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Parent */}
              {editTab === 'parent' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Father Name</label>
                      <input
                        type="text"
                        value={editStudent.fatherName}
                        onChange={(e) => setEditStudent({ ...editStudent, fatherName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mother Name</label>
                      <input
                        type="text"
                        value={editStudent.motherName}
                        onChange={(e) => setEditStudent({ ...editStudent, motherName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Primary Phone</label>
                      <input
                        type="tel"
                        value={editStudent.primaryPhone}
                        onChange={(e) => setEditStudent({ ...editStudent, primaryPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alt Phone</label>
                      <input
                        type="tel"
                        value={editStudent.altPhone}
                        onChange={(e) => setEditStudent({ ...editStudent, altPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={editStudent.address}
                      onChange={(e) => setEditStudent({ ...editStudent, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Portal */}
              {editTab === 'portal' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900">Student Portal Credentials</div>
                    <div className="text-slate-500">Username: <strong className="font-mono text-slate-800">{editStudent.username}</strong></div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditStudent({ ...editStudent, resetPassword: true })}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Generate New Password</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accActive"
                      checked={editStudent.studentAccountActive}
                      onChange={(e) => setEditStudent({ ...editStudent, studentAccountActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-700"
                    />
                    <label htmlFor="accActive" className="font-bold text-slate-700">Allow Portal Login Access</label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setEditStudent(null); setGeneratedPass(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md"
                >
                  Save Student Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {/* Student Direct Password Control Modal */}
      {studentPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Student Password Control</h3>
                  <p className="text-xs text-slate-500 font-mono">{studentPassModal.full_name} ({studentPassModal.admission_no})</p>
                </div>
              </div>
              <button onClick={() => setStudentPassModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Option 1: Auto-Generate 6-Digit Password</div>
                <p className="text-slate-600 text-[11px]">Generates a new secure 6-digit numeric password for student / parent portal access.</p>
                <button
                  type="button"
                  disabled={passLoading}
                  onClick={() => handleStudentPasswordUpdate('generate')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center justify-center gap-2 shadow"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate 6-Digit Password</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Option 2: Set Custom Password</div>
                <input
                  type="text"
                  placeholder="Type custom password (e.g. madrassa123)..."
                  value={studentCustomPass}
                  onChange={(e) => setStudentCustomPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
                <button
                  type="button"
                  disabled={passLoading || !studentCustomPass.trim()}
                  onClick={() => handleStudentPasswordUpdate('custom')}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50 transition-all"
                >
                  Set Custom Password
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentPassModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Credential Confirmation Modal */}
      {passCredModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Student Credentials Updated</h3>
              <p className="text-xs text-slate-500">Provide these credentials to the student or parent.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div>Student Name: <strong className="text-slate-900">{passCredModal.name}</strong></div>
              <div>Admission No: <strong className="font-mono text-slate-900">{passCredModal.admissionNo}</strong></div>
              <div>Username: <strong className="font-mono text-slate-900">{passCredModal.username}</strong></div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span>New Password:</span>
                <strong className="font-mono text-sm px-3 py-1 bg-amber-100 text-amber-950 rounded-lg border border-amber-300">
                  {passCredModal.password}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Mifthahul Uloom Student Login:\nName: ${passCredModal.name}\nAdmission No: ${passCredModal.admissionNo}\nUsername: ${passCredModal.username}\nPassword: ${passCredModal.password}\nLogin URL: http://localhost:3000/login?portal=student`);
                  alert('Credentials copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                Copy Credentials
              </button>
              <button
                type="button"
                onClick={() => setPassCredModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
