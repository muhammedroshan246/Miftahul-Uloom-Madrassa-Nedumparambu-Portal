'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  X, 
  AlertCircle,
  Filter,
  DollarSign,
  User,
  Building2,
  Calendar
} from 'lucide-react';
import { MONTHS } from '@/lib/constants';

export default function StaffFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [assignedSections, setAssignedSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [markModal, setMarkModal] = useState<any>(null);
  const [payMode, setPayMode] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payMsg, setPayMsg] = useState('');
  const [printReceipt, setPrintReceipt] = useState<any>(null);

  const loadFees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMonth !== 'All') params.set('month', selectedMonth);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedSectionId) params.set('sectionId', selectedSectionId);

      const res = await fetch(`/api/fees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFees(data.fees || []);
        setMetrics(data.metrics || {});
        if (data.assignedSections && data.assignedSections.length > 0) {
          setAssignedSections(data.assignedSections);
          if (!selectedSectionId) {
            setSelectedSectionId(data.assignedSections[0].id.toString());
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [selectedMonth, selectedStatus, selectedSectionId]);

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
          paymentReference: payRef || 'USTHAD-CASH-' + Date.now().toString().slice(-4),
          paidAmount: 100
        })
      });
      if (res.ok) {
        setMarkModal(null);
        setPayMsg('Fee payment recorded & receipt issued!');
        loadFees();
        setTimeout(() => setPayMsg(''), 3000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to record fee');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Class Teacher Fee Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              Fixed ₹100 / Month
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-800" />
            <span>Assigned Class Fee Collection</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Collect and record ₹100 monthly madrasa fees for your authorized class section students.
          </p>
        </div>

        {/* Section Selector */}
        {assignedSections.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">My Authorized Section:</div>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="mt-1 font-black text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              {assignedSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.class_name} — {sec.wing} Wing
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {payMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{payMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Collection Expected</div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{metrics.totalExpected || (fees.length * 100)}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">{fees.length} enrolled students</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-3xl shadow-md border border-emerald-800">
          <div className="text-emerald-300 text-[11px] font-bold uppercase tracking-wider">Collected (Paid)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">₹{metrics.totalCollected || (fees.filter(f => f.status === 'Paid').length * 100)}</div>
          <div className="text-emerald-200/70 text-[10px] mt-0.5">{fees.filter(f => f.status === 'Paid').length} students cleared</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Pending Dues</div>
          <div className="text-2xl font-black text-rose-600 mt-1">₹{metrics.totalPending || (fees.filter(f => f.status === 'Pending').length * 100)}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">{fees.filter(f => f.status === 'Pending').length} students pending</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="All">All Months</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
      </div>

      {/* Students Fee Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Roll</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class & Wing</th>
                <th className="py-3.5 px-4">Fee Month</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Ref</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                    No fee records found for the selected section/filter.
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-700">
                      #{fee.roll_number || fee.student_roll || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {fee.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {fee.class_name} • {fee.gender}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {fee.month}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{fee.amount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        fee.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {fee.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{fee.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {fee.payment_reference || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {fee.status === 'Pending' ? (
                        <button
                          onClick={() => setMarkModal(fee)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-[11px] shadow-sm transition-all"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => setPrintReceipt(fee)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Receipt</span>
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

      {/* Mark Paid Modal */}
      {markModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-800" />
                <h3 className="font-black text-slate-900 text-sm">Record Monthly Fee (₹100)</h3>
              </div>
              <button onClick={() => setMarkModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>Student: <span className="font-bold text-slate-900">{markModal.student_name}</span></div>
              <div>Class: <span className="font-bold text-slate-700">{markModal.class_name} • Roll #{markModal.roll_number || markModal.student_roll}</span></div>
              <div>Month: <span className="font-bold text-emerald-800">{markModal.month}</span></div>
              <div>Fixed Fee: <span className="font-black text-slate-900">₹100</span></div>
            </div>

            <form onSubmit={handleMarkPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="Cash">Cash to Usthad</option>
                  <option value="UPI / Online">UPI / QR Transfer</option>
                  <option value="Bank">Bank Deposit</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Receipt Note / Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received in cash"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMarkModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black shadow-md"
                >
                  Confirm & Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {printReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="font-bold text-xs text-slate-700">Student Fee Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPrint}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setPrintReceipt(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-300 text-slate-900 space-y-4 text-xs">
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Islamic Educational Board of India</div>
                <div className="font-black text-sm uppercase">Mifthahul Uloom Higher Secondary Madrassa</div>
                <div className="text-[10px] text-slate-500">Valanchery, Malappuram — Fee Receipt</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>Receipt No: <span className="font-mono font-bold">REC-FEES-{printReceipt.id}</span></div>
                <div>Date: <span className="font-bold">{printReceipt.payment_date || '05-09-2026'}</span></div>
                <div>Student: <span className="font-bold">{printReceipt.student_name}</span></div>
                <div>Class: <span className="font-bold">{printReceipt.class_name} • Roll #{printReceipt.roll_number || printReceipt.student_roll}</span></div>
                <div>Month: <span className="font-bold text-emerald-800">{printReceipt.month}</span></div>
                <div>Amount: <span className="font-black text-emerald-950 text-sm">₹100.00</span></div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-[11px] font-bold">
                <div>Status: <span className="text-emerald-700">PAID & VERIFIED</span></div>
                <div>Authorized Usthad Stamp</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
