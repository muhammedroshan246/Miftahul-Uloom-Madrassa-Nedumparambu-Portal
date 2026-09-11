'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, Users, CreditCard, CalendarCheck, CheckCircle2 } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('students');
  const [format, setFormat] = useState('csv');

  const downloadReport = (t: string, f: string) => {
    window.open(`/api/reports?type=${t}&format=${f}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
          <span>Institutional Reports & Data Exports</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Export verified official institution records to CSV and printable report formats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Report Card 1: Students */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Student Census Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete student master directory with admission numbers, classes, wings, parent phones, and statuses.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => downloadReport('students', 'csv')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Students CSV</span>
            </button>
          </div>
        </div>

        {/* Report Card 2: Fees */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Monthly Fees Ledger (₹100)</h3>
            <p className="text-xs text-slate-500 mt-1">
              12-month fee collection records, receipts, payment modes, and outstanding defaulter balance lists.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => downloadReport('fees', 'csv')}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Fees Ledger CSV</span>
            </button>
          </div>
        </div>

        {/* Report Card 3: Attendance */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Attendance Log Sheet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Classroom daily attendance logs, section-wise present percentages, and leave logs.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => downloadReport('attendance', 'csv')}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Attendance CSV</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}