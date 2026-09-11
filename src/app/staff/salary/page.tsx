'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Banknote, 
  Printer, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Building2, 
  FileText,
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';

export default function StaffSalaryPage() {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [selectedSalary, setSelectedSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printModal, setPrintModal] = useState<any>(null);

  const loadSalary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll');
      if (res.ok) {
        const data = await res.json();
        setSalaries(data.salaries || []);
        if (data.teacher) {
          setTeacher(data.teacher);
        }
        if (data.salaries && data.salaries.length > 0) {
          setSelectedSalary(data.salaries[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load salary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalary();
  }, []);

  // Compute metrics
  const totalEarned = salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalPaid = salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalPending = salaries.filter(s => s.status === 'Pending').reduce((sum, s) => sum + (s.net_salary || 0), 0);

  const handlePrintSlip = (sal: any) => {
    setPrintModal(sal);
  };

  const triggerBrowserPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Loading My Salary Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Confidential Faculty Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              View Only
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Banknote className="w-7 h-7 text-emerald-800" />
            <span>My Monthly Salary & Slips</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official monthly remuneration record maintained by Office Administration ERP.
          </p>
        </div>

        {/* Teacher Badge */}
        <div className="flex items-center gap-3 bg-emerald-950 text-white px-4 py-3 rounded-2xl shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
            {teacher?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-xs font-black text-white">{teacher?.name || 'Usthad'}</div>
            <div className="text-[10px] text-amber-400 font-medium">ID: {teacher?.teacher_id || 'TCH'} • {teacher?.designation || 'Faculty'}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-3xl shadow-md border border-emerald-800">
          <div className="text-emerald-300 text-[11px] font-bold uppercase tracking-wider">Total Received (Paid)</div>
          <div className="text-3xl font-black text-amber-400 mt-2">₹{totalPaid.toLocaleString('en-IN')}</div>
          <div className="text-emerald-200/70 text-[10px] mt-1">Academic Year 2026-2027</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Remuneration</div>
          <div className="text-3xl font-black text-slate-900 mt-2">₹{totalEarned.toLocaleString('en-IN')}</div>
          <div className="text-slate-500 text-[10px] mt-1">{salaries.length} Months Total Billed</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Pending Disbursals</div>
          <div className="text-3xl font-black text-amber-600 mt-2">₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="text-slate-500 text-[10px] mt-1">{salaries.filter(s => s.status === 'Pending').length} Pending Month(s)</div>
        </div>
      </div>

      {/* Latest / Selected Salary Card */}
      {selectedSalary && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Month Statement</span>
              <h2 className="text-xl font-black text-slate-900">{selectedSalary.month}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                selectedSalary.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {selectedSalary.status === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{selectedSalary.status}</span>
              </span>

              <button
                onClick={() => handlePrintSlip(selectedSalary)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Salary Slip</span>
              </button>
            </div>
          </div>

          {/* Salary Breakdown Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Pay</div>
              <div className="text-xl font-black text-slate-800 mt-1">₹{selectedSalary.basic_salary?.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fixed Base</div>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">+ Allowances</div>
              <div className="text-xl font-black text-emerald-800 mt-1">₹{selectedSalary.allowance?.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Special & DA</div>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">- Deductions</div>
              <div className="text-xl font-black text-rose-800 mt-1">₹{selectedSalary.deduction?.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">PF / Advance</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Net Payable / Received</div>
              <div className="text-xl font-black text-amber-900 mt-1">₹{selectedSalary.net_salary?.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-bold">Official Disbursal</div>
            </div>
          </div>

          {/* Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-500">Payment Date:</span>{' '}
              <span className="font-bold text-slate-800">{selectedSalary.payment_date || 'Pending Schedule'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-500">Payment Mode:</span>{' '}
              <span className="font-bold text-slate-800">{selectedSalary.payment_mode || 'Bank Transfer / Cash'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-500">Remarks:</span>{' '}
              <span className="font-medium text-slate-700">{selectedSalary.remarks || 'Regular monthly faculty honorarium'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Salary History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <h3 className="font-black text-sm text-slate-900">Salary History & Disbursal Records</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">{salaries.length} Total Statements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Month</th>
                <th className="py-3.5 px-4">Basic Pay</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.map((sal) => {
                const isSelected = selectedSalary?.id === sal.id;
                return (
                  <tr 
                    key={sal.id}
                    onClick={() => setSelectedSalary(sal)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{sal.month}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">₹{sal.basic_salary?.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">+₹{sal.allowance?.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-semibold">-₹{sal.deduction?.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{sal.net_salary?.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        sal.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sal.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{sal.payment_date || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintSlip(sal);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Salary Slip Modal */}
      {printModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Controls */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl print:hidden">
              <div className="font-bold text-xs text-slate-700">Official Faculty Salary Pay-Slip</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerBrowserPrint}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintModal(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="p-8 space-y-6 text-slate-900" id="salary-slip">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-xs uppercase tracking-widest text-emerald-800 font-extrabold">Islamic Educational Board of India</div>
                <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight mt-0.5">
                  MIFTHAHUL ULOOM HIGHER SECONDARY MADRASSA
                </h2>
                <div className="text-xs text-slate-600 font-semibold">Valanchery, Malappuram Dt., Kerala — 676552</div>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  Faculty Monthly Remuneration Pay-Slip • {printModal.month}
                </div>
              </div>

              {/* Usthad Information Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Usthad / Faculty Name</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{teacher?.name || 'Faculty'}</div>
                  <div className="text-[11px] text-slate-600 font-medium mt-1">Staff ID: <span className="font-bold">{teacher?.teacher_id || 'TCH'}</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Designation & Role</div>
                  <div className="text-sm font-black text-emerald-900 mt-0.5">{teacher?.designation || 'Teacher'}</div>
                  <div className="text-[11px] text-slate-600 font-medium mt-1">Status: <span className="font-bold text-emerald-700">{printModal.status}</span></div>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-3">Salary Component</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Basic Honorarium</td>
                      <td className="p-3 text-right font-bold">₹{printModal.basic_salary?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-800">Special Teaching Allowance</td>
                      <td className="p-3 text-right font-bold text-emerald-800">+ ₹{printModal.allowance?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-rose-800">Deductions (Advance / Other)</td>
                      <td className="p-3 text-right font-bold text-rose-800">- ₹{printModal.deduction?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-amber-50 font-black text-sm">
                      <td className="p-3 text-slate-900">NET DISBURSAL AMOUNT</td>
                      <td className="p-3 text-right text-emerald-950 font-black text-base">₹{printModal.net_salary?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Disbursal Date</div>
                  <div className="font-bold text-slate-800">{printModal.payment_date || '05-09-2026'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Payment Mode & Ref</div>
                  <div className="font-bold text-slate-800">{printModal.payment_mode || 'Bank Transfer'} (OFFICIAL-PAYROLL)</div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-black text-slate-900">V. K. Jabir Baqavi</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Sadr Usthad / Principal</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-black text-slate-900">{teacher?.name || 'Usthad'}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Faculty Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
