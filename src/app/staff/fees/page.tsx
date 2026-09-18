'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Printer, 
  X, 
  AlertCircle,
  Filter,
  DollarSign,
  User,
  Building2,
  Calendar,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  School,
  Check,
  RotateCcw
} from 'lucide-react';
import { MONTHS } from '@/lib/constants';

const YEARS = [2024, 2025, 2026, 2027, 2028];

function StaffFeesContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialWing = searchParams.get('wing') || '';

  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(8); // September
  const [selectedYear, setSelectedYear] = useState(2026);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Partial'>('All');

  // Roster data
  const [students, setStudents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [settings, setSettings] = useState<any>({ standardMonthlyFee: 100, feeCurrency: '₹' });

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk action modal
  const [bulkModal, setBulkModal] = useState<'Paid' | 'Unpaid' | null>(null);
  const [bulkDate, setBulkDate] = useState('2026-09-08');
  const [bulkMode, setBulkMode] = useState('Cash');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Receipt Modal
  const [receiptModal, setReceiptModal] = useState<any>(null);

  const monthName = MONTHS[selectedMonthIndex];
  const targetMonth = `${monthName} ${selectedYear}`;

  // 1. Load Staff Assignments
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/classes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = data.assignedClassList || [];
          setAssignedList(list);

          if (list.length > 0) {
            const matchedClass = list.find((item: any) => 
              String(item.classId) === String(initialClassId) && 
              (!initialWing || item.wing.toLowerCase() === initialWing.toLowerCase())
            );
            if (matchedClass) {
              setSelectedSectionId(String(matchedClass.sectionId));
            } else if (!selectedSectionId) {
              setSelectedSectionId(String(list[0].sectionId));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load class metadata:', e);
      }
    }
    loadMeta();
  }, [initialClassId, initialWing]);

  const currentAssignment = assignedList.find(a => String(a.sectionId) === String(selectedSectionId)) || assignedList[0];

  // 2. Fetch Fee Roster for Selected Month & Class
  const fetchFees = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setMsg(null);
    setSaveStatus('');
    try {
      const params = new URLSearchParams();
      params.set('classId', String(currentAssignment.classId));
      params.set('gender', currentAssignment.wing);
      params.set('month', targetMonth);
      if (search) params.set('search', search);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const res = await fetch(`/api/fees?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setMetrics(data.metrics || {});
        if (data.settings) setSettings(data.settings);
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Failed to fetch fee roster' });
      }
    } catch (e) {
      console.error('Fees fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAssignment) {
      fetchFees();
    }
  }, [selectedSectionId, targetMonth, statusFilter]);

  // Handle Inline Fee Update (Status Toggle, Amount, Date)
  const handleUpdateFee = async (student: any, newStatus: 'Paid' | 'Pending' | 'Partially Paid', newPaidAmount?: number, newDate?: string) => {
    const sId = student.student_id;
    setSavingId(sId);
    setSaveStatus('Saving to database...');

    const finalPaid = newPaidAmount !== undefined 
      ? newPaidAmount 
      : newStatus === 'Paid' 
      ? Number(student.amount || 100) 
      : 0;

    const finalDate = newDate !== undefined
      ? newDate
      : newStatus === 'Paid'
      ? (student.payment_date || new Date().toISOString().split('T')[0])
      : null;

    try {
      const res = await fetch('/api/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: sId,
          feeId: student.fee_id,
          month: targetMonth,
          status: newStatus,
          paidAmount: finalPaid,
          amount: Number(student.amount || 100),
          paymentDate: finalDate,
          paymentMode: student.payment_mode || 'Cash',
          paymentReference: student.payment_reference || 'USTHAD-REC-' + sId
        })
      });

      if (res.ok) {
        setSaveStatus('✓ Saved to database');
        // Optimistic local update
        setStudents(prev => prev.map(s => {
          if (s.student_id === sId) {
            const due = Number(s.amount || 100);
            return {
              ...s,
              status: newStatus,
              paid_amount: finalPaid,
              balance: due - finalPaid,
              payment_date: finalDate
            };
          }
          return s;
        }));
        setTimeout(() => setSaveStatus(''), 2500);
      } else {
        const err = await res.json();
        setSaveStatus('Error saving');
        setMsg({ type: 'error', text: err.error || 'Failed to update fee' });
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('Error saving');
    } finally {
      setSavingId(null);
    }
  };

  // Handle Bulk Action (Mark All Paid / Mark All Unpaid)
  const handleExecuteBulk = async () => {
    if (!bulkModal || !currentAssignment) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          classId: currentAssignment.classId,
          gender: currentAssignment.wing,
          month: targetMonth,
          bulkAction: bulkModal === 'Paid' ? 'mark_all_paid' : 'mark_all_unpaid',
          paymentDate: bulkDate,
          paymentMode: bulkMode
        })
      });

      if (res.ok) {
        setBulkModal(null);
        setMsg({ type: 'success', text: `All students in ${currentAssignment.className} (${currentAssignment.wing}) marked as ${bulkModal} for ${targetMonth}!` });
        fetchFees();
        setTimeout(() => setMsg(null), 3500);
      } else {
        const err = await res.json();
        alert(err.error || 'Bulk update failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error executing bulk fee update');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return s.student_name?.toLowerCase().includes(q) || s.admission_no?.toLowerCase().includes(q) || String(s.roll_no) === q;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Staff Fee Register
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                Fixed {settings.feeCurrency}{settings.standardMonthlyFee} / Month
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-emerald-800" />
              <span>Monthly Student Fee Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Fully editable Excel-style ledger for your assigned classes. Changes persist immediately to the database.
            </p>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setBulkModal('Paid')}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Mark All Paid</span>
            </button>
            <button
              type="button"
              onClick={() => setBulkModal('Unpaid')}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Mark All Unpaid</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SELECTORS AT THE TOP: Month [▼] Year [▼] Class [▼] Wing [▼] */}
        {/* ============================================================ */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fbfbf8] to-slate-50 border border-slate-200 flex flex-wrap items-center gap-4">
          
          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Month:</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
                className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
                className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Assigned Class & Wing Selector (Only Assigned Classes Shown) */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Assigned Class & Wing:</label>
            {assignedList.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {assignedList.map((item: any) => {
                  const isSelected = String(item.sectionId) === String(selectedSectionId);
                  return (
                    <button
                      key={item.sectionId}
                      type="button"
                      onClick={() => setSelectedSectionId(String(item.sectionId))}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <School className="w-3.5 h-3.5" />
                      <span>{item.className} — {item.wing}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">Loading assignments...</span>
            )}
          </div>

          {/* Save Status Indicator */}
          {saveStatus && (
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                saveStatus.includes('✓') 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : saveStatus.includes('Saving') 
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {saveStatus}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold text-[11px] block">Total Students</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalStudents || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold">
            <span>Collected ({metrics.paidCount || 0})</span>
            <span>{metrics.collectionRate || 0}%</span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {settings.feeCurrency}{(metrics.totalCollected || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
          <span className="text-rose-800 font-bold text-[11px] block">Outstanding Balance ({metrics.unpaidCount || 0})</span>
          <div className="text-2xl font-black text-rose-950 mt-1">
            {settings.feeCurrency}{(metrics.totalOutstanding || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm">
          <span className="text-slate-400 font-bold text-[11px] block">Total Expected Fee</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {settings.feeCurrency}{(metrics.totalExpected || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Paid', 'Pending', 'Partial'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Excel-Style Fee Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-700" />
            Loading fee register for {targetMonth}...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-14 sticky left-0 bg-slate-900 z-20">Roll</th>
                  <th className="py-3 px-4 min-w-[160px] sticky left-14 bg-slate-900 z-20">Student Name</th>
                  <th className="py-3 px-3">Admission</th>
                  <th className="py-3 px-3 text-right">Due ({settings.feeCurrency})</th>
                  <th className="py-3 px-3 text-right">Paid ({settings.feeCurrency})</th>
                  <th className="py-3 px-3 text-right">Balance ({settings.feeCurrency})</th>
                  <th className="py-3 px-4 text-center">Status (1-Click)</th>
                  <th className="py-3 px-3">Payment Date</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s, idx) => {
                  const isPaid = s.status === 'Paid';
                  const isPartial = s.status === 'Partially Paid';
                  const isPending = !isPaid && !isPartial;
                  const isRowSaving = savingId === s.student_id;

                  return (
                    <tr key={s.student_id} className={`hover:bg-slate-50 transition-colors ${
                      isRowSaving ? 'bg-amber-50/50' : ''
                    }`}>
                      {/* Sticky Roll */}
                      <td className="py-3 px-3 text-center font-black text-slate-900 sticky left-0 bg-white shadow-sm z-10 font-mono">
                        {s.roll_no || idx + 1}
                      </td>

                      {/* Sticky Name */}
                      <td className="py-3 px-4 whitespace-nowrap sticky left-14 bg-white shadow-sm z-10 font-bold text-slate-900">
                        {s.student_name}
                      </td>

                      {/* Admission No */}
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {s.admission_no}
                      </td>

                      {/* Fee Due */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {s.amount || 100}
                      </td>

                      {/* Paid Amount (Editable Input) */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <input
                          type="number"
                          value={s.paid_amount || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const due = Number(s.amount || 100);
                            let nextStatus: any = 'Pending';
                            if (val >= due) nextStatus = 'Paid';
                            else if (val > 0) nextStatus = 'Partially Paid';
                            handleUpdateFee(s, nextStatus, val);
                          }}
                          className="w-20 px-2 py-1 text-right rounded-lg border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                        />
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={s.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                          {s.balance || 0}
                        </span>
                      </td>

                      {/* Status Pills (1-Click Toggle) */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateFee(s, 'Paid')}
                            className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all ${
                              isPaid
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            title="Mark Paid"
                          >
                            ✓ Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateFee(s, 'Pending')}
                            className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all ${
                              isPending
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                            }`}
                            title="Mark Unpaid"
                          >
                            ✗ Unpaid
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateFee(s, 'Partially Paid', Math.round((s.amount || 100) / 2))}
                            className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all ${
                              isPartial
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                            }`}
                            title="Mark Partial"
                          >
                            ◐ Partial
                          </button>
                        </div>
                      </td>

                      {/* Payment Date */}
                      <td className="py-3 px-3">
                        <input
                          type="date"
                          value={s.payment_date || ''}
                          onChange={(e) => handleUpdateFee(s, s.status, s.paid_amount, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 font-mono text-[11px] outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setReceiptModal(s)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BULK ACTION CONFIRMATION MODAL                               */}
      {/* ============================================================ */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Bulk Action: Mark All {bulkModal.toUpperCase()}
              </h3>
              <button onClick={() => setBulkModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to mark all <strong>{students.length}</strong> students in{' '}
              <strong>{currentAssignment?.className} ({currentAssignment?.wing})</strong> as{' '}
              <strong className={bulkModal === 'Paid' ? 'text-emerald-800' : 'text-rose-800'}>
                {bulkModal.toUpperCase()}
              </strong>{' '}
              for <strong>{targetMonth}</strong>?
            </p>

            {bulkModal === 'Paid' && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulk Payment Date:</label>
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode:</label>
                  <select
                    value={bulkMode}
                    onChange={(e) => setBulkMode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulk}
                disabled={bulkLoading}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow ${
                  bulkModal === 'Paid'
                    ? 'bg-emerald-800 hover:bg-emerald-900'
                    : 'bg-rose-800 hover:bg-rose-900'
                }`}
              >
                {bulkLoading ? 'Processing...' : `Yes, Mark All ${bulkModal}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RECEIPT MODAL                                                */}
      {/* ============================================================ */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Madrassa Fee Receipt</h3>
                <span className="text-[10px] text-slate-400">{targetMonth}</span>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <strong className="text-slate-900">{receiptModal.student_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No:</span>
                <strong className="font-mono text-slate-800">{receiptModal.admission_no}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <strong className="text-slate-800">{currentAssignment?.className} ({currentAssignment?.wing})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Month:</span>
                <strong className="text-slate-800">{targetMonth}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Amount Paid:</span>
                <strong className="text-emerald-800 font-mono text-sm">{settings.feeCurrency}{receiptModal.paid_amount || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Due:</span>
                <strong className="text-rose-800 font-mono">{settings.feeCurrency}{receiptModal.balance || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <strong className="text-slate-900">{receiptModal.status}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-700">{receiptModal.payment_date || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StaffFeesPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400 text-xs font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
        Loading Monthly Fee Register...
      </div>
    }>
      <StaffFeesContent />
    </Suspense>
  );
}
