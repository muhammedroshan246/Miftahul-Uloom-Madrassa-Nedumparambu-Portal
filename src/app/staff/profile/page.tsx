'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  GraduationCap, 
  Phone, 
  Mail, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Edit, 
  CheckCircle2, 
  X, 
  Save, 
  Building2,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function StaffProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
    qualification: '',
    designation: '',
    photoUrl: '',
    showPhonePublicly: false
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/profile');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const t = json.teacher || {};
        setEditForm({
          phone: t.phone || '',
          email: t.email || '',
          qualification: t.qualification || '',
          designation: t.designation || 'Usthad',
          photoUrl: t.photo_url || '',
          showPhonePublicly: !!t.show_phone_publicly
        });
      }
    } catch (err) {
      console.error('Error loading staff profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/staff/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('Your Usthad profile details have been updated successfully!');
        setIsEditing(false);
        loadProfile();
        setTimeout(() => setMessage(''), 4000);
      } else {
        alert(json.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <span>Loading Usthad profile...</span>
      </div>
    );
  }

  const teacher = data?.teacher || {};
  const assignments = data?.assignments || [];
  const classTeacherSections = data?.classTeacherSections || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-800" />
            <span>Usthad Faculty Profile</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage your personal qualifications, contact information, and teaching portfolio.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit My Details</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          {teacher.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={teacher.photo_url}
              alt={teacher.full_name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-700 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-emerald-900 text-amber-300 font-black text-3xl flex items-center justify-center shadow-md">
              {teacher.full_name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Faculty Member</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{teacher.full_name}</h2>
            <div className="font-mono text-xs font-bold text-slate-500">
              Staff ID: <strong className="text-emerald-900">{teacher.staff_id}</strong> • Username: <strong className="text-slate-800">{teacher.username}</strong>
            </div>
            <div className="text-xs text-amber-700 font-bold">
              {teacher.designation || 'Usthad'} • {teacher.qualification || 'Certified Islamic Scholar'}
            </div>
          </div>
        </div>

        {/* Edit Form or Read-Only View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
              <strong className="text-amber-900 font-bold block">Edit Profile Information</strong>
              <p className="text-slate-600">Update your phone number, email, qualification credentials, and portrait photo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 9847112233"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="e.g. usthad@mifthahululoom.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Educational Qualification</label>
                <input
                  type="text"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  placeholder="e.g. Baqavi / Fazil / Sanad Certified"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  placeholder="e.g. Senior Usthad / Sadr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Profile Photo</label>
              <ImageUploader
                category="teachers"
                currentImage={editForm.photoUrl}
                onImageUploaded={(url) => setEditForm({ ...editForm, photoUrl: url })}
                label="Upload Passport Portrait Photo"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showPhone"
                checked={editForm.showPhonePublicly}
                onChange={(e) => setEditForm({ ...editForm, showPhonePublicly: e.target.checked })}
                className="w-4 h-4 text-emerald-800 rounded"
              />
              <label htmlFor="showPhone" className="text-slate-700 font-semibold cursor-pointer">
                Display contact phone publicly on the Madrassa website Faculty directory
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="block text-slate-900 font-bold border-b border-slate-200 pb-1 text-sm">
                Official Contact & Identity
              </strong>
              <div><span className="text-slate-400">Staff ID:</span> <strong className="text-slate-900 ml-2 font-mono">{teacher.staff_id}</strong></div>
              <div><span className="text-slate-400">Username:</span> <strong className="text-slate-900 ml-2 font-mono">{teacher.username}</strong></div>
              <div><span className="text-slate-400">Phone Number:</span> <strong className="text-slate-900 ml-2 font-mono">{teacher.phone || 'Not recorded'}</strong></div>
              <div><span className="text-slate-400">Email:</span> <strong className="text-slate-900 ml-2">{teacher.email || 'Not recorded'}</strong></div>
              <div><span className="text-slate-400">Public Visibility:</span> <strong className="text-emerald-800 ml-2">{teacher.show_phone_publicly ? 'Listed on Website' : 'Private (Office Only)'}</strong></div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="block text-slate-900 font-bold border-b border-slate-200 pb-1 text-sm">
                Academic & Teaching Role
              </strong>
              <div><span className="text-slate-400">Designation:</span> <strong className="text-slate-900 ml-2">{teacher.designation || 'Usthad'}</strong></div>
              <div><span className="text-slate-400">Sanad / Qualification:</span> <strong className="text-slate-900 ml-2">{teacher.qualification || 'Certified Islamic Scholar'}</strong></div>
              <div><span className="text-slate-400">Assigned Classes:</span> <strong className="text-emerald-800 ml-2">{teacher.assigned_classes || 'Class 1 to +2'}</strong></div>
              <div><span className="text-slate-400">Class Teacher Of:</span> <strong className="text-slate-900 ml-2">{classTeacherSections.length > 0 ? classTeacherSections.map((c: any) => `${c.class_name} (${c.section_name})`).join(', ') : 'Subject Teacher'}</strong></div>
            </div>
          </div>
        )}

      </div>

      {/* Teaching Portfolio & Subjects Assigned */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-800" />
          <span>Curriculum Subject Assignments ({assignments.length})</span>
        </h3>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400">No specific subject assignments allocated yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignments.map((a: any) => (
              <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{a.subject_name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{a.class_name} • {a.section_name} Wing</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
