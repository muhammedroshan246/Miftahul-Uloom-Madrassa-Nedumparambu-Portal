'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  UserCheck, 
  BookOpen, 
  CalendarCheck, 
  CreditCard, 
  Award, 
  Bell, 
  LogOut, 
  Home, 
  GraduationCap, 
  LogIn,
  FileText 
} from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
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
              window.location.href = '/login?portal=student';
            }
          }
          return;
        }
        const data = await res.json();
        if (data.user?.role !== 'STUDENT' && !['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(data.user?.role)) {
          if (isMounted) {
            setAuthError(true);
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/login?portal=student';
            }
          }
          return;
        }
        if (isMounted) {
          setStudent(data.student || data.user);
          setLoading(false);
        }
      } catch (err) {
        console.error('Student auth check error:', err);
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
      window.location.href = '/login?portal=student';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm bg-emerald-900/80 p-8 rounded-3xl border border-emerald-800 shadow-2xl">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs uppercase font-bold text-amber-300">Loading Student Portal...</div>
        </div>
      </div>
    );
  }

  if (authError && !student) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Student Portal Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Please sign in with your student credentials.</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/login?portal=student"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Student Login</span>
            </Link>
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'Student Profile', href: '/student/details', icon: UserCheck },
    { name: 'Exam Results', href: '/student/results', icon: FileText },
    { name: 'Attendance Calendar', href: '/student/attendance', icon: CalendarCheck },
    { name: 'Fee Ledger (₹100/mo)', href: '/student/fees', icon: CreditCard },
    { name: 'Achievements', href: '/student/achievements', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col pb-20 md:pb-0">
      
      {/* Top Header */}
      <header className="bg-emerald-950 text-white px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Mifthahul Uloom</div>
            <div className="text-[10px] text-amber-400 font-semibold">Student Academy Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-emerald-200">Welcome,</span>
            <span className="font-bold text-amber-300">{student?.full_name || 'Student'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Switch Student</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-emerald-900 hover:bg-rose-900 text-emerald-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Desktop Sub Navigation */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-2.5 items-center gap-6 text-xs font-semibold overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:text-emerald-800 flex items-center gap-1.5 pb-0.5 whitespace-nowrap ${
                active ? 'text-emerald-900 font-bold border-b-2 border-emerald-800' : 'text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-emerald-800' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-50 shadow-2xl">
        <Link href="/student" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/student' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link href="/student/results" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/student/results' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <FileText className="w-5 h-5" />
          <span>Results</span>
        </Link>
        <Link href="/student/attendance" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/student/attendance' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <CalendarCheck className="w-5 h-5" />
          <span>Attendance</span>
        </Link>
        <Link href="/student/fees" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/student/fees' ? 'text-emerald-800' : 'text-slate-400'}`}>
          <CreditCard className="w-5 h-5" />
          <span>Fees</span>
        </Link>
      </div>

    </div>
  );
}
