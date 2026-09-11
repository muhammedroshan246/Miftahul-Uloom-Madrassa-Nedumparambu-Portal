'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  School, 
  GraduationCap, 
  CalendarCheck, 
  FileSpreadsheet, 
  CreditCard, 
  Award, 
  BookOpen, 
  Bell, 
  Calendar, 
  Image as ImageIcon, 
  Images,
  Globe, 
  ArrowUpRight, 
  FileText, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  Banknote,
  Building2,
  LogIn,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
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
              window.location.href = '/login?portal=office';
            }
          }
          return;
        }
        const data = await res.json();
        if (!['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(data.user?.role)) {
          if (isMounted) {
            setAuthError(true);
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/login?portal=office';
            }
          }
          return;
        }
        if (isMounted) {
          setUser(data.user);
          setLoading(false);
        }
      } catch (err) {
        console.error('Office auth check error:', err);
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
      window.location.href = '/login?portal=office';
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/office', icon: LayoutDashboard },
    { name: 'Madrassa Info', href: '/office/madrassa-info', icon: Building2, highlight: true },
    { name: 'New Admission', href: '/office/admission', icon: UserPlus, highlight: true },
    { name: 'Students Directory', href: '/office/students', icon: Users },
    { name: 'Classes & Sections', href: '/office/classes', icon: School },
    { name: 'Faculty & Teachers', href: '/office/teachers', icon: GraduationCap },
    { name: 'Staff Permissions', href: '/office/permissions', icon: ShieldCheck, highlight: true },
    { name: 'Daily Attendance', href: '/office/attendance', icon: CalendarCheck },
    { name: 'Subjects & Total Marks', href: '/office/subjects', icon: BookOpen, highlight: true },
    { name: 'Marks & Results', href: '/office/marks', icon: FileSpreadsheet },
    { name: 'Salary & Payroll', href: '/office/payroll', icon: Banknote, highlight: true },
    { name: 'Monthly Fees (₹100)', href: '/office/fees', icon: CreditCard },
    { name: 'Achievements', href: '/office/achievements', icon: Award },
    { name: 'Announcements', href: '/office/announcements', icon: Bell },
    { name: 'Events Calendar', href: '/office/events', icon: Calendar },
    { name: 'Media & Images', href: '/office/media', icon: Images, highlight: true },
    { name: 'Campus Gallery', href: '/office/gallery', icon: ImageIcon },
    { name: 'Website Content CMS', href: '/office/website-content', icon: Globe },
    { name: 'Class Promotions', href: '/office/promotions', icon: ArrowUpRight },
    { name: 'Correction Requests', href: '/office/corrections', icon: CheckCircle2 },
    { name: 'Reports & Exports', href: '/office/reports', icon: FileSpreadsheet },
    { name: 'Audit Logs', href: '/office/audit-logs', icon: History },
    { name: 'Settings & Security', href: '/office/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Office Administration ERP</div>
            <div className="text-[11px] text-slate-400 mt-1">Verifying secure session...</div>
          </div>
        </div>
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Office Authentication Required</h2>
            <p className="text-xs text-slate-400 mt-1">
              Please sign in with your authorized Office Admin credentials to access this portal.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/login?portal=office"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Office Login</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-emerald-950 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm">
            MU
          </div>
          <div>
            <div className="font-bold text-xs">Mifthahul Uloom</div>
            <div className="text-[10px] text-amber-400">Office ERP Desk</div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg bg-emerald-900 text-white">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ERP Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#062c22] text-emerald-100 flex flex-col justify-between shadow-2xl transition-transform duration-200 md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Institution Brand */}
          <div className="p-5 border-b border-emerald-900/80 bg-emerald-950/60">
            <Link href="/office" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/branding/madrassa_logo.png"
                alt="LOGO OF MDRASSA"
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-amber-400 shadow-md shrink-0"
              />
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-white truncate">Mifthahul Uloom</div>
                <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                  <span>Office ERP</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Action Admission CTA */}
          <div className="px-3 pt-3">
            <Link
              href="/office/admission"
              onClick={() => setSidebarOpen(false)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ New Admission</span>
            </Link>
          </div>

          {/* 19 ERP Modules Navigation */}
          <nav className="p-3 space-y-0.5 flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider">
              Management Modules
            </div>
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                      : 'text-emerald-100/90 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-amber-400/80'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-emerald-900 bg-emerald-950/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-xs">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-white truncate">{user?.full_name || 'Admin'}</div>
                <div className="text-[10px] text-amber-400">{user?.role || 'OFFICE'}</div>
              </div>
            </div>
            <Link href="/office/settings" title="Passkey & Security" className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800">
              <Fingerprint className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-1.5 px-3 rounded-lg bg-emerald-900 hover:bg-rose-900/80 text-emerald-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Desktop Bar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between shadow-sm sticky top-0 z-30">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
              Mifthahul Uloom Madrassa Administration ERP
            </h2>
            <div className="text-xs text-slate-500">
              Academic Year 2026-2027 • Dual Section (Boys & Girls)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </Link>
            <Link href="/office/admission" className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Admission</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
