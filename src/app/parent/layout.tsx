'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, Users, GraduationCap, HeartHandshake, LogIn } from 'lucide-react';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [parent, setParent] = useState<any>(null);
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
              window.location.href = '/login?portal=parent';
            }
          }
          return;
        }
        const data = await res.json();
        if (data.user?.role !== 'PARENT' && !['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(data.user?.role)) {
          if (isMounted) {
            setAuthError(true);
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/login?portal=parent';
            }
          }
          return;
        }
        if (isMounted) {
          setParent(data.parent || data.user);
          setLoading(false);
        }
      } catch (err) {
        console.error('Parent auth check error:', err);
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
      window.location.href = '/login?portal=parent';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm bg-emerald-900/80 p-8 rounded-3xl border border-emerald-800 shadow-2xl">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs uppercase font-bold text-amber-300">Loading Parent Portal...</div>
        </div>
      </div>
    );
  }

  if (authError && !parent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Parent Portal Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Please log in to your parent account.</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/login?portal=parent"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Parent Login</span>
            </Link>
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col">
      {/* Top Header */}
      <header className="bg-emerald-950 text-white px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center shadow-md">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Mifthahul Uloom</div>
            <div className="text-[10px] text-amber-400 font-semibold">Parent & Guardian Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-emerald-200">Parent:</span>
            <span className="font-bold text-amber-300">{parent?.father_name || parent?.full_name || 'Parent'}</span>
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

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
