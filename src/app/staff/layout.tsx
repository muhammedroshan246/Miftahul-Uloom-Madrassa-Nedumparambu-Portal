'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  CalendarCheck, 
  FileSpreadsheet, 
  User, 
  LogOut, 
  School, 
  Home, 
  Sparkles,
  ChevronRight,
  GraduationCap,
  LogIn,
  Banknote,
  CreditCard,
  Building2,
  RefreshCw,
  Users
} from 'lucide-react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setAuthError(true);
      }
    }, 4000);

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          if (isMounted) {
            setAuthError(true);
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/login?portal=staff';
            }
          }
          return;
        }
        const data = await res.json();
        if (!['STAFF', 'SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR'].includes(data.user?.role)) {
          if (isMounted) {
            setAuthError(true);
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/login?portal=staff';
            }
          }
          return;
        }
        if (isMounted) {
          setUser(data.user);
          setTeacher(data.teacher || data.details?.teacher || null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Staff auth check error:', err);
        if (isMounted) {
          setAuthError(true);
          setLoading(false);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      window.location.href = '/login?portal=staff';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs uppercase font-bold text-emerald-300">Loading Usthad Portal...</div>
        </div>
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Usthad Authentication Required</h2>
            <p className="text-xs text-slate-400 mt-1">Please log in to your faculty account.</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/login?portal=staff"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Staff Login</span>
            </Link>
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col pb-20 md:pb-0">
      
      {/* Top Header */}
      <header className="bg-emerald-950 text-white px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Mifthahul Uloom</div>
            <div className="text-[10px] text-amber-400 font-semibold">Usthad & Faculty Portal</div>
          </div>
        </div>

        {/* Usthad Badge & Desktop Nav */}
        <div className="flex items-center gap-3">
          {/* Sadr Dual Portal Switcher */}
          {(user?.role === 'SADR' || user?.role === 'SUPER_ADMIN' || user?.username === 'sadr' || user?.username === 'jabir.baqavi') && (
            <Link
              href="/office"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Switch to Office ERP</span>
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-emerald-200">Faculty:</span>
            <span className="font-bold text-amber-300">{user?.full_name || 'Usthad'}</span>
            {teacher?.assigned_class_name && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-[10px] font-bold border border-emerald-700">
                {teacher.assigned_class_name} ({teacher.assigned_wing || 'Boys'})
              </span>
            )}
            {teacher?.assigned_class_name_2 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-800 text-amber-300 text-[10px] font-bold border border-blue-700">
                {teacher.assigned_class_name_2} ({teacher.assigned_wing_2 || 'Girls'})
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-emerald-900 hover:bg-rose-900 text-emerald-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Desktop Sub Navigation */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-2.5 items-center gap-5 text-xs font-semibold overflow-x-auto">
        <Link href="/staff" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <Home className="w-4 h-4 text-amber-600" />
          <span>Dashboard</span>
        </Link>
        <Link href="/staff/students" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/students' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <Users className="w-4 h-4 text-purple-700" />
          <span>My Class Students</span>
        </Link>
        <Link href="/staff/attendance" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/attendance' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <CalendarCheck className="w-4 h-4 text-emerald-700" />
          <span>1-Tap Attendance</span>
        </Link>
        <Link href="/staff/marks" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/marks' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <FileSpreadsheet className="w-4 h-4 text-blue-700" />
          <span>Marks Grader</span>
        </Link>
        <Link href="/staff/fees" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/fees' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <CreditCard className="w-4 h-4 text-amber-600" />
          <span>Class Fees (₹100)</span>
        </Link>
        <Link href="/staff/salary" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/salary' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <Banknote className="w-4 h-4 text-emerald-800" />
          <span>My Salary</span>
        </Link>
        <Link href="/staff/profile" className={`hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ${pathname === '/staff/profile' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600'}`}>
          <User className="w-4 h-4 text-slate-500" />
          <span>Profile</span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around z-50 shadow-2xl">
        <Link href="/staff" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link href="/staff/students" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff/students' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <Users className="w-4 h-4" />
          <span>Students</span>
        </Link>
        <Link href="/staff/attendance" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff/attendance' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance</span>
        </Link>
        <Link href="/staff/marks" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff/marks' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Marks</span>
        </Link>
        <Link href="/staff/fees" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff/fees' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <CreditCard className="w-4 h-4" />
          <span>Fees</span>
        </Link>
        <Link href="/staff/salary" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/staff/salary' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <Banknote className="w-4 h-4" />
          <span>Salary</span>
        </Link>
      </div>

    </div>
  );
}
