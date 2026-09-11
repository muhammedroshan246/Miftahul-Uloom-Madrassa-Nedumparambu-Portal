'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Sparkles
} from 'lucide-react';
import StudentSelectionFlow from '@/components/StudentSelectionFlow';

function LoginPortal() {
  const searchParams = useSearchParams();
  const initialPortal = searchParams.get('portal') || 'student';

  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'office'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPortal === 'office') setActiveTab('office');
    else if (initialPortal === 'staff') setActiveTab('staff');
    else setActiveTab('student');
  }, [initialPortal]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username / ID and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          portal: activeTab
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'OFFICE_ADMIN') {
        window.location.href = '/office';
      } else if (data.user.role === 'STAFF') {
        window.location.href = '/staff';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Portal Tab Switcher */}
      <div className="flex p-1.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold text-slate-300 shadow-xl">
        <button
          type="button"
          onClick={() => { setActiveTab('student'); setError(''); }}
          className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'student' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student / Parent</span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 bg-slate-950/20 rounded text-[10px]">No Password</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('staff'); setError(''); }}
          className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'staff' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Staff / Usthad</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('office'); setError(''); }}
          className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'office' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Office Admin</span>
        </button>
      </div>

      {/* STUDENT PORTAL: 3-STEP NO PASSWORD SELECTION FLOW */}
      {activeTab === 'student' ? (
        <StudentSelectionFlow />
      ) : (
        /* STAFF & OFFICE SECURE PASSWORD LOGIN CARDS */
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/80 space-y-6 max-w-md mx-auto">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'staff' && 'Usthad & Faculty Portal Login'}
              {activeTab === 'office' && 'Madrassa Office Administration'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'staff' && 'Enter your faculty username and 6-digit numeric password.'}
              {activeTab === 'office' && 'Enter authorized Sadr / Office Administrator credentials.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {activeTab === 'staff' ? 'Username / Staff ID' : 'Office Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeTab === 'staff' ? 'e.g. naseeruddeen or TCH-002' : 'e.g. sadr or admin'}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {activeTab === 'staff' ? '6-Digit Numeric Password' : 'Administrator Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'staff' ? 'Enter 6-digit password (e.g. 482731)' : 'Enter password...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-[#fbfbf8]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>Sign In to {activeTab === 'staff' ? 'Faculty Portal' : 'Office ERP'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <div>Need password assistance?</div>
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
      
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Madrassa Website</span>
        </Link>
        <span className="text-[11px] font-bold text-amber-400 font-mono">MU Madrassa No: 5090</span>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <Suspense fallback={<div className="text-center text-white text-xs">Loading Student Portal Login...</div>}>
          <LoginPortal />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-emerald-300/60 pb-4">
        Mifthahul Uloom Higher Secondary Madrassa • Nedumparambu, Vengara
      </div>

    </div>
  );
}
