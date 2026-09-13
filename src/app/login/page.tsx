'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Crown,
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Building2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import StudentSelectionFlow from '@/components/StudentSelectionFlow';

interface OfficeMemberOption {
  id: number;
  username: string;
  label: string;
  full_name: string;
  role: string;
  designation: string;
  photo_url: string | null;
  is_sadr: boolean;
}

interface StaffMemberOption {
  id: number;
  username: string;
  label: string;
  full_name: string;
  designation: string;
  qualification: string;
  phone: string;
  photo_url: string | null;
  assigned_classes: string;
  is_sadr: boolean;
}

function LoginPortal() {
  const searchParams = useSearchParams();
  const initialPortal = searchParams.get('portal') || 'office';

  // Top level 3-way selector: 'office' | 'staff' | 'student'
  const [activeTab, setActiveTab] = useState<'office' | 'staff' | 'student'>('office');
  
  // Options dynamically loaded from database
  const [officeMembers, setOfficeMembers] = useState<OfficeMemberOption[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Selected dropdown values
  const [selectedOfficeUsername, setSelectedOfficeUsername] = useState('admin');
  const [selectedStaffUsername, setSelectedStaffUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sadr Post-Login Dual Portal Selector State
  const [sadrModalOpen, setSadrModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    if (initialPortal === 'student') setActiveTab('student');
    else if (initialPortal === 'staff') setActiveTab('staff');
    else setActiveTab('office');
  }, [initialPortal]);

  // Fetch dynamic office and staff members from database
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/public/login-options');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.officeMembers)) {
            setOfficeMembers(data.officeMembers);
            if (data.officeMembers.length > 0) {
              setSelectedOfficeUsername(data.officeMembers[0].username);
            }
          }
          if (Array.isArray(data.staffMembers)) {
            setStaffMembers(data.staffMembers);
            if (data.staffMembers.length > 0) {
              setSelectedStaffUsername(data.staffMembers[0].username);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load login options:', e);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let usernameToSubmit = '';
    if (activeTab === 'office') {
      usernameToSubmit = selectedOfficeUsername;
      if (!usernameToSubmit) {
        setError('Please select an Office member');
        return;
      }
    } else if (activeTab === 'staff') {
      usernameToSubmit = selectedStaffUsername;
      if (!usernameToSubmit) {
        setError('Please select a Staff member');
        return;
      }
    }

    if (!password) {
      setError('Please enter your password / PIN');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameToSubmit,
          password,
          portal: activeTab
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setLoggedInUser(data.user);

      // Sadr Login Success (through either Office or Staff) -> Show Dual Portal Screen
      if (data.isSadr || data.user?.role === 'SADR' || usernameToSubmit === 'sadr') {
        setSadrModalOpen(true);
        setLoading(false);
        return;
      }

      // Office Admin Success -> Direct to /office
      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'OFFICE_ADMIN') {
        window.location.href = '/office';
        return;
      }

      // Staff Success -> Direct to /staff
      if (data.user.role === 'STAFF') {
        window.location.href = '/staff';
        return;
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const selectedOfficeObj = officeMembers.find(o => o.username === selectedOfficeUsername);
  const selectedStaffObj = staffMembers.find(s => s.username === selectedStaffUsername);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Sadr Dual Portal Selector Modal (Opens on Sadr Login from Office OR Staff) */}
      {sadrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
              <Crown className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 rounded-full text-[11px] font-bold tracking-wider uppercase border border-amber-400/20">
                Sadr Usthad Access
              </div>
              <h2 className="text-xl font-black text-white">
                Welcome, V. K. Jabir Baqavi
              </h2>
              <p className="text-xs text-slate-300">
                You have unrestricted administrative & faculty access. Choose which portal to open:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/office'; }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-900/90 to-emerald-950 border border-emerald-500/30 hover:border-amber-400 text-left transition-all hover:scale-105 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-md group-hover:rotate-6 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>Office ERP</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-emerald-200/80 mt-1">
                    Administration, Census, Faculty, Fees & Records
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/staff'; }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-teal-900/90 to-teal-950 border border-teal-500/30 hover:border-amber-400 text-left transition-all hover:scale-105 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-md group-hover:rotate-6 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>Staff Portal</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-teal-200/80 mt-1">
                    Academic tools, Attendance, Marks & Faculty Hub
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Note: You can freely switch between both portals anytime from the header menu.
            </div>
          </div>
        </div>
      )}

      {/* LOGIN AS ▼ (3-Way Portal Selector) */}
      <div className="space-y-2">
        <div className="text-center">
          <span className="text-[11px] font-extrabold text-amber-400 tracking-wider uppercase">
            Login As ▼
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold text-slate-300 shadow-2xl">
          
          {/* 1. Office Option */}
          <button
            type="button"
            onClick={() => { setActiveTab('office'); setError(''); setPassword(''); }}
            className={"py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer " + (
              activeTab === 'office' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'hover:text-white hover:bg-slate-800/50'
            )}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Office</span>
          </button>

          {/* 2. Staff Option */}
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setError(''); setPassword(''); }}
            className={"py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer " + (
              activeTab === 'staff' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'hover:text-white hover:bg-slate-800/50'
            )}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Staff</span>
          </button>

          {/* 3. Student Portal Option */}
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(''); setPassword(''); }}
            className={"py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer " + (
              activeTab === 'student' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'hover:text-white hover:bg-slate-800/50'
            )}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>Student Portal</span>
          </button>

        </div>
      </div>

      {/* STUDENT PORTAL: 3-STEP NO PASSWORD SELECTION FLOW */}
      {activeTab === 'student' ? (
        <StudentSelectionFlow />
      ) : (
        /* OFFICE & STAFF LOGIN CARD */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 max-w-md mx-auto">
          
          {/* Card Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeTab === 'office' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Madrassa Office Administration</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Usthad & Faculty Portal</span>
                </>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'office' ? 'Office Portal Login' : 'Staff Portal Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'office'
                ? 'Select an authorized Office member and enter your password.'
                : 'Select your name from the staff list and enter your 6-digit PIN / password.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            
            {/* 1. OFFICE MEMBER DROPDOWN */}
            {activeTab === 'office' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Office Member ▼
                  </label>
                  {loadingOptions ? (
                    <div className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Loading authorized office members...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedOfficeUsername}
                      onChange={(e) => { setSelectedOfficeUsername(e.target.value); setError(''); }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8] text-slate-900 cursor-pointer"
                    >
                      {officeMembers.map((m) => (
                        <option key={m.id} value={m.username}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Office Member Info Badge */}
                {selectedOfficeObj && (
                  <div className={"p-3 rounded-2xl border flex items-center justify-between " + (
                    selectedOfficeObj.is_sadr 
                      ? 'bg-amber-50 border-amber-200 text-amber-950' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-950'
                  )}>
                    <div className="flex items-center gap-2.5">
                      {selectedOfficeObj.is_sadr ? (
                        <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs">{selectedOfficeObj.full_name}</div>
                        <div className="text-[11px] opacity-80">{selectedOfficeObj.designation}</div>
                      </div>
                    </div>
                    <span className={"text-[10px] font-extrabold px-2 py-0.5 rounded-full " + (
                      selectedOfficeObj.is_sadr 
                        ? 'bg-amber-200 text-amber-900' 
                        : 'bg-emerald-200 text-emerald-900'
                    )}>
                      {selectedOfficeObj.role}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. STAFF MEMBER DROPDOWN (INCLUDING SADR) */}
            {activeTab === 'staff' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Staff Member ▼
                  </label>
                  {loadingOptions ? (
                    <div className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Loading faculty list from database...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedStaffUsername}
                      onChange={(e) => { setSelectedStaffUsername(e.target.value); setError(''); }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8] text-slate-900 cursor-pointer"
                    >
                      {staffMembers.map((t) => (
                        <option key={t.id} value={t.username}>
                          {t.label + (t.assigned_classes ? ' (' + t.assigned_classes + ')' : '')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Staff Member Info Badge */}
                {selectedStaffObj && (
                  <div className={"p-3 rounded-2xl border flex items-center justify-between " + (
                    selectedStaffObj.is_sadr 
                      ? 'bg-amber-50 border-amber-200 text-amber-950' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-950'
                  )}>
                    <div className="flex items-center gap-2.5">
                      {selectedStaffObj.is_sadr ? (
                        <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-emerald-700 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs">{selectedStaffObj.full_name}</div>
                        <div className="text-[11px] opacity-80">
                          {selectedStaffObj.is_sadr 
                            ? 'Sadr Usthad — Dual Access' 
                            : 'Assigned: ' + selectedStaffObj.assigned_classes}
                        </div>
                      </div>
                    </div>
                    <span className={"text-[10px] font-extrabold px-2 py-0.5 rounded-full " + (
                      selectedStaffObj.is_sadr 
                        ? 'bg-amber-200 text-amber-900' 
                        : 'bg-emerald-200 text-emerald-900'
                    )}>
                      {selectedStaffObj.is_sadr ? 'SADR' : 'USTHAD'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* PASSWORD / PIN INPUT FIELD */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {activeTab === 'staff' 
                  ? (selectedStaffObj?.is_sadr ? 'Sadr Password' : '6-Digit Numeric PIN / Password')
                  : 'Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  activeTab === 'staff'
                    ? (selectedStaffObj?.is_sadr ? 'Enter Sadr Password' : 'Enter 6-digit PIN (e.g. 482731)')
                    : 'Enter password...'
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8]"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {activeTab === 'office' ? 'Login to Office Desk' : 'Sign In to Faculty Portal'}
              </span>
            </button>
          </form>

          {/* Help & Support Footer */}
          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <div>Need password assistance or account support?</div>
            <div className="text-slate-800 font-bold">
              Contact Madrassa Office Desk (Tel: +91 9544182665)
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#062c22] via-[#093a2e] to-[#041a14] flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Navigation */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Madrassa Website</span>
        </Link>
        <span className="text-[11px] font-bold text-amber-400 font-mono">MU Madrassa No: 5090</span>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <Suspense fallback={<div className="text-center text-white text-xs">Loading Login System...</div>}>
          <LoginPortal />
        </Suspense>
      </div>

      {/* Institution Footer */}
      <div className="text-center text-[11px] text-emerald-300/60 pb-4">
        Mifthahul Uloom Higher Secondary Madrassa • Nedumparambu, Vengara
      </div>

    </div>
  );
}
