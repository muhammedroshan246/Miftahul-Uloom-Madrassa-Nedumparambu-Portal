'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Banknote,
  Search,
  Save,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Users
} from 'lucide-react';
import { useStaffClass } from '../StaffClassContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StaffMonthlyFeesPage() {
  const { selectedClassId, selectedClass, assignedClasses, setSelectedClassId } = useStaffClass();

  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [wingFilter, setWingFilter] = useState<'All' | 'Boys' | 'Girls'>('All');
  const [search, setSearch] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);

  // Bulk action modals
  const [bulkModal, setBulkModal] = useState<'mark_all_paid' | 'mark_all_unpaid' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const formattedMonth = `${selectedMonth} ${selectedYear}`;

  const fetchFees = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    setError(null);
    try {
      let url = `/api/fees?classId=${selectedClassId}&month=${encodeURIComponent(formattedMonth)}`;
      if (wingFilter !== 'All') {
        url += `&gender=${wingFilter}`;
      }
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch class fees');
      }

      const data = await res.json();
      setStudents(data.students || []);
      setMetrics(data.metrics || {});
      setPendingChanges({});
    } catch (err: any) {
      setError(err.message || 'Error loading fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [selectedClassId, selectedMonth, selectedYear, wingFilter]);

  // Handle local cell edit
  const handleCellChange = (studentId: number, field: string, value: any) => {
    setPendingChanges((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
    }));

    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id !== studentId) return s;
        const updated = { ...s, [field]: value };
        if (field === 'paid_amount' || field === 'amount') {
          const amt = Number(field === 'amount' ? value : s.amount) || 0;
          const paid = Number(field === 'paid_amount' ? value : s.paid_amount) || 0;
          updated.balance = Math.max(0, amt - paid);
          if (paid >= amt && amt > 0) updated.status = 'Paid';
          else if (paid > 0 && paid < amt) updated.status = 'Partial';
          else updated.status = 'Pending';
        }
        if (field === 'status') {
          if (value === 'Paid') {
            updated.paid_amount = updated.amount || 100;
            updated.balance = 0;
            if (!updated.payment_date) updated.payment_date = new Date().toISOString().split('T')[0];
          } else if (value === 'Pending') {
            updated.paid_amount = 0;
            updated.balance = updated.amount || 100;
          }
        }
        return updated;
      })
    );
  };

  // Quick 1-click status pill toggle
  const handleStatusToggle = (st: any) => {
    const curStatus = st.status || 'Pending';
    let newStatus = 'Paid';
    if (curStatus === 'Paid') newStatus = 'Pending';
    else if (curStatus === 'Pending') newStatus = 'Paid';
    else newStatus = 'Paid';

    handleCellChange(st.student_id, 'status', newStatus);
  };

  // Save all modified rows to SQLite database
  const handleSaveChanges = async () => {
    const studentIds = Object.keys(pendingChanges).map(Number);
    if (studentIds.length === 0) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      for (const sId of studentIds) {
        const student = students.find((s) => s.student_id === sId);
        if (!student) continue;

        const payload = {
          studentId: sId,
          feeId: student.fee_id,
          month: formattedMonth,
          amount: Number(student.amount) || 100,
          paidAmount: Number(student.paid_amount) || 0,
          status: student.status || 'Pending',
          paymentDate: student.payment_date || null
        };

        const res = await fetch('/api/fees', {
          method: student.fee_id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save fee record');
        }
      }

      setSaveSuccess('All fee updates saved to SQLite database!');
      setPendingChanges({});
      setTimeout(() => setSaveSuccess(null), 4000);
      fetchFees();
    } catch (err: any) {
      setError(err.message || 'Error persisting fee changes');
    } finally {
      setSaving(false);
    }
  };

  // Bulk actions: Mark All Paid / Mark All Unpaid
  const handleBulkSubmit = async () => {
    if (!bulkModal || !selectedClassId) return;

    setBulkLoading(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          classId: Number(selectedClassId),
          wing: wingFilter,
          month: formattedMonth,
          status: bulkModal === 'mark_all_paid' ? 'Paid' : 'Pending'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Bulk update failed');
      }

      setSaveSuccess(bulkModal === 'mark_all_paid' ? 'Marked all students as Paid!' : 'Marked all students as Unpaid!');
      setBulkModal(null);
      setTimeout(() => setSaveSuccess(null), 4000);
      fetchFees();
    } catch (err: any) {
      setError(err.message || 'Error executing bulk action');
    } finally {
      setBulkLoading(false);
    }
  };

  const hasPending = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                Monthly Fee Register
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedClass?.className || 'Selected Class'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-800" />
              <span>{selectedClass?.className} Monthly Fees (₹100)</span>
            </h1>
            <p className="text-xs text-slate-500">
              Excel-style spreadsheet ledger. Click status pills or inline-edit paid amounts and dates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBulkModal('mark_all_paid')}
              disabled={loading || students.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mark All Paid</span>
            </button>
            <button
              onClick={() => setBulkModal('mark_all_unpaid')}
              disabled={loading || students.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mark All Unpaid</span>
            </button>
            {hasPending && (
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all animate-pulse"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Save ({Object.keys(pendingChanges).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Controls: Month, Year, Wing, Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-fee-month-select" className="text-xs font-bold text-slate-500">Month:</label>
              <select
                id="staff-fee-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="staff-fee-year-select" className="text-xs font-bold text-slate-500">Year:</label>
              <select
                id="staff-fee-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {['2024', '2025', '2026', '2027', '2028'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs font-bold text-slate-500">Wing:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                {(['All', 'Boys', 'Girls'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWingFilter(w)}
                    className={'px-3 py-1 rounded-lg transition-all ' + (
                      wingFilter === w
                        ? 'bg-white text-emerald-900 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Classroom quick switch if multiple assigned */}
          {assignedClasses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Switch Class:</span>
              {assignedClasses.map((c) => (
                <button
                  key={c.classId}
                  onClick={() => setSelectedClassId(c.classId)}
                  className={'px-2.5 py-1 rounded-xl text-xs font-bold transition-all ' + (
                    c.classId === selectedClassId
                      ? 'bg-emerald-800 text-amber-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {c.className}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase text-slate-400">Total Due</div>
          <div className="text-xl font-black text-slate-900">₹{metrics.totalDue || 0}</div>
          <div className="text-[10px] text-slate-500">{metrics.totalStudents || 0} enrolled students</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase text-emerald-600">Collected</div>
          <div className="text-xl font-black text-emerald-700">₹{metrics.totalPaid || 0}</div>
          <div className="text-[10px] text-emerald-600 font-bold">{metrics.paidCount || 0} students paid</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase text-rose-600">Outstanding</div>
          <div className="text-xl font-black text-rose-700">₹{metrics.totalOutstanding || 0}</div>
          <div className="text-[10px] text-rose-600 font-bold">{metrics.pendingCount || 0} pending</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase text-amber-600">Collection Rate</div>
          <div className="text-xl font-black text-amber-700">{metrics.collectionRate || '0.0%'}</div>
          <div className="text-[10px] text-slate-500">{selectedMonth} {selectedYear}</div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Excel-Style Fee Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            {selectedClass?.className} • {selectedMonth} {selectedYear} Fee Ledger ({students.length} Students)
          </div>
          <div className="text-xs text-slate-400">
            Standard Monthly Fee: ₹100
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading fee register...
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">
            No students found for {selectedClass?.className} ({wingFilter} wing).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 border-r border-slate-200 text-center">Roll</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[170px]">Student Details</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-20 text-center">Wing</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24 text-right">Fee Due</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-28 text-center">Status</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-28 text-right">Paid (₹)</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24 text-right">Balance</th>
                  <th className="py-3 px-3 w-32 text-center">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const isPaid = st.status === 'Paid';
                  const isPartial = st.status === 'Partial';
                  const isPending = !isPaid && !isPartial;

                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 border-r border-slate-200 font-mono font-bold text-slate-700 text-center">
                        {st.roll_no || '—'}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{st.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{st.admission_no} • {st.primary_phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                          st.gender === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        )}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-700">
                        ₹{st.amount || 100}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <button
                          onClick={() => handleStatusToggle(st)}
                          className={'px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 mx-auto ' + (
                            isPaid 
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-sm'
                              : isPartial
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                          )}
                        >
                          {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{st.status || 'Pending'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-right">
                        <input
                          type="number"
                          value={st.paid_amount ?? 0}
                          onChange={(e) => handleCellChange(st.student_id, 'paid_amount', Number(e.target.value))}
                          className="w-20 text-right font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-right font-mono font-bold text-rose-700">
                        ₹{st.balance ?? (st.amount || 100)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="date"
                          value={st.payment_date || ''}
                          onChange={(e) => handleCellChange(st.student_id, 'payment_date', e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Bulk Actions */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900">
              {bulkModal === 'mark_all_paid' ? 'Mark All Students as Paid?' : 'Mark All Students as Unpaid?'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {bulkModal === 'mark_all_paid'
                ? `This will record ₹100 as Paid for all students in ${selectedClass?.className} (${wingFilter} wing) for ${formattedMonth}.`
                : `This will set all fees to Unpaid / Pending for all students in ${selectedClass?.className} (${wingFilter} wing) for ${formattedMonth}.`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBulkModal(null)}
                disabled={bulkLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkLoading}
                className={'px-4 py-2 rounded-xl text-white font-extrabold text-xs transition-all ' + (
                  bulkModal === 'mark_all_paid' ? 'bg-emerald-800 hover:bg-emerald-900' : 'bg-rose-700 hover:bg-rose-800'
                )}
              >
                {bulkLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
