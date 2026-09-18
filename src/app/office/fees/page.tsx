'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Printer, 
  Download, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Settings,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
  Calendar,
  FileSpreadsheet,
  Users,
  Eye,
  Info
} from 'lucide-react';
import { CLASSES } from '@/lib/constants';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function OfficeFeesRegisterPage() {
  // 1. Selector State
  const [selectedMonthName, setSelectedMonthName] = useState('September');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(30); // Default Class 6
  const [selectedWing, setSelectedWing] = useState<'Boys' | 'Girls'>('Boys');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Partially Paid'>('All');
  const [search, setSearch] = useState('');

  // 2. Data State
  const [students, setStudents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [settings, setSettings] = useState<{ standardMonthlyFee: number; feeCurrency: string }>({
    standardMonthlyFee: 100,
    feeCurrency: '₹'
  });
  const [canEdit, setCanEdit] = useState(true);
  const [loading, setLoading] = useState(true);

  // 3. Save & Feedback State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('All records up-to-date');

  // 4. Modals
  const [bulkModal, setBulkModal] = useState<{ action: 'mark_all_paid' | 'mark_all_unpaid'; title: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPaymentDate, setBulkPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkPaymentMode, setBulkPaymentMode] = useState('Cash');

  const [settingsModal, setSettingsModal] = useState(false);
  const [newStandardFee, setNewStandardFee] = useState(100);
  const [newCurrency, setNewCurrency] = useState('₹');
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [receiptModal, setReceiptModal] = useState<any>(null);

  const selectedMonthString = `${selectedMonthName} ${selectedYear}`;

  // Selected Class Name
  const currentClassName = useMemo(() => {
    const c = classes.find(item => Number(item.id) === Number(selectedClassId));
    return c ? c.name : 'Class 6';
  }, [classes, selectedClassId]);

  // Load Register Data from Database
  const loadRegister = async (overrideMonth?: string) => {
    setLoading(true);
    try {
      const month = overrideMonth || selectedMonthString;
      const params = new URLSearchParams({
        classId: String(selectedClassId),
        gender: selectedWing,
        month: month
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const res = await fetch(`/api/fees?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setMetrics(data.metrics || {});
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
        }
        if (data.settings) {
          setSettings(data.settings);
          setNewStandardFee(data.settings.standardMonthlyFee);
          setNewCurrency(data.settings.feeCurrency || '₹');
        }
        if (data.canEdit !== undefined) setCanEdit(data.canEdit);
      }
    } catch (err: any) {
      console.error('Failed to load fee register:', err);
      setSaveStatus('error');
      setSaveMessage('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegister();
  }, [selectedMonthName, selectedYear, selectedClassId, selectedWing, statusFilter]);

  // Navigate Previous Month
  const handlePrevMonth = () => {
    const idx = MONTH_NAMES.indexOf(selectedMonthName);
    if (idx === 0) {
      setSelectedMonthName(MONTH_NAMES[11]);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonthName(MONTH_NAMES[idx - 1]);
    }
  };

  // Navigate Next Month
  const handleNextMonth = () => {
    const idx = MONTH_NAMES.indexOf(selectedMonthName);
    if (idx === 11) {
      setSelectedMonthName(MONTH_NAMES[0]);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonthName(MONTH_NAMES[idx + 1]);
    }
  };

  // Immediate Single Cell Database Save
  const handleSaveRecord = async (studentId: number, feeId: number | null, updates: any) => {
    if (!canEdit) {
      alert('You do not have permission to modify fee records for this class/wing.');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving to database...');

    // Optimistically update local UI
    const prevStudents = [...students];
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        const updated = { ...s, ...updates };
        if (updates.status === 'Paid') {
          updated.paid_amount = updates.amount || s.amount;
          updated.balance = 0;
          if (!updated.payment_date) updated.payment_date = new Date().toISOString().split('T')[0];
        } else if (updates.status === 'Pending') {
          updated.paid_amount = 0;
          updated.balance = s.amount;
          updated.payment_date = null;
        } else if (updates.status === 'Partially Paid') {
          updated.paid_amount = updates.paid_amount !== undefined ? updates.paid_amount : Math.floor(s.amount / 2);
          updated.balance = Math.max(0, s.amount - updated.paid_amount);
        }
        return updated;
      }
      return s;
    }));

    try {
      const student = students.find(s => s.student_id === studentId);
      const feeAmount = updates.amount !== undefined ? updates.amount : (student ? student.amount : settings.standardMonthlyFee);

      const payload: any = {
        studentId,
        feeId: feeId || undefined,
        month: selectedMonthString,
        amount: feeAmount,
        status: updates.status,
        paidAmount: updates.paid_amount !== undefined 
          ? updates.paid_amount 
          : (updates.status === 'Paid' ? feeAmount : (updates.status === 'Partially Paid' ? Math.floor(feeAmount / 2) : 0)),
        paymentDate: updates.payment_date !== undefined ? updates.payment_date : (updates.status === 'Paid' ? (student?.payment_date || new Date().toISOString().split('T')[0]) : null),
        paymentMode: updates.payment_mode || student?.payment_mode || 'Cash',
        paymentReference: updates.payment_reference !== undefined ? updates.payment_reference : student?.payment_reference
      };

      const res = await fetch('/api/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSaveStatus('saved');
        setSaveMessage('Saved to database');
        // Update with confirmed row from database
        if (data.fee) {
          setStudents(prev => prev.map(s => {
            if (s.student_id === studentId) {
              return {
                ...s,
                fee_id: data.fee.id,
                status: data.fee.status,
                paid_amount: Number(data.fee.paid_amount),
                balance: Math.max(0, Number(data.fee.amount) - Number(data.fee.paid_amount)),
                payment_date: data.fee.payment_date,
                payment_mode: data.fee.payment_mode,
                receipt_no: data.fee.receipt_no
              };
            }
            return s;
          }));
        }
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        throw new Error(data.error || 'Failed to save fee record');
      }
    } catch (err: any) {
      console.error('Save fee error:', err);
      // Revert optimistic update
      setStudents(prevStudents);
      setSaveStatus('error');
      setSaveMessage(err.message || 'Failed to save');
      alert('Database Save Failed: ' + (err.message || 'Unknown error. Check network.'));
    }
  };

  // Bulk Action Execution
  const handleExecuteBulkAction = async () => {
    if (!bulkModal) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          bulkAction: bulkModal.action,
          classId: selectedClassId,
          gender: selectedWing,
          month: selectedMonthString,
          paymentDate: bulkPaymentDate,
          paymentMode: bulkPaymentMode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBulkModal(null);
        setSaveStatus('saved');
        setSaveMessage(data.message || 'Bulk update completed');
        await loadRegister();
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        alert(data.error || 'Failed to execute bulk action');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error executing bulk action: ' + err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Update Standard Monthly Fee Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          standardMonthlyFee: newStandardFee,
          feeCurrency: newCurrency
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSettings({ standardMonthlyFee: newStandardFee, feeCurrency: newCurrency });
        setSettingsModal(false);
        setSaveStatus('saved');
        setSaveMessage('Fee settings updated in database');
        await loadRegister();
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating settings: ' + err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    const url = `/api/reports?type=fees&month=${encodeURIComponent(selectedMonthString)}&classId=${selectedClassId}&gender=${selectedWing}&format=csv`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Live Spreadsheet Register
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              {settings.feeCurrency}{settings.standardMonthlyFee} / Month
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-800" />
            <span>Monthly Fee Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive Excel-style tuition register with 1-click status toggling, immediate database save, and audit verification.
          </p>
        </div>

        {/* Live Database Save Status Pill & Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`px-3.5 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all ${
            saveStatus === 'saving'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : saveStatus === 'saved'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
              : saveStatus === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {saveStatus === 'saving' ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            ) : saveStatus === 'saved' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : saveStatus === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span className="text-[11px] font-mono">{saveMessage}</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 shadow-sm transition-all"
            title="Download CSV for currently selected month, class, and wing"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setSettingsModal(true)}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all"
            title="Configure Standard Monthly Fee & Currency"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* 2. Selector Filter Deck: [ Month ▼ ] [ Year ▼ ] [ Class ▼ ] [ Wing ▼ ] */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Month & Year Navigator */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Selector */}
            <select
              value={selectedMonthName}
              onChange={(e) => setSelectedMonthName(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white font-black text-slate-900 text-xs border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl bg-white font-black text-slate-900 text-xs border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="px-3.5 py-2 rounded-2xl bg-white font-black text-slate-900 text-xs border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Wing / Section Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSelectedWing('Boys')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedWing === 'Boys' 
                  ? 'bg-blue-800 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Boys Wing
            </button>
            <button
              onClick={() => setSelectedWing('Girls')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedWing === 'Girls' 
                  ? 'bg-rose-800 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Girls Wing
            </button>
          </div>

          {/* Bulk Action Controls */}
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkModal({
                  action: 'mark_all_paid',
                  title: `Mark All as PAID for ${selectedMonthString}`
                })}
                className="px-3.5 py-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Mark All Paid</span>
              </button>

              <button
                onClick={() => setBulkModal({
                  action: 'mark_all_unpaid',
                  title: `Mark All as UNPAID for ${selectedMonthString}`
                })}
                className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Mark All Unpaid</span>
              </button>
            </div>
          )}
        </div>

        {/* Secondary Filter: Search & Status */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${currentClassName} ${selectedWing} by student name or roll #...`}
              className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-medium focus:ring-2 focus:ring-emerald-700 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Statuses ({metrics.totalStudents || 0})</option>
              <option value="Paid">✓ Paid Only ({metrics.paidCount || 0})</option>
              <option value="Pending">✗ Unpaid Only ({metrics.unpaidCount || 0})</option>
              <option value="Partially Paid">◐ Partial Only ({metrics.partialCount || 0})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Summary Cards for Selected Class + Wing + Month */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{metrics.totalStudents || 0}</div>
          <div className="text-[10px] text-slate-500 font-semibold truncate">{currentClassName} • {selectedWing}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid (Cleared)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">{metrics.paidCount || 0}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            {metrics.totalStudents > 0 ? Math.round(((metrics.paidCount || 0) / metrics.totalStudents) * 100) : 0}% Cleared
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/70 shadow-sm">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Unpaid (Dues)</div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-0.5">{metrics.unpaidCount || 0}</div>
          <div className="text-[10px] text-rose-600 font-semibold">Pending Collection</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 shadow-sm">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Partial</div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">{metrics.partialCount || 0}</div>
          <div className="text-[10px] text-amber-600 font-semibold">Installments</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expected</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            {settings.feeCurrency}{(metrics.totalExpected || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Standard Demand</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-900 text-white shadow-md">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Total Collected</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
            {settings.feeCurrency}{(metrics.totalCollected || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-200/80 font-medium">Recorded in DB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Outstanding</div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">
            {settings.feeCurrency}{(metrics.totalOutstanding || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold">Balance to Collect</div>
        </div>
      </div>

      {/* 4. Excel-Style Spreadsheet Register Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-xs border-collapse border-spacing-0">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                {/* Sticky Roll No Column */}
                <th className="py-3.5 px-3.5 sticky left-0 z-20 bg-slate-900 w-16 text-center border-r border-slate-800">
                  Roll #
                </th>

                {/* Sticky Student Name Column */}
                <th className="py-3.5 px-4 sticky left-16 z-20 bg-slate-900 min-w-[200px] sm:min-w-[240px] border-r border-slate-800">
                  Student Name & Admission
                </th>

                <th className="py-3.5 px-3 text-right min-w-[100px]">Fee Due</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Payment Status</th>
                <th className="py-3.5 px-3 text-right min-w-[110px]">Paid Amount</th>
                <th className="py-3.5 px-3 text-right min-w-[90px]">Balance</th>
                <th className="py-3.5 px-3 min-w-[140px]">Payment Date</th>
                <th className="py-3.5 px-3 min-w-[110px]">Payment Mode</th>
                <th className="py-3.5 px-3 min-w-[130px]">Receipt / Ref</th>
                <th className="py-3.5 px-3 text-center min-w-[80px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="font-semibold text-xs">Loading {currentClassName} {selectedWing} register for {selectedMonthString}...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500 space-y-2">
                    <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="font-bold text-sm text-slate-800">No students found</div>
                    <div className="text-xs text-slate-400">No active students matching the filter for {currentClassName} {selectedWing}.</div>
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const isPaid = st.status === 'Paid';
                  const isPending = st.status === 'Pending';
                  const isPartial = st.status === 'Partially Paid';

                  return (
                    <tr 
                      key={st.student_id} 
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      {/* 1. Sticky Roll No */}
                      <td className="py-3 px-3 sticky left-0 z-10 bg-white group-hover:bg-emerald-50/50 border-r border-slate-200/80 text-center font-mono font-black text-slate-800">
                        {String(st.roll_no).padStart(2, '0')}
                      </td>

                      {/* 2. Sticky Student Name */}
                      <td className="py-3 px-4 sticky left-16 z-10 bg-white group-hover:bg-emerald-50/50 border-r border-slate-200/80">
                        <div className="font-black text-slate-900 text-xs truncate max-w-[220px]">
                          {st.student_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{st.admission_no}</span>
                          {st.phone && <span className="text-slate-400">• {st.phone}</span>}
                        </div>
                      </td>

                      {/* 3. Monthly Fee Due */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {settings.feeCurrency}{st.amount}
                      </td>

                      {/* 4. Interactive 1-Click Status Cell */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200 shadow-inner">
                          <button
                            onClick={() => handleSaveRecord(st.student_id, st.fee_id, { status: 'Paid' })}
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-all flex items-center gap-1 ${
                              isPaid 
                                ? 'bg-emerald-700 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-emerald-800'
                            }`}
                            title="Mark as Paid (Full)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Paid</span>
                          </button>

                          <button
                            onClick={() => handleSaveRecord(st.student_id, st.fee_id, { status: 'Pending' })}
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-all flex items-center gap-1 ${
                              isPending 
                                ? 'bg-rose-700 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-rose-800'
                            }`}
                            title="Mark as Unpaid"
                          >
                            <X className="w-3 h-3" />
                            <span>Unpaid</span>
                          </button>

                          <button
                            onClick={() => handleSaveRecord(st.student_id, st.fee_id, { status: 'Partially Paid' })}
                            className={`px-2 py-1 rounded-lg font-black text-[10px] transition-all ${
                              isPartial 
                                ? 'bg-amber-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-amber-800'
                            }`}
                            title="Mark as Partial Payment"
                          >
                            <span>Partial</span>
                          </button>
                        </div>
                      </td>

                      {/* 5. Paid Amount (Inline Editable) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 font-mono text-[11px]">{settings.feeCurrency}</span>
                          <input
                            type="number"
                            min="0"
                            max={st.amount}
                            value={st.paid_amount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStudents(prev => prev.map(s => s.student_id === st.student_id ? { ...s, paid_amount: val, balance: Math.max(0, s.amount - val) } : s));
                            }}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              const newStatus = val >= st.amount ? 'Paid' : (val > 0 ? 'Partially Paid' : 'Pending');
                              handleSaveRecord(st.student_id, st.fee_id, { paid_amount: val, status: newStatus });
                            }}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-900 text-right text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
                          />
                        </div>
                      </td>

                      {/* 6. Balance Outstanding */}
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg ${
                          st.balance === 0 
                            ? 'text-emerald-800 bg-emerald-50' 
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {settings.feeCurrency}{st.balance}
                        </span>
                      </td>

                      {/* 7. Payment Date */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={st.payment_date || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleSaveRecord(st.student_id, st.fee_id, { payment_date: val });
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
                          />
                          {!st.payment_date && isPaid && (
                            <button
                              onClick={() => handleSaveRecord(st.student_id, st.fee_id, { payment_date: new Date().toISOString().split('T')[0] })}
                              className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                              title="Set Today's Date"
                            >
                              Today
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 8. Payment Mode */}
                      <td className="py-3 px-3">
                        <select
                          value={st.payment_mode || 'Cash'}
                          onChange={(e) => handleSaveRecord(st.student_id, st.fee_id, { payment_mode: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-700"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay</option>
                          <option value="Bank Transfer">Bank</option>
                          <option value="Online">Online</option>
                        </select>
                      </td>

                      {/* 9. Receipt No / Reference Note */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={st.payment_reference || ''}
                          placeholder={st.receipt_no || 'Txn note...'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudents(prev => prev.map(s => s.student_id === st.student_id ? { ...s, payment_reference: val } : s));
                          }}
                          onBlur={(e) => handleSaveRecord(st.student_id, st.fee_id, { payment_reference: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
                        />
                      </td>

                      {/* 10. Actions (Receipt) */}
                      <td className="py-3 px-3 text-center">
                        {isPaid || isPartial ? (
                          <button
                            onClick={() => setReceiptModal(st)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-sm"
                            title="Print Official Computerized Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Bottom Spreadsheet Total Row */}
            {students.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
                  <td colSpan={2} className="py-4 px-4 sticky left-0 z-20 bg-slate-900 text-amber-400 uppercase tracking-wider">
                    TOTAL REGISTER DEMAND ({students.length} STUDENTS)
                  </td>
                  <td className="py-4 px-3 text-right font-mono">
                    {settings.feeCurrency}{(metrics.totalExpected || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-3 text-center text-[11px]">
                    <span className="text-emerald-400 font-bold">{metrics.paidCount || 0} Paid</span> • <span className="text-rose-400 font-bold">{metrics.unpaidCount || 0} Unpaid</span>
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-emerald-400 font-extrabold text-sm">
                    {settings.feeCurrency}{(metrics.totalCollected || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-rose-400 font-extrabold text-sm">
                    {settings.feeCurrency}{(metrics.totalOutstanding || 0).toLocaleString()}
                  </td>
                  <td colSpan={4} className="py-4 px-3 text-right text-slate-400 font-mono text-[10px]">
                    Monthly Register Source: SQLite Database
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. Bulk Action Confirmation Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">{bulkModal.title}</h3>
              </div>
              <button onClick={() => setBulkModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="font-bold">
                Are you sure you want to perform this mass update?
              </div>
              <p className="text-slate-600 leading-relaxed">
                This will update all <strong>{students.length} active students</strong> in <strong>{currentClassName} — {selectedWing} Wing</strong> for the month of <strong>{selectedMonthString}</strong> to <strong>{bulkModal.action === 'mark_all_paid' ? 'PAID' : 'UNPAID'}</strong>.
              </p>
            </div>

            {bulkModal.action === 'mark_all_paid' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={bulkPaymentDate}
                    onChange={(e) => setBulkPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={bulkPaymentMode}
                    onChange={(e) => setBulkPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold outline-none"
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBulkModal(null)}
                disabled={bulkLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkAction}
                disabled={bulkLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md flex items-center gap-2"
              >
                {bulkLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating Database...</span>
                  </>
                ) : (
                  <span>Confirm & Save to Database</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Institutional Fee Settings Modal */}
      {settingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-800" />
                <h3 className="font-black text-slate-900 text-base">Institutional Fee Settings</h3>
              </div>
              <button onClick={() => setSettingsModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Monthly Tuition Fee</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">{newCurrency}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newStandardFee}
                    onChange={(e) => setNewStandardFee(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-black text-sm outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default tuition rate per student per month. Changing this will apply to newly initialized registers without altering historical records.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettingsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black shadow-md flex items-center gap-2"
                >
                  {settingsSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Official Fee Receipt Modal (View & Print) */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="font-bold text-xs text-slate-700">Official Computerized Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setReceiptModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-300 text-slate-900 space-y-4 text-xs">
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Islamic Educational Board of India</div>
                <div className="font-black text-sm uppercase">Mifthahul Uloom Higher Secondary Madrassa</div>
                <div className="text-[10px] text-slate-500">Kozhikode, Kerala — Monthly Fee Receipt Voucher</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Receipt No: <span className="font-mono font-bold">{receiptModal.receipt_no || `REC-${receiptModal.student_id}`}</span></div>
                <div>Date: <span className="font-bold">{receiptModal.payment_date || new Date().toISOString().split('T')[0]}</span></div>
                <div>Student: <span className="font-bold">{receiptModal.student_name}</span></div>
                <div>Class: <span className="font-bold">{currentClassName} • Roll #{receiptModal.roll_no}</span></div>
                <div>Admission No: <span className="font-mono">{receiptModal.admission_no}</span></div>
                <div>Academic Month: <span className="font-bold text-emerald-800">{selectedMonthString}</span></div>
                <div>Amount Paid: <span className="font-black text-emerald-950 text-sm">{settings.feeCurrency}{receiptModal.paid_amount}</span></div>
                <div>Mode: <span className="font-semibold">{receiptModal.payment_mode || 'Cash'}</span></div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-[11px] font-bold">
                <div>Status: <span className="text-emerald-700">PAID & VERIFIED</span></div>
                <div>Office Authorized Seal</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
