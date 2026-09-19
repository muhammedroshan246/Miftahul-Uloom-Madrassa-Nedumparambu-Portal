'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Phone, 
  Home, 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  Printer, 
  Copy, 
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { CLASSES } from '@/lib/constants';
import ImageUploader from '@/components/ImageUploader';

export default function NewAdmissionPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '2012-05-15',
    gender: 'Boys', // 'Boys' | 'Girls'
    className: 'Class 8',
    customAdmissionNo: '',
    customRollNo: '',
    photoUrl: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    primaryPhone: '',
    altPhone: '',
    address: '',
    emergencyContact: ''
  });

  const autoSection = `${formData.className} ${formData.gender}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      setError('Please enter student full name');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryPhone) {
      setError('Please enter parent primary phone number');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleCompleteAdmission = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admission/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admission workflow failed');

      setResult(data.student);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `MIFTHAHUL ULOOM HIGHER SECONDARY MADRASSA\nStudent Admission Confirmation\n\nStudent Name: ${result.fullName}\nAdmission No: ${result.admissionNo}\nClass: ${result.className} (${result.gender})\nRoll No: ${result.rollNo}\nUsername: ${result.username}\nTemporary Password: ${result.temporaryPassword}\nParent Contact: ${result.parentPhone}\n\nLogin Portal: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-amber-500" />
            <span>New Student Admission Wizard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete student enrollment with automatic sectioning, credentials generation, and fee schedule setup.
          </p>
        </div>
        <Link href="/office/students" className="text-xs font-semibold text-emerald-800 hover:underline">
          ← Back to Students Directory
        </Link>
      </div>

      {/* Stepper Header (Only when not finished) */}
      {!result && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-emerald-800' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>1</span>
            <span>Student Information</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-emerald-800' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>2</span>
            <span>Parent / Guardian</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-emerald-800' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>3</span>
            <span>Review & Complete</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS CONFIRMATION RECEIPT */}
      {result ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl p-6 sm:p-10 space-y-6 text-slate-900">
          
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Admission Successfully Completed!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Student profile activated. 12 Monthly fee records generated and login account initialized.
            </p>
          </div>

          {/* Printable Admission Credential Slip */}
          <div className="p-6 rounded-2xl bg-emerald-50/60 border-2 border-dashed border-emerald-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
              <div>
                <div className="text-xs font-bold text-emerald-900">MIFTHAHUL ULOOM HIGHER SECONDARY MADRASSA</div>
                <div className="text-[10px] text-emerald-700">Official Student Admission Slip & Portal Credentials</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-800 text-amber-300 text-xs font-bold">
                {result.admissionNo}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Full Name</span>
                <strong className="text-slate-900 text-sm">{result.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Class & Wing</span>
                <strong className="text-slate-900 text-sm">{result.section}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Roll Number</span>
                <strong className="text-slate-900 text-sm">#{result.rollNo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Parent Mobile</span>
                <strong className="text-slate-900 text-sm">{result.parentPhone}</strong>
              </div>
            </div>

            {/* Generated Login Box */}
            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Student Portal Login Credentials</span>
                </div>
                <button
                  onClick={copyCredentials}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Student Username</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{result.username}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Temporary Password</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{result.temporaryPassword}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Student and parents can immediately sign in at <strong className="text-slate-800">/login</strong> using these credentials or their phone number.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Admission Slip</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/office/students"
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                View Students List
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setStep(1);
                  setFormData({
                    fullName: '',
                    dob: '2012-05-15',
                    gender: 'Boys',
                    className: 'Class 8',
                    customAdmissionNo: '',
                    customRollNo: '',
                    photoUrl: '',
                    fatherName: '',
                    motherName: '',
                    guardianName: '',
                    primaryPhone: '',
                    altPhone: '',
                    address: '',
                    emergencyContact: ''
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Admit Another Student</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* MULTI-STEP WIZARD FORM */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          
          {/* STEP 1: Student Information */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 1 — Student Personal & Academic Details</h2>
                <p className="text-xs text-slate-500">Enter basic information. Section is allocated automatically based on gender.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Muhammad Farhan K"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender * (Determines Section)
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none bg-white font-semibold"
                  >
                    <option value="Boys">Boys (Allocates to Boys Wing)</option>
                    <option value="Girls">Girls (Allocates to Girls Wing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class (1–10, +1, +2) *
                  </label>
                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none bg-white font-semibold"
                  >
                    {CLASSES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Section (Auto-Matched)
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{autoSection}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admission Number (Optional Custom)
                  </label>
                  <input
                    type="text"
                    name="customAdmissionNo"
                    value={formData.customAdmissionNo}
                    onChange={handleChange}
                    placeholder="Leave blank for auto-generated (MU2026-XXXX)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Roll Number (Optional Custom)
                  </label>
                  <input
                    type="number"
                    name="customRollNo"
                    value={formData.customRollNo}
                    onChange={handleChange}
                    placeholder="Leave blank to auto-assign next roll"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <ImageUploader
                    category="students"
                    label="Student Passport / Profile Photo"
                    helperText="Private student photo • Drag & drop or click • Max 5MB (JPG, PNG, WebP)"
                    value={formData.photoUrl}
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                    aspectRatio="portrait"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <span>Continue to Parent Information</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Parent Information */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 2 — Parent & Guardian Contact Information</h2>
                <p className="text-xs text-slate-500">Primary phone will be linked for the Parent Portal account.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="e.g. Abdul Lateef"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="e.g. Amina Lateef"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Phone Number * (Parent Login)
                  </label>
                  <input
                    type="tel"
                    name="primaryPhone"
                    value={formData.primaryPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9847111001"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alternate Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9447000111"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Residential Address
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House name, Street, Location, Pin code..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <span>Review Admission Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Review & Automated Activation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 3 — Review & Complete Admission</h2>
                <p className="text-xs text-slate-500">Confirm all details before activating the student account.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#fbfbf8] border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                  <strong className="text-slate-900 text-sm">{formData.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Allocated Wing</span>
                  <strong className="text-emerald-800 text-sm">{autoSection}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                  <span className="text-slate-800">{formData.dob}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                  <span className="text-slate-800">{formData.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Father's Name</span>
                  <span className="text-slate-800">{formData.fatherName || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Phone</span>
                  <span className="text-slate-800 font-semibold">{formData.primaryPhone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span>
                  <span className="text-slate-800">{formData.address || 'Kozhikode, Kerala'}</span>
                </div>
              </div>

              {/* Automated Actions Checklist */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>On clicking "Complete Admission", the system will automatically:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 text-[11px] pl-1">
                  <li>Create Student Database Record & assign to {autoSection}</li>
                  <li>Generate unique Student Username (MU2026-XXXX) & Secure Password</li>
                  <li>Create/link Parent Portal login for {formData.primaryPhone}</li>
                  <li>Initialize 12 monthly fee records (April to March @ ₹100/mo)</li>
                  <li>Log action to Audit Trail & output printable Admission Slip</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 2</span>
                </button>

                <button
                  onClick={handleCompleteAdmission}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
                >
                  {loading ? (
                    <span>Processing Admission...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Admission</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}