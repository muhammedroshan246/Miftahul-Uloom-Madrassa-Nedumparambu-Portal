'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  UserPlus, 
  Phone, 
  Mail, 
  Award, 
  CheckCircle2, 
  X,
  History,
  Archive,
  RotateCcw,
  Edit,
  School,
  Building2,
  Banknote,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  BookOpen
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { CLASSES } from '@/lib/constants';

export default function TeachersDirectoryPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [classTeacherModal, setClassTeacherModal] = useState(false);
  const [salaryHistoryModal, setSalaryHistoryModal] = useState<any>(null);
  const [editTeacherModal, setEditTeacherModal] = useState<any>(null);
  const [credentialModal, setCredentialModal] = useState<any>(null);
  const [passControlModal, setPassControlModal] = useState<any>(null);
  const [customPassInput, setCustomPassInput] = useState('');
  const [passActionLoading, setPassActionLoading] = useState(false); // { title, name, teacherId, username, password }
  const [showPassInModal, setShowPassInModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add Teacher Form
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    gender: 'Male',
    phone: '',
    email: '',
    qualification: 'Fazil / Sanad Certified',
    designation: 'Usthad',
    assignedClasses: 'Class 1',
    showPhonePublicly: false,
    photoUrl: ''
  });

  // Class Teacher Assignment Form
  const [assignData, setAssignData] = useState({
    classId: '8',
    gender: 'Boys',
    teacherId: ''
  });

    const handleDirectPasswordUpdate = async (action: 'generate' | 'custom') => {
    if (!passControlModal) return;
    if (action === 'custom' && (!customPassInput || customPassInput.trim().length < 4)) {
      alert('Custom password must be at least 4 characters');
      return;
    }

    setPassActionLoading(true);
    try {
      const res = await fetch('/api/office/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teacher',
          targetId: passControlModal.id,
          action,
          customPassword: customPassInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPassControlModal(null);
        setCustomPassInput('');
        setCredentialModal({
          title: 'Password Updated Successfully',
          name: data.credentials?.name || passControlModal.name,
          teacherId: passControlModal.staffId || 'TCH',
          username: data.credentials?.username || passControlModal.username,
          password: data.credentials?.password
        });
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating password');
    } finally {
      setPassActionLoading(false);
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teachers', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        if (data.teachers?.length > 0 && !assignData.teacherId) {
          setAssignData(prev => ({ ...prev, teacherId: String(data.teachers[0].id) }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeachers(); }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        // Show secure credential confirmation card
        setCredentialModal({
          title: 'Teacher Created Successfully',
          name: data.teacher?.fullName || formData.fullName,
          teacherId: data.teacher?.staffId || 'TCH-NEW',
          username: data.teacher?.username || formData.username,
          password: data.teacher?.plainPassword,
          assignedClasses: data.teacher?.assignedClasses || formData.assignedClasses
        });
        setFormData({
          fullName: '',
          username: '',
          gender: 'Male',
          phone: '',
          email: '',
          qualification: 'Fazil / Sanad Certified',
          designation: 'Usthad',
          assignedClasses: 'Class 1',
          showPhonePublicly: false,
          photoUrl: ''
        });
        loadTeachers();
      } else {
        alert(data.error || 'Failed to create teacher');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (teacher: any) => {
    if (!confirm(`Reset login password for ${teacher.full_name}? The old password will immediately stop working.`)) return;

    try {
      const res = await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teacher.id,
          action: 'reset_password'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCredentialModal({
          title: 'Password Reset Successfully',
          name: teacher.full_name,
          teacherId: teacher.staff_id,
          username: teacher.username,
          password: data.newPassword,
          assignedClasses: teacher.assigned_classes
        });
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTeacherModal)
      });
      if (res.ok) {
        setEditTeacherModal(null);
        setMsg('Teacher record updated successfully!');
        loadTeachers();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const classesRes = await fetch('/api/classes');
      const cData = await classesRes.json();
      const sec = (cData.sections || []).find((s: any) => String(s.class_id) === String(assignData.classId) && s.name === assignData.gender);
      
      if (!sec) {
        alert('Section not found');
        return;
      }

      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_class_teacher',
          classTeacherAssignment: {
            sectionId: sec.id,
            teacherId: assignData.teacherId
          }
        })
      });

      if (res.ok) {
        setClassTeacherModal(false);
        setMsg('Class Teacher assigned successfully!');
        loadTeachers();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`Deactivate ${name}? Login access will be disabled, but historical records will remain preserved.`)) return;

    try {
      const res = await fetch(`/api/teachers?id=${id}&action=deactivate`, { method: 'DELETE' });
      if (res.ok) {
        setMsg(`Teacher ${name} deactivated.`);
        loadTeachers();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestore = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/teachers?id=${id}&action=restore`, { method: 'DELETE' });
      if (res.ok) {
        setMsg(`Teacher ${name} restored to active faculty.`);
        loadTeachers();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenSalaryHistory = async (teacherId: number) => {
    try {
      const res = await fetch(`/api/teachers?teacherId=${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        setSalaryHistoryModal(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-amber-600" />
            <span>Faculty & Usthad Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Usthads, secure 6-digit login credentials, assigned classes, and class teacher appointments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setClassTeacherModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 shadow-sm flex items-center gap-1.5"
          >
            <School className="w-4 h-4 text-emerald-800" />
            <span>Class Teacher Assignment</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD TEACHER</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading faculty records...</span>
          </div>
        ) : (
          teachers.map((t) => {
            const isActive = t.is_active === 1;

            return (
              <div key={t.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {t.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={t.photo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-800 text-white font-extrabold flex items-center justify-center text-base shadow">
                          {t.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <strong className="block text-sm font-extrabold text-slate-900">{t.full_name}</strong>
                        <span className="text-[11px] text-emerald-800 font-semibold">{t.designation}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Teacher ID / Login:</span>
                      <strong className="font-mono text-slate-900 font-bold">{t.staff_id} • @{t.username}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Assigned Classes:</span>
                      <strong className="text-emerald-800 font-bold">{t.assigned_classes || 'All Primary & Secondary'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Phone:</span>
                      <span className="font-mono text-slate-700">{t.phone || 'N/A'}</span>
                    </div>
                    {t.class_teacher_section && (
                      <div className="flex items-center justify-between text-emerald-800 font-bold pt-1 border-t border-slate-200">
                        <span>Class Teacher of:</span>
                        <span>{t.class_teacher_section}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleResetPassword(t)}
                      className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-amber-200 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>Reset 6-Digit Password</span>
                    </button>

                    <button
                      onClick={() => {
                        setPassControlModal({
                          id: t.id,
                          name: t.full_name,
                          username: t.username,
                          staffId: t.staff_id
                        });
                        setCustomPassInput('');
                      }}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors"
                      title="Password Control & 6-Digit Generator"
                    >
                      <KeyRound className="w-4 h-4 text-amber-700" />
                    </button>
                    <button
                      onClick={() => setEditTeacherModal({
                        id: t.id,
                        fullName: t.full_name,
                        gender: t.gender || 'Male',
                        phone: t.phone || '',
                        email: t.email || '',
                        qualification: t.qualification || '',
                        designation: t.designation || 'Usthad',
                        assignedClasses: t.assigned_classes || '',
                        showPhonePublicly: t.show_phone_publicly === 1,
                        photoUrl: t.photo_url || '',
                        isActive: t.is_active === 1
                      })}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Edit Teacher"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenSalaryHistory(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1.5"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Salary History</span>
                    </button>

                    <div>
                      {isActive ? (
                        <button
                          onClick={() => handleDeactivate(t.id, t.full_name)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-[11px]"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(t.id, t.full_name)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Teacher Credentials Confirmation Card Modal */}
      {credentialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">{credentialModal.title}</h3>
              <p className="text-xs text-slate-500">Provide these login credentials to the Usthad for Staff Portal access.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Teacher Name:</span>
                <strong className="text-slate-900">{credentialModal.name}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Teacher ID:</span>
                <strong className="font-mono text-slate-900">{credentialModal.teacherId}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Username:</span>
                <strong className="font-mono text-emerald-800 font-bold">{credentialModal.username}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Assigned Classes:</span>
                <strong className="text-slate-800">{credentialModal.assignedClasses}</strong>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-700 font-bold">6-Digit Temporary Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold px-3 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 tracking-wider">
                    {showPassInModal ? credentialModal.password : '••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassInModal(!showPassInModal)}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                    title={showPassInModal ? 'Hide password' : 'Show password'}
                  >
                    {showPassInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const creds = `Mifthahul Uloom Madrassa Faculty Credentials:\nName: ${credentialModal.name}\nTeacher ID: ${credentialModal.teacherId}\nUsername: ${credentialModal.username}\nPassword: ${credentialModal.password}\nLogin URL: http://localhost:3000/login`;
                  copyToClipboard(creds);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCredentialModal(null)}
                className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">+ Add Faculty Usthad</h3>
                <p className="text-xs text-slate-500">A secure 6-digit password will be generated automatically.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Naseeruddeen Saini"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username (Staff Login)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. naseeruddeen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Usthad / Sadr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Classes</label>
                <input
                  type="text"
                  value={formData.assignedClasses}
                  onChange={(e) => setFormData({ ...formData, assignedClasses: e.target.value })}
                  placeholder="e.g. Class 6, Class 9 or Class 3, +1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Note: Class 11 and 12 are mapped to +1 and +2</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9946464650"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. Baqavi / Saini / Faizy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>Automatic 6-Digit Password</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  A unique, non-obvious 6-digit numeric password will be generated upon creation and displayed on the next screen for you to copy.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPhonePub"
                  checked={formData.showPhonePublicly}
                  onChange={(e) => setFormData({ ...formData, showPhonePublicly: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-700"
                />
                <label htmlFor="showPhonePub" className="text-slate-700 font-semibold text-xs">
                  Display phone number publicly on the website
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Portrait</label>
                <ImageUploader
                  category="teachers"
                  currentImage={formData.photoUrl}
                  onImageUploaded={(url) => setFormData({ ...formData, photoUrl: url })}
                  label="Upload Profile Photo"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  Save & Generate 6-Digit Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Edit Faculty Teacher</h3>
                <p className="text-xs text-slate-500">{editTeacherModal.fullName}</p>
              </div>
              <button onClick={() => setEditTeacherModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editTeacherModal.fullName}
                  onChange={(e) => setEditTeacherModal({ ...editTeacherModal, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editTeacherModal.designation}
                    onChange={(e) => setEditTeacherModal({ ...editTeacherModal, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editTeacherModal.qualification}
                    onChange={(e) => setEditTeacherModal({ ...editTeacherModal, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Classes</label>
                <input
                  type="text"
                  value={editTeacherModal.assignedClasses}
                  onChange={(e) => setEditTeacherModal({ ...editTeacherModal, assignedClasses: e.target.value })}
                  placeholder="e.g. Class 6, Class 9"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editTeacherModal.phone}
                    onChange={(e) => setEditTeacherModal({ ...editTeacherModal, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editTeacherModal.isActive ? '1' : '0'}
                    onChange={(e) => setEditTeacherModal({ ...editTeacherModal, isActive: e.target.value === '1' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="1">Active</option>
                    <option value="0">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editShowPhonePub"
                  checked={editTeacherModal.showPhonePublicly}
                  onChange={(e) => setEditTeacherModal({ ...editTeacherModal, showPhonePublicly: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-700"
                />
                <label htmlFor="editShowPhonePub" className="text-slate-700 font-semibold text-xs">
                  Display phone number publicly on the website
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Portrait</label>
                <ImageUploader
                  category="teachers"
                  currentImage={editTeacherModal.photoUrl}
                  onImageUploaded={(url) => setEditTeacherModal({ ...editTeacherModal, photoUrl: url })}
                  label="Upload Profile Photo"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTeacherModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Teacher Assignment Modal */}
      {classTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Class Teacher Assignment</h3>
              <button onClick={() => setClassTeacherModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassTeacher} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={assignData.classId}
                    onChange={(e) => setAssignData({ ...assignData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wing</label>
                  <select
                    value={assignData.gender}
                    onChange={(e) => setAssignData({ ...assignData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Boys">Boys Wing</option>
                    <option value="Girls">Girls Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Faculty Class Teacher</label>
                <select
                  value={assignData.teacherId}
                  onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {teachers.filter(t => t.is_active === 1).map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.staff_id})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClassTeacherModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  SAVE ASSIGNMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary History Modal */}
      {salaryHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm">
                  {salaryHistoryModal.teacher?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{salaryHistoryModal.teacher?.full_name}</h3>
                  <p className="text-xs text-slate-500">{salaryHistoryModal.teacher?.staff_id} • Monthly Salary History</p>
                </div>
              </div>
              <button onClick={() => setSalaryHistoryModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3 text-right">Basic</th>
                    <th className="py-2.5 px-3 text-right">Allowance</th>
                    <th className="py-2.5 px-3 text-right">Deduction</th>
                    <th className="py-2.5 px-3 text-right font-bold">Net Salary</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(salaryHistoryModal.salaryHistory || []).length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">No salary records found.</td></tr>
                  ) : (
                    salaryHistoryModal.salaryHistory.map((h: any) => (
                      <tr key={h.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{h.month}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{Number(h.basic_salary || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+₹{Number(h.allowance || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">{h.deduction > 0 ? `-₹${Number(h.deduction).toLocaleString()}` : '₹0'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 bg-amber-50/40">₹{Number(h.net_salary || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSalaryHistoryModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    
      {/* Direct Password Control Modal */}
      {passControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Teacher Password Control</h3>
                  <p className="text-xs text-slate-500 font-mono">{passControlModal.name} ({passControlModal.username})</p>
                </div>
              </div>
              <button onClick={() => setPassControlModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Option 1: Auto-Generate 6-Digit Password</div>
                <p className="text-slate-600 text-[11px]">Generates a randomized, non-duplicate 6-digit numeric PIN suitable for Usthad login.</p>
                <button
                  type="button"
                  disabled={passActionLoading}
                  onClick={() => handleDirectPasswordUpdate('generate')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center justify-center gap-2 shadow transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate New 6-Digit PIN</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Option 2: Set Custom Password</div>
                <input
                  type="text"
                  placeholder="Enter custom password..."
                  value={customPassInput}
                  onChange={(e) => setCustomPassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
                <button
                  type="button"
                  disabled={passActionLoading || !customPassInput.trim()}
                  onClick={() => handleDirectPasswordUpdate('custom')}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50 transition-all"
                >
                  Set Custom Password
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPassControlModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
