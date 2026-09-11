'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight, HeartHandshake } from 'lucide-react';

export default function ParentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Unified Student & Family Portal</h2>
        <p className="text-xs text-slate-500">
          Parent and guardian monitoring features have been unified into the Student Portal. Redirecting now...
        </p>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow hover:bg-emerald-900 transition-all"
        >
          <span>Go to Student & Family Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
