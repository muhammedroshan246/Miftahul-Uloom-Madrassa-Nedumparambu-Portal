'use client';

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

export default function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/achievements');
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          <span>Honors, Distinctions & Laurels</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Institutional distinctions, Quran competitions, and academic laurels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => (
          <div key={ach.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            {ach.certificate_url ? (
              <div className="relative h-44 bg-slate-950 overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ach.certificate_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow">
                  🏆 {ach.position}
                </div>
              </div>
            ) : (
              <div className="p-6 pb-0 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                  🏆 {ach.position}
                </span>
                <span className="text-xs text-slate-400 font-mono">{ach.date || '2026'}</span>
              </div>
            )}

            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{ach.title}</h3>
                <div className="text-xs text-emerald-800 font-bold">{ach.competition_event}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{ach.description || 'Awarded for extraordinary scholastic and Quranic distinction.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Awarded to: <strong className="text-slate-800">{ach.student_name || 'Student'}</strong></span>
                <span className="font-mono">{ach.date || '2026'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}