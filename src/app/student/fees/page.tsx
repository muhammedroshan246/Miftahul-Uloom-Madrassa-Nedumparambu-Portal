'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Printer, Download, Sparkles } from 'lucide-react';

export default function StudentFeesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const mData = await meRes.json();
          const sId = mData.student?.id || mData.user?.student_id || 1;
          const [pRes, fRes] = await Promise.all([
            fetch(`/api/students/${sId}`),
            fetch(`/api/fees?studentId=${sId}`)
          ]);
          if (pRes.ok) setProfile(await pRes.json());
          if (fRes.ok) {
            const fData = await fRes.json();
            setFees(fData.fees || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const student = profile?.student || {};
  const paidCount = fees.filter(f => f.status === 'Paid').length;
  const pendingCount = fees.filter(f => f.status === 'Pending').length;
  const totalPaid = paidCount * 100;
  const totalPending = pendingCount * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-800" />
          <span>Monthly Fee Ledger (₹100/mo)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Nominal tuition fee schedule (₹100/month). View payment history and computerized receipts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Monthly Fee Rate</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">₹100 / mo</div>
          <div className="text-[10px] text-slate-400 mt-1">12 Months (April–March)</div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm">
          <span className="text-xs font-bold text-emerald-700">Total Paid Fees</span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1">₹{totalPaid}</div>
          <div className="text-[10px] text-emerald-600 mt-1">{paidCount} Months Cleared</div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 shadow-sm">
          <span className="text-xs font-bold text-rose-700">Outstanding Balance</span>
          <div className="text-3xl font-extrabold text-rose-900 mt-1">₹{totalPending}</div>
          <div className="text-[10px] text-rose-600 mt-1">{pendingCount} Months Due</div>
        </div>
      </div>

      {/* 12 Months Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Academic Year 2026-2027 Schedule</span>
          <span className="text-xs font-semibold text-emerald-800">Standard ₹100/mo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Academic Month</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Payment Mode & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{f.month}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-800">₹{f.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {f.receipt_no || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {f.status === 'Paid' ? `${f.payment_mode || 'Cash'} • ${f.payment_date || '2026'}` : 'Payment Pending at Office'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}