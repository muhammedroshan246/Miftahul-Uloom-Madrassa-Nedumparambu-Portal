'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  GraduationCap
} from 'lucide-react';

export default function OfficeMadrassaInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    madrassaName: '',
    range: '',
    rangeNumber: '',
    madrassaNumber: '',
    location: '',
    classTimingSession1: '',
    classTimingSession2: '',
    sadrName: '',
    sadrRole: '',
    sadrClass: '',
    sadrPhone: '',
    secretaryName: '',
    secretaryRole: '',
    secretaryPhone: '',
    presidentName: '',
    presidentRole: '',
    presidentPhone: '',
    showStaffPhonesPublicly: false,
    aboutHistory: ''
  });

  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch('/api/madrassa-info', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.info) {
            setForm(data.info);
          }
        }
      } catch (err) {
        console.error('Error loading Madrassa info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/madrassa-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Official Madrassa information and settings saved successfully!');
        setTimeout(() => setMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to save information');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <span>Loading institutional metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-800" />
            <span>Official Madrassa Information Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional identification numbers, class timing sessions, leadership administration, and privacy settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-amber-400" />
          <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Basic Institution Identification */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">1. Madrassa Basic Information & Identification</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Madrassa Name</label>
              <input
                type="text"
                value={form.madrassaName}
                onChange={(e) => setForm({ ...form, madrassaName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Location / Village</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Nedumparambu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Range</label>
              <input
                type="text"
                value={form.range}
                onChange={(e) => setForm({ ...form, range: e.target.value })}
                placeholder="Vengara"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Range Number</label>
              <input
                type="text"
                value={form.rangeNumber}
                onChange={(e) => setForm({ ...form, rangeNumber: e.target.value })}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Madrassa Number</label>
              <input
                type="text"
                value={form.madrassaNumber}
                onChange={(e) => setForm({ ...form, madrassaNumber: e.target.value })}
                placeholder="5090"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: Official Class Timings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">2. Official Class Timings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
              <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] block">Morning Session 1</span>
              <input
                type="text"
                value={form.classTimingSession1}
                onChange={(e) => setForm({ ...form, classTimingSession1: e.target.value })}
                placeholder="6:15 AM – 7:30 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
              <span className="text-[10px] text-slate-500">Primary & Secondary morning study batch</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
              <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] block">Morning Session 2</span>
              <input
                type="text"
                value={form.classTimingSession2}
                onChange={(e) => setForm({ ...form, classTimingSession2: e.target.value })}
                placeholder="7:30 AM – 9:00 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
              <span className="text-[10px] text-slate-500">Secondary & Higher Secondary core curriculum</span>
            </div>
          </div>
        </div>

        {/* Card 3: Administration & Leadership */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">3. Administration & Management Leadership</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Sadr / Head of Madrassa */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <span>Sadr / Head of Madrassa</span>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={form.sadrName}
                  onChange={(e) => setForm({ ...form, sadrName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Class</label>
                <input
                  type="text"
                  value={form.sadrClass}
                  onChange={(e) => setForm({ ...form, sadrClass: e.target.value })}
                  placeholder="+2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.sadrPhone}
                  onChange={(e) => setForm({ ...form, sadrPhone: e.target.value })}
                  placeholder="9544182665"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Secretary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Secretary</span>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={form.secretaryName}
                  onChange={(e) => setForm({ ...form, secretaryName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Role Title</label>
                <input
                  type="text"
                  value={form.secretaryRole}
                  onChange={(e) => setForm({ ...form, secretaryRole: e.target.value })}
                  placeholder="Secretary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.secretaryPhone}
                  onChange={(e) => setForm({ ...form, secretaryPhone: e.target.value })}
                  placeholder="9567333332"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* President */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>President</span>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={form.presidentName}
                  onChange={(e) => setForm({ ...form, presidentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Role Title</label>
                <input
                  type="text"
                  value={form.presidentRole}
                  onChange={(e) => setForm({ ...form, presidentRole: e.target.value })}
                  placeholder="President"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.presidentPhone}
                  onChange={(e) => setForm({ ...form, presidentPhone: e.target.value })}
                  placeholder="9947452964"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Card 4: Privacy & Public Display Guard */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-extrabold text-slate-900">4. Privacy & Public Contact Guard</h2>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <input
              type="checkbox"
              id="globalShowPhone"
              checked={form.showStaffPhonesPublicly}
              onChange={(e) => setForm({ ...form, showStaffPhonesPublicly: e.target.checked })}
              className="w-5 h-5 rounded text-emerald-800 mt-0.5"
            />
            <label htmlFor="globalShowPhone" className="text-xs text-slate-800 space-y-0.5 cursor-pointer">
              <strong className="block text-slate-950 font-bold">Show Faculty & Leadership Phone Numbers Publicly on Website</strong>
              <span className="text-slate-600 block text-[11px]">
                By default, phone numbers are kept private and masked on the public website for safety. Checking this box allows contact numbers to be shown to visitors.
              </span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Saving...' : 'Save & Sync Madrassa Information'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
