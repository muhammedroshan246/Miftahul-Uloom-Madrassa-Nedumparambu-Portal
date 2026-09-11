'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Building2, 
  Edit, 
  CheckCircle2, 
  X, 
  Save,
  HeartHandshake
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function StudentDetailsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [editForm, setEditForm] = useState({
    dob: '',
    photoUrl: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    primaryPhone: '',
    altPhone: '',
    address: '',
    emergencyContact: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/profile');
      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile);
        const s = json.profile || {};
        setEditForm({
          dob: s.dob || '',
          photoUrl: s.photo_url || '',
          fatherName: s.father_name || '',
          motherName: s.mother_name || '',
          guardianName: s.guardian_name || '',
          primaryPhone: s.primary_phone || '',
          altPhone: s.alt_phone || '',
          address: s.address || '',
          emergencyContact: s.emergency_contact || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('Student and family details updated successfully!');
        setIsEditing(false);
        loadData();
        setTimeout(() => setMessage(''), 4000);
      } else {
        alert(json.error || 'Failed to update details');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  const student = profile || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-800" />
            <span>Student & Family Profile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official academic census, parental records, and residential details.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile & Family Details</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 text-xs">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100">
          {student.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-700 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-900 text-amber-300 font-extrabold flex items-center justify-center text-2xl shadow-md">
              {student.full_name?.charAt(0) || 'S'}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">{student.full_name}</h2>
            <div className="font-mono text-xs font-bold text-emerald-800">
              Admission No: {student.admission_no} • Roll #{student.roll_no}
            </div>
            <div className="text-slate-500 text-[11px]">
              {student.class_name} • {student.gender} Wing • Status: <strong className="text-emerald-700">{student.status || 'Active'}</strong>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
              <strong className="text-emerald-900 font-bold block">Edit Student & Parent Details</strong>
              <p className="text-slate-600">Update date of birth, parent names, contact numbers, residential address, and profile photo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Father's Full Name</label>
                <input
                  type="text"
                  value={editForm.fatherName}
                  onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                  placeholder="Father's name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mother's Full Name</label>
                <input
                  type="text"
                  value={editForm.motherName}
                  onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                  placeholder="Mother's name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guardian Name (if applicable)</label>
                <input
                  type="text"
                  value={editForm.guardianName}
                  onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                  placeholder="Guardian name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Parent Phone *</label>
                <input
                  type="tel"
                  value={editForm.primaryPhone}
                  onChange={(e) => setEditForm({ ...editForm, primaryPhone: e.target.value })}
                  placeholder="e.g. 9847112233"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternate / WhatsApp Phone</label>
                <input
                  type="tel"
                  value={editForm.altPhone}
                  onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                  placeholder="e.g. 9847114455"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="House name, street, locality, pincode..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Student Photo</label>
              <ImageUploader
                category="student-photo"
                currentImage={editForm.photoUrl}
                onImageUploaded={(url) => setEditForm({ ...editForm, photoUrl: url })}
                label="Upload Student Photo"
              />
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
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="block text-slate-900 font-bold border-b border-slate-200 pb-1 text-sm">
                Personal Information
              </strong>
              <div><span className="text-slate-400">Date of Birth:</span> <strong className="text-slate-800 ml-2">{student.dob || 'Not recorded'}</strong></div>
              <div><span className="text-slate-400">Gender / Wing:</span> <strong className="text-slate-800 ml-2">{student.gender} Wing</strong></div>
              <div><span className="text-slate-400">Admission Date:</span> <strong className="text-slate-800 ml-2">{student.admission_date || '2026-06-01'}</strong></div>
              <div><span className="text-slate-400">Enrollment Status:</span> <strong className="text-emerald-800 ml-2">{student.status || 'Active'}</strong></div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="block text-slate-900 font-bold border-b border-slate-200 pb-1 text-sm flex items-center justify-between">
                <span>Parent & Family Details</span>
                <HeartHandshake className="w-4 h-4 text-amber-600" />
              </strong>
              <div><span className="text-slate-400">Father's Name:</span> <strong className="text-slate-800 ml-2">{student.father_name || 'N/A'}</strong></div>
              <div><span className="text-slate-400">Mother's Name:</span> <strong className="text-slate-800 ml-2">{student.mother_name || 'N/A'}</strong></div>
              <div><span className="text-slate-400">Primary Mobile:</span> <strong className="text-slate-800 ml-2 font-mono">{student.primary_phone || 'N/A'}</strong></div>
              <div><span className="text-slate-400">Alternate Phone:</span> <strong className="text-slate-800 ml-2 font-mono">{student.alt_phone || 'N/A'}</strong></div>
              <div><span className="text-slate-400">Residential Address:</span> <strong className="text-slate-800 ml-2">{student.address || 'Nedumparambu, Vengara'}</strong></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
