'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  CalendarCheck, 
  FileSpreadsheet, 
  User, 
  LogOut, 
  Home, 
  GraduationCap,
  LogIn,
  Banknote,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import { StaffClassProvider, useStaffClass } from './StaffClassContext';

function StaffLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { assignedClasses, selectedClassId, setSelectedClassId, loading, user } = useStaffClass();

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

  if (!user) {
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

  const isNavActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col pb-20 md:pb-0">
      
      {/* Top Main Header */}
      <header className="bg-emerald-950 text-white px-4 sm:px-8 py-3 shadow-md flex items-center justify-between sticky top-0 z-40 border-b border-emerald-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Mifthahul Uloom</div>
            <div className="text-[10px] text-amber-400 font-semibold">Usthad & Faculty Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === 'SADR' || user?.role === 'SUPER_ADMIN' || user?.username === 'sadr' || user?.username === 'jabir.baqavi') && (
            <Link
              href="/office"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Switch to Office ERP</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-emerald-900 hover:bg-rose-900 text-emerald-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* PROMINENT TOP CONTROL AREA: Welcome + MY CLASS Selector */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white px-4 sm:px-8 py-3.5 shadow-md border-b border-emerald-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-300">Staff Portal</div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Welcome, <span className="text-amber-300">{user?.full_name || 'Usthad'}</span>
            </div>
          </div>
        </div>

        {/* MY CLASS SELECTOR */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-amber-400/50 shadow-lg">
          <label htmlFor="staff-top-class-selector" className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
            <span>MY CLASS:</span>
          </label>

          {assignedClasses.length > 1 ? (
            <div className="relative">
              <select
                id="staff-top-class-selector"
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="appearance-none bg-emerald-950 text-amber-300 font-extrabold text-sm px-4 py-2 pr-9 rounded-xl border border-amber-400/60 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer hover:border-amber-300 transition-all"
              >
                {assignedClasses.map((c) => (
                  <option key={c.classId} value={c.classId} className="bg-slate-900 text-white font-bold py-1">
                    {c.className}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-amber-400 font-bold text-xs">
                ▼
              </div>
            </div>
          ) : assignedClasses.length === 1 ? (
            <div className="px-4 py-1.5 rounded-xl bg-emerald-950 text-amber-300 font-black text-sm border border-amber-400/50 shadow-sm">
              {assignedClasses[0].className}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No class assigned</div>
          )}
        </div>
      </div>

      {/* Desktop Sub Navigation */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-8 py-2.5 items-center gap-5 text-xs font-semibold overflow-x-auto">
        <Link href="/staff" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <Home className="w-4 h-4 text-amber-600" />
          <span>Dashboard</span>
        </Link>
        <Link href="/staff/students" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/students') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <Users className="w-4 h-4 text-purple-700" />
          <span>Students</span>
        </Link>
        <Link href="/staff/attendance" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/attendance') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <CalendarCheck className="w-4 h-4 text-emerald-700" />
          <span>Attendance</span>
        </Link>
        <Link href="/staff/marks" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/marks') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <FileSpreadsheet className="w-4 h-4 text-blue-700" />
          <span>Marks</span>
        </Link>
        <Link href="/staff/fees" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/fees') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <CreditCard className="w-4 h-4 text-amber-600" />
          <span>Fees</span>
        </Link>
        <Link href="/staff/salary" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/salary') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
          <Banknote className="w-4 h-4 text-emerald-800" />
          <span>My Salary</span>
        </Link>
        <Link href="/staff/profile" className={'hover:text-emerald-800 flex items-center gap-1.5 shrink-0 ' + (isNavActive('/staff/profile') ? 'text-emerald-900 font-bold border-b-2 border-emerald-800 pb-1' : 'text-slate-600')}>
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
        <Link href="/staff" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff') ? 'text-emerald-800' : 'text-slate-400')}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link href="/staff/students" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff/students') ? 'text-emerald-800' : 'text-slate-400')}>
          <Users className="w-4 h-4" />
          <span>Students</span>
        </Link>
        <Link href="/staff/attendance" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff/attendance') ? 'text-emerald-800' : 'text-slate-400')}>
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance</span>
        </Link>
        <Link href="/staff/marks" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff/marks') ? 'text-emerald-800' : 'text-slate-400')}>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Marks</span>
        </Link>
        <Link href="/staff/fees" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff/fees') ? 'text-emerald-800' : 'text-slate-400')}>
          <CreditCard className="w-4 h-4" />
          <span>Fees</span>
        </Link>
        <Link href="/staff/salary" className={'flex flex-col items-center gap-0.5 text-[10px] font-bold ' + (isNavActive('/staff/salary') ? 'text-emerald-800' : 'text-slate-400')}>
          <Banknote className="w-4 h-4" />
          <span>Salary</span>
        </Link>
      </div>

    </div>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffClassProvider>
      <StaffLayoutContent>{children}</StaffLayoutContent>
    </StaffClassProvider>
  );
}
