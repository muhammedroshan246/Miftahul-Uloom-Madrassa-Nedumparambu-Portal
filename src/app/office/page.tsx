'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  School, 
  CalendarCheck, 
  CreditCard, 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  Eye,
  ShieldCheck,
  Building2,
  Banknote,
  Bell,
  Award,
  Settings,
  Plus,
  ArrowUpRight
} from 'lucide-react';

export default function OfficeDashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);
  const [feesMetrics, setFeesMetrics] = useState<any>({});
  const [payrollMetrics, setPayrollMetrics] = useState<any>({});
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    async function loadDashboard() {
      try {
        const results = await Promise.allSettled([
          fetch('/api/public/stats').then(r => r.ok ? r.json() : null),
          fetch('/api/students?limit=6').then(r => r.ok ? r.json() : null),
          fetch('/api/fees').then(r => r.ok ? r.json() : null),
          fetch('/api/payroll?month=September 2026').then(r => r.ok ? r.json() : null),
          fetch('/api/announcements').then(r => r.ok ? r.json() : null),
          fetch('/api/achievements').then(r => r.ok ? r.json() : null),
          fetch('/api/audit-logs').then(r => r.ok ? r.json() : null)
        ]);

        if (!isMounted) return;

        if (results[0].status === 'fulfilled' && results[0].value) setStats(results[0].value);
        if (results[1].status === 'fulfilled' && results[1].value?.students) setStudents(results[1].value.students);
        if (results[2].status === 'fulfilled' && results[2].value?.metrics) setFeesMetrics(results[2].value.metrics);
        if (results[3].status === 'fulfilled' && results[3].value?.totals) setPayrollMetrics(results[3].value.totals);
        if (results[4].status === 'fulfilled' && results[4].value?.announcements) setRecentNotices(results[4].value.announcements.slice(0, 4));
        if (results[5].status === 'fulfilled' && results[5].value?.achievements) setRecentAchievements(results[5].value.achievements.slice(0, 4));
        if (results[6].status === 'fulfilled' && results[6].value?.logs) setRecentLogs(results[6].value.logs.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(timeout);
      }
    }
    loadDashboard();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const totalCollected = Number(feesMetrics.total_collected || 0);
  const totalPendingFees = Number(feesMetrics.total_pending || 0);
  const totalPayrollDemand = Number(payrollMetrics.totalNet || 0);
  const totalPendingSalaries = Number(payrollMetrics.totalPending || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-amber-400 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Madrassa Administration Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mifthahul Uloom Office Portal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
            Centralized administrative console for student admissions, class sections, academic marks, faculty payroll, monthly ₹100 fees, and board compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/office/admission"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Student</span>
          </Link>
          <Link
            href="/office/payroll"
            className="px-4 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 flex items-center gap-2 transition-all shadow-md"
          >
            <Banknote className="w-4 h-4 text-amber-400" />
            <span>Salary & Payroll</span>
          </Link>
        </div>
      </div>

      {/* 13 Primary Quick-Action Buttons */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Action Controls
          </h2>
          <span className="text-[11px] text-emerald-700 font-semibold">13 Direct Management Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <Link
            href="/office/admission"
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition-all hover:scale-105 text-center"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD STUDENT</span>
          </Link>

          <Link
            href="/office/students"
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>STUDENTS</span>
          </Link>

          <Link
            href="/office/classes"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <School className="w-4 h-4 text-purple-600" />
            <span>CLASSES</span>
          </Link>

          <Link
            href="/office/marks"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>MARKS / RESULTS</span>
          </Link>

          <Link
            href="/office/teachers"
            className="p-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ ADD TEACHER</span>
          </Link>

          <Link
            href="/office/teachers"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>STAFF</span>
          </Link>

          <Link
            href="/office/payroll"
            className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition-all text-center shadow-sm"
          >
            <Banknote className="w-4 h-4 text-emerald-700" />
            <span>SALARY / PAYROLL</span>
          </Link>

          <Link
            href="/office/announcements"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Bell className="w-4 h-4 text-rose-600" />
            <span>NOTICES</span>
          </Link>

          <Link
            href="/office/achievements"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>ACHIEVEMENTS</span>
          </Link>

          <Link
            href="/office/attendance"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>ATTENDANCE</span>
          </Link>

          <Link
            href="/office/fees"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>FEES</span>
          </Link>

          <Link
            href="/office/reports"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>REPORTS</span>
          </Link>

          <Link
            href="/office/madrassa-info"
            className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs border border-amber-300 flex items-center justify-center gap-1.5 transition-all text-center shadow-sm"
          >
            <Building2 className="w-4 h-4 text-amber-700" />
            <span>MADRASSA INFO</span>
          </Link>

          <Link
            href="/office/settings"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>SETTINGS</span>
          </Link>
        </div>
      </div>

      {/* Real-time Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalStudents || 0}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Active Enrolled</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Boys</span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">{stats.totalBoys || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">12 Boys Sections</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Girls</span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-900">{stats.totalGirls || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">12 Girls Sections</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Teachers</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalTeachers || 0}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Faculty Usthads</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Classes</span>
            <School className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-900">24</div>
          <div className="text-[11px] text-slate-500 mt-1">Classes 1 to +2</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Attendance</span>
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-900">96.4%</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">Today's Presence</div>
        </div>
      </div>

      {/* Financial & Payroll Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Monthly ₹100 Fees Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Collected for Current Academic Session</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Student Fees</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">₹{totalPendingFees.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Outstanding across 24 sections</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Monthly Faculty Payroll</span>
            <Banknote className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-950">₹{totalPayrollDemand.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 font-medium">September 2026 Demand</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Salary Disbursement</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">₹{totalPendingSalaries.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Awaiting bank disbursement</div>
        </div>
      </div>

      {/* Main Content Grid: Recent Admissions + Notices & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Admissions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Student Admissions</h2>
              <p className="text-xs text-slate-500">Newly enrolled students across Primary & Higher Secondary wings</p>
            </div>
            <Link href="/office/students" className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No students found.</div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    {s.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={s.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {s.full_name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <strong className="block text-xs text-slate-900 font-bold">{s.full_name}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">{s.admission_no} • {s.class_name} ({s.gender})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                      Roll {s.roll_no}
                    </span>
                    <Link
                      href="/office/students"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices & Achievements Feeds (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recent Notices */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Recent Notices & Circulars</span>
              </h3>
              <Link href="/office/announcements" className="text-xs font-bold text-emerald-800 hover:text-emerald-900">
                Manage
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentNotices.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No notices published.</div>
              ) : (
                recentNotices.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">{n.title}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px]">{n.content}</p>
                    <div className="text-[10px] text-slate-400">Audience: {n.target_audience}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Recent Hall of Fame Awards</span>
              </h3>
              <Link href="/office/achievements" className="text-xs font-bold text-emerald-800 hover:text-emerald-900">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentAchievements.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No achievements recorded yet.</div>
              ) : (
                recentAchievements.map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3">
                    <div>
                      <strong className="block text-slate-900 font-bold">{a.title}</strong>
                      <div className="text-[11px] text-amber-800 font-semibold">{a.competition_event}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] shrink-0 shadow-sm">
                      {a.position}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
