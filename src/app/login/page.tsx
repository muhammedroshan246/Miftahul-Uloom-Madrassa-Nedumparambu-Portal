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
  ArrowRight
} from 'lucide-react';
import StudentSelectionFlow from '@/components/StudentSelectionFlow';

interface StaffOption {
  id: number;
  full_name: string;
  designation: string;
  qualification: string;
  phone: string;
  photo_url: string | null;
  assigned_classes: string;
  username: string;
}

interface SadrOption {
  teacher_id: number;
  full_name: string;
  designation: string;
  qualification: string;
  phone: string;
  photo_url: string;
  assigned_classes: string;
  username: string;
}

function LoginPortal() {
  const searchParams = useSearchParams();
  const initialPortal = searchParams.get('portal') || 'student';

  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'sadr' | 'office'>('student');
  
  // Options loaded from API
  const [sadrInfo, setSadrInfo] = useState<SadrOption | null>(null);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form states
  const [selectedStaffUsername, setSelectedStaffUsername] = useState('');
  const [officeUsername, setOfficeUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sadr Post-Login Dual Portal Selector State
  const [sadrModalOpen, setSadrModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    if (initialPortal === 'office') setActiveTab('office');
    else if (initialPortal === 'sadr') setActiveTab('sadr');
    else if (initialPortal === 'staff') setActiveTab('staff');
    else setActiveTab('student');
  }, [initialPortal]);

  // Fetch public staff and Sadr options dynamically from database
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/public/login-options');
        if (res.ok) {
          const data = await res.json();
          if (data.sadr) setSadrInfo(data.sadr);
          if (Array.isArray(data.staff)) {
            setStaffList(data.staff);
            if (data.staff.length > 0) {
              setSelectedStaffUsername(data.staff[0].username);
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
    if (activeTab === 'sadr') {
      usernameToSubmit = sadrInfo?.username || 'sadr';
    } else if (activeTab === 'staff') {
      usernameToSubmit = selectedStaffUsername;
      if (!usernameToSubmit) {
        setError('Please select a faculty member');
        return;
      }
    } else if (activeTab === 'office') {
      usernameToSubmit = officeUsername.trim();
      if (!usernameToSubmit) {
        setError('Please enter your office username');
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

      // Sadr Login Success -> Show Dual Portal Selection Screen
      if (activeTab === 'sadr' || data.isSadr || data.user.role === 'SADR') {
        setSadrModalOpen(true);
        setLoading(false);
        return;
      }

      // Office Admin Success
      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'OFFICE_ADMIN') {
        window.location.href = '/office';
        return;
      }

      // Staff Success
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

  const selectedStaffObj = staffList.find(s => s.username === selectedStaffUsername);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Sadr Dual Portal Selector Modal */}
      {sadrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
              <Crown className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 rounded-full text-[11px] font-bold tracking-wider uppercase border border-amber-400/20">
                Sadr Usthad Access
              </div>
              <h2 className="text-xl font-black text-white">
                Welcome, {sadrInfo?.full_name || 'V. K. Jabir Baqavi'}
              </h2>
              <p className="text-xs text-slate-300">
                You have unrestricted administrative & faculty access. Choose which portal to open:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/office'; }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-900/90 to-emerald-950 border border-emerald-500/30 hover:border-amber-400 text-left transition-all hover:scale-105 shadow-xl flex flex-col justify-between"
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
                className="group p-5 rounded-2xl bg-gradient-to-br from-teal-900/90 to-teal-950 border border-teal-500/30 hover:border-amber-400 text-left transition-all hover:scale-105 shadow-xl flex flex-col justify-between"
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

      {/* Portal Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold text-slate-300 shadow-2xl">
        
        {/* Student Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab('student'); setError(''); setPassword(''); }}
          className={"py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 " + (
            activeTab === 'student' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white hover:bg-slate-800/50'
          )}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/20 font-bold sm:inline-block">No Password</span>
        </button>

        {/* Staff Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab('staff'); setError(''); setPassword(''); }}
          className={"py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 " + (
            activeTab === 'staff' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white hover:bg-slate-800/50'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Staff / Usthad</span>
        </button>

        {/* Sadr Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab('sadr'); setError(''); setPassword(''); }}
          className={"py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 " + (
            activeTab === 'sadr' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white hover:bg-slate-800/50'
          )}
        >
          <Crown className="w-4 h-4" />
          <span>Sadr Usthad</span>
        </button>

        {/* Office Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab('office'); setError(''); setPassword(''); }}
          className={"py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 " + (
            activeTab === 'office' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white hover:bg-slate-800/50'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Office Desk</span>
        </button>
      </div>

      {/* STUDENT PORTAL: 3-STEP NO PASSWORD SELECTION FLOW */}
      {activeTab === 'student' ? (
        <StudentSelectionFlow />
      ) : (
        /* AUTHENTICATION FORM CARD */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 max-w-md mx-auto">
          
          {/* Card Title & Subtitle */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeTab === 'staff' && <BookOpen className="w-3.5 h-3.5 text-emerald-700" />}
              {activeTab === 'sadr' && <Crown className="w-3.5 h-3.5 text-amber-600" />}
              {activeTab === 'office' && <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />}
              <span>
                {activeTab === 'staff' && 'Faculty Portal'}
                {activeTab === 'sadr' && 'Sadr Special Portal'}
                {activeTab === 'office' && 'Administration ERP'}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'staff' && 'Usthad & Faculty Login'}
              {activeTab === 'sadr' && 'Sadr Usthad Authentication'}
              {activeTab === 'office' && 'Madrassa Office Administration'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'staff' && 'Select your name from the faculty list and enter your 6-digit numeric PIN.'}
              {activeTab === 'sadr' && 'Authenticate as Sadr for full administrative and faculty dual access.'}
              {activeTab === 'office' && 'Enter authorized Madrassa Office Administrator credentials.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            
            {/* 1. STAFF PORTAL: DYNAMIC USTHAD SELECTION DROPDOWN */}
            {activeTab === 'staff' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Usthad / Faculty Member
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
                      {staffList.map((t) => (
                        <option key={t.id} value={t.username}>
                          {t.full_name} ({t.assigned_classes || 'Faculty'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Usthad Information Badge */}
                {selectedStaffObj && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-950 text-xs">{selectedStaffObj.full_name}</div>
                      <div className="text-[11px] text-emerald-700">Assigned: {selectedStaffObj.assigned_classes}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      Usthad
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. SADR PORTAL: SADR PROFILE DISPLAY */}
            {activeTab === 'sadr' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/50 flex items-center gap-3.5">
                {sadrInfo?.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={sadrInfo.photo_url}
                    alt={sadrInfo.full_name}
                    className="w-14 h-14 rounded-2xl object-cover bg-amber-100 border-2 border-amber-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md">
                    VB
                  </div>
                )}
                <div>
                  <div className="font-black text-slate-900 text-sm">{sadrInfo?.full_name || 'V. K. Jabir Baqavi'}</div>
                  <div className="text-[11px] text-amber-700 font-bold">{sadrInfo?.designation || 'Sadr / Principal Usthad'}</div>
                  <div className="text-[10px] text-slate-500">{sadrInfo?.qualification || 'Senior Islamic Scholar'}</div>
                </div>
              </div>
            )}

            {/* 3. OFFICE ADMIN: USERNAME INPUT */}
            {activeTab === 'office' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Office Username
                </label>
                <input
                  type="text"
                  required
                  value={officeUsername}
                  onChange={(e) => setOfficeUsername(e.target.value)}
                  placeholder="e.g. office or admin"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8]"
                />
              </div>
            )}

            {/* PASSWORD / PIN INPUT FIELD */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {activeTab === 'staff' && '6-Digit Numeric PIN / Password'}
                {activeTab === 'sadr' && 'Sadr Secret Password'}
                {activeTab === 'office' && 'Administrator Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  activeTab === 'staff' 
                    ? 'Enter 6-digit PIN (e.g. 482731)' 
                    : (activeTab === 'sadr' ? 'Enter Sadr Password' : 'Enter administrator password...')
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
                {activeTab === 'staff' && 'Sign In to Faculty Portal'}
                {activeTab === 'sadr' && 'Sign In as Sadr Usthad'}
                {activeTab === 'office' && 'Sign In to Office ERP'}
              </span>
            </button>
          </form>

          {/* Help & Support Footer */}
          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <div>Need password assistance or account activation?</div>
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
        <Suspense fallback={<div className="text-center text-white text-xs">Loading Portal Login...</div>}>
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
