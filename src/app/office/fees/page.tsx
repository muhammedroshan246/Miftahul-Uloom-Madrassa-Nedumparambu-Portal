'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, CheckCircle2, Printer, Download, X, AlertCircle } from 'lucide-react';
import { MONTHS, CLASSES } from '@/lib/constants';

export default function OfficeFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');

  // Mark Paid modal
  const [markModal, setMarkModal] = useState<any>(null);
  const [payMode, setPayMode] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payMsg, setPayMsg] = useState('');

  const loadFees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMonth !== 'All') params.set('month', selectedMonth);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedClass !== 'All') params.set('classId', selectedClass);

      const res = await fetch(`/api/fees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFees(data.fees || []);
        setMetrics(data.metrics || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [selectedMonth, selectedStatus, selectedClass]);

  const handleMarkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: markModal.id,
          status: 'Paid',
          paymentMode: payMode,
          paymentReference: payRef || 'CASH-REC-' + Date.now().toString().slice(-4),
          paidAmount: 100
        })
      });
      if (res.ok) {
        setMarkModal(null);
        setPayMsg('Fee payment recorded & official receipt generated!');
        loadFees();
        setTimeout(() => setPayMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-800" />
            <span>Monthly Fee Management Desk (₹100/mo)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Collection monitoring, dues defaulter lists, and computerized receipt generation for all 12 academic months.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports?type=fees&format=csv"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fee Ledger CSV</span>
          </a>
        </div>
      </div>

      {payMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{payMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Total Demands</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{metrics.total_amount || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
          <span className="text-xs font-bold text-emerald-700">Total Collected</span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">₹{metrics.total_collected || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
          <span className="text-xs font-bold text-rose-700">Pending Dues</span>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">₹{metrics.total_pending || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
          <span className="text-xs font-bold text-amber-700">Standard Rate</span>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">₹100 / mo</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student name, admission no, or phone..."
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 flex-1 min-w-[200px] outline-none"
        />

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 outline-none"
        >
          <option value="All">All Months</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending (Dues Defaulters)</option>
        </select>

        <button
          onClick={loadFees}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-sm"
        >
          Filter
        </button>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Adm No</th>
                <th className="py-3 px-4">Class & Wing</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt / Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading fee records...</td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No fee records found.</td></tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{f.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{f.admission_no} • #{f.roll_no}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.gender === 'Boys' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {f.class_name} {f.section_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{f.month}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{f.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {f.status === 'Paid' ? (
                        <div>
                          <div className="font-mono font-bold text-emerald-900 text-[11px]">{f.receipt_no}</div>
                          <div className="text-[10px] text-slate-400">{f.payment_mode} • {f.payment_date}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unpaid Dues</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {f.status === 'Pending' ? (
                        <button
                          onClick={() => setMarkModal(f)}
                          className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] shadow-sm"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Official Receipt: ${f.receipt_no}\nStudent: ${f.student_name}\nMonth: ${f.month}\nAmount: ₹${f.amount}\nMode: ${f.payment_mode}\nDate: ${f.payment_date}`)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {markModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Record Fee Collection</h3>
              <button onClick={() => setMarkModal(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>Student: <strong className="text-slate-900">{markModal.student_name}</strong></div>
              <div>Class: <strong className="text-slate-900">{markModal.class_name} {markModal.section_name}</strong></div>
              <div>Month: <strong className="text-emerald-800">{markModal.month}</strong></div>
              <div>Amount Due: <strong className="text-slate-900 font-bold">₹{markModal.amount}</strong></div>
            </div>

            <form onSubmit={handleMarkPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none bg-white"
                >
                  <option value="Cash">Cash (Office Counter)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Reference / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-2608-98441 or Cash Counter"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMarkModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md"
                >
                  Generate Receipt & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}