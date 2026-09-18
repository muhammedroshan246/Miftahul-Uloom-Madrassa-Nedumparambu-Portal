'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Banknote, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  History, 
  Edit, 
  CreditCard, 
  FileSpreadsheet, 
  X,
  UserCheck,
  Building2,
  Calendar
} from 'lucide-react';

export default function OfficePayrollPage() {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Modals
  const [editModal, setEditModal] = useState<any>(null);
  const [historyModal, setHistoryModal] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyTeacher, setHistoryTeacher] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'All') params.set('month', selectedMonth);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (search) params.set('search', search);

      const res = await fetch(`/api/payroll?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSalaries(data.salaries || []);
        setTotals(data.totals || {});
        if (data.availableMonths?.length > 0) {
          setAvailableMonths(data.availableMonths);
        }
      }
    } catch (err) {
      console.error('Payroll fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [selectedMonth, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayroll();
  };

  const handleGenerateMonth = async () => {
    const targetMonth = prompt('Enter the month and year to generate payroll (e.g. October 2026):', selectedMonth);
    if (!targetMonth) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_month', month: targetMonth.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        setSelectedMonth(targetMonth.trim());
        await loadPayroll();
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to generate payroll');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleQuickMarkPaid = async (salId: number, teacherName: string) => {
    if (!confirm(`Mark salary voucher as PAID for ${teacherName}?`)) return;

    try {
      const res = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: salId,
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Bank Transfer',
          paymentReference: `SAL-DIRECT-${Date.now()}`
        })
      });
      if (res.ok) {
        setActionMsg(`Salary voucher marked as PAID for ${teacherName}`);
        await loadPayroll();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update salary voucher');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModal)
      });
      if (res.ok) {
        setEditModal(null);
        setActionMsg('Salary voucher updated successfully!');
        await loadPayroll();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save salary voucher');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + err.message);
    }
  };

  const handleOpenHistory = async (teacherId: number) => {
    try {
      const res = await fetch(`/api/teachers?teacherId=${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTeacher(data.teacher);
        setHistoryData(data.salaryHistory || []);
        setHistoryModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/payroll/export?month=${encodeURIComponent(selectedMonth)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-800" />
            <span>Faculty Salary & Payroll Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Spreadsheet-style payroll calculation, allowances, deductions, payment vouchers, and audit tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateMonth}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{generating ? 'Generating...' : '+ Generate Month Payroll'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Staff Count</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{totals.count || 0}</div>
          <div className="text-[10px] text-emerald-700 font-medium">Faculty Members</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Basic Total</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">₹{(totals.totalBasic || 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Gross Baseline</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Allowances</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">+₹{(totals.totalAllowances || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600">Special & Travel</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Deductions</div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1">-₹{(totals.totalDeductions || 0).toLocaleString()}</div>
          <div className="text-[10px] text-rose-600">Leaves / Advances</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950 text-white shadow-md">
          <div className="text-[11px] font-bold text-amber-400 uppercase">Net Payroll</div>
          <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">₹{(totals.totalNet || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-300">Total Demand</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Disbursed / Paid</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1">₹{(totals.totalPaid || 0).toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 font-semibold">Pending: ₹{(totals.totalPending || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by teacher name, staff ID, or payment reference..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-700 outline-none"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="All">All Months</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-700 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid Only</option>
              <option value="Pending">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Staff ID</th>
                <th className="py-3.5 px-4">Faculty Teacher</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4 text-right">Basic Salary</th>
                <th className="py-3.5 px-4 text-right">Allowance</th>
                <th className="py-3.5 px-4 text-right">Deduction</th>
                <th className="py-3.5 px-4 text-right font-extrabold text-amber-300">Net Salary</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Payment Info</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading payroll records...</span>
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 space-y-2">
                    <Banknote className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>No salary records found for {selectedMonth}.</div>
                    <button
                      onClick={handleGenerateMonth}
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                    >
                      + Generate Payroll for {selectedMonth}
                    </button>
                  </td>
                </tr>
              ) : (
                salaries.map((sal) => {
                  const basic = Number(sal.basic_salary || 0);
                  const allow = Number(sal.allowance || 0);
                  const ded = Number(sal.deduction || 0);
                  const net = basic + allow - ded;
                  const isPaid = sal.status === 'Paid';

                  return (
                    <tr key={sal.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        {sal.staff_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {sal.photo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={sal.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {sal.teacher_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <strong className="block text-slate-900 font-bold">{sal.teacher_name}</strong>
                            <span className="text-[10px] text-slate-400">{sal.qualification || 'Faculty'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {sal.designation}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        ₹{basic.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        +₹{allow.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-700">
                        {ded > 0 ? `-₹${ded.toLocaleString()}` : '₹0'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-950 text-sm bg-amber-50/50">
                        ₹{net.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                          <span>{sal.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {isPaid ? (
                          <div>
                            <div className="font-semibold text-slate-800">{sal.payment_date || 'Disbursed'}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{sal.payment_reference || sal.payment_mode}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting disbursement</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleQuickMarkPaid(sal.id, sal.teacher_name)}
                              title="Mark as Paid"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditModal({
                              id: sal.id,
                              teacher_name: sal.teacher_name,
                              staff_id: sal.staff_id,
                              month: sal.month,
                              basicSalary: sal.basic_salary,
                              allowance: sal.allowance,
                              deduction: sal.deduction,
                              status: sal.status,
                              paymentDate: sal.payment_date || new Date().toISOString().split('T')[0],
                              paymentMode: sal.payment_mode || 'Bank Transfer',
                              paymentReference: sal.payment_reference || `SAL-${Date.now()}`,
                              notes: sal.notes || ''
                            })}
                            title="Edit Salary Voucher"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenHistory(sal.teacher_id)}
                            title="View Staff Salary History"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            
            {/* Spreadsheet Bottom Summary Bar */}
            {salaries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                  <td colSpan={3} className="py-4 px-4 uppercase tracking-wider text-amber-400">
                    MONTHLY TOTAL ({salaries.length} FACULTY MEMBERS)
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    ₹{(totals.totalBasic || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400">
                    +₹{(totals.totalAllowances || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-400">
                    -₹{(totals.totalDeductions || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-amber-300 font-extrabold text-sm">
                    ₹{(totals.totalNet || 0).toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-4 px-4 text-right text-xs">
                    <span className="text-emerald-400 mr-3">Paid: ₹{(totals.totalPaid || 0).toLocaleString()}</span>
                    <span className="text-amber-400">Pending: ₹{(totals.totalPending || 0).toLocaleString()}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Salary Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Edit Salary Voucher</h3>
                <p className="text-xs text-slate-500">{editModal.teacher_name} ({editModal.staff_id}) • {editModal.month}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={editModal.basicSalary}
                    onChange={(e) => setEditModal({ ...editModal, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowance (₹)</label>
                  <input
                    type="number"
                    value={editModal.allowance}
                    onChange={(e) => setEditModal({ ...editModal, allowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deduction (₹)</label>
                  <input
                    type="number"
                    value={editModal.deduction}
                    onChange={(e) => setEditModal({ ...editModal, deduction: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Real-time Computed Net Salary */}
              <div className="p-3 rounded-xl bg-emerald-950 text-white flex items-center justify-between">
                <span className="font-bold text-xs text-amber-400">Computed Net Salary:</span>
                <span className="font-mono text-base font-extrabold text-white">
                  ₹{(Number(editModal.basicSalary || 0) + Number(editModal.allowance || 0) - Number(editModal.deduction || 0)).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={editModal.status}
                    onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={editModal.paymentMode}
                    onChange={(e) => setEditModal({ ...editModal, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={editModal.paymentDate || ''}
                    onChange={(e) => setEditModal({ ...editModal, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Reference / Txn ID</label>
                  <input
                    type="text"
                    value={editModal.paymentReference || ''}
                    onChange={(e) => setEditModal({ ...editModal, paymentReference: e.target.value })}
                    placeholder="e.g. UTR-984711002"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editModal.notes || ''}
                  onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  placeholder="Additional notes for audit trail..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md"
                >
                  Save Salary Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Salary History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {historyTeacher?.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={historyTeacher.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                    {historyTeacher?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{historyTeacher?.full_name}</h3>
                  <p className="text-xs text-slate-500">{historyTeacher?.designation} • {historyTeacher?.staff_id}</p>
                </div>
              </div>
              <button onClick={() => setHistoryModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Salary Disbursement History</h4>
              
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">Basic</th>
                      <th className="py-2.5 px-3 text-right">Allowance</th>
                      <th className="py-2.5 px-3 text-right">Deduction</th>
                      <th className="py-2.5 px-3 text-right font-bold">Net Salary</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">No salary history available.</td>
                      </tr>
                    ) : (
                      historyData.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{h.month}</td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{Number(h.basic_salary || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+₹{Number(h.allowance || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-700">{h.deduction > 0 ? `-₹${Number(h.deduction).toLocaleString()}` : '₹0'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 bg-amber-50/40">₹{Number(h.net_salary || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">{h.payment_date || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
