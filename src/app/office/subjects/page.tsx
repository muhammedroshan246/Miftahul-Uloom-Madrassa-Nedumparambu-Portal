'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Award,
  Layers,
  Check,
  X
} from 'lucide-react';

export default function OfficeSubjectsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState('100');
  const [formPassMarks, setFormPassMarks] = useState('40');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/classes'),
        fetch(`/api/subjects?status=all${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setClasses(cData.classes || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSubjects(sData.subjects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId(null);
    setFormName('');
    setFormCode('');
    setFormClassId(classes[0]?.id ? String(classes[0].id) : '25');
    setFormMaxMarks('100');
    setFormPassMarks('40');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: any) => {
    setModalMode('edit');
    setCurrentId(sub.id);
    setFormName(sub.name);
    setFormCode(sub.code || '');
    setFormClassId(String(sub.class_id));
    setFormMaxMarks(String(sub.max_marks || 100));
    setFormPassMarks(String(sub.pass_marks || 40));
    setFormIsActive(sub.is_active === 1 || sub.is_active === true);
    setIsModalOpen(true);
  };

  const handleMaxMarksPreset = (preset: number) => {
    setFormMaxMarks(String(preset));
    setFormPassMarks(String(Math.round(preset * 0.4)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClassId) {
      setMsg({ type: 'error', text: 'Subject Name and Academic Class are required.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    try {
      const payload = {
        id: currentId,
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || null,
        classId: Number(formClassId),
        maxMarks: Number(formMaxMarks) || 100,
        passMarks: Number(formPassMarks) || 40,
        isActive: formIsActive
      };

      const res = await fetch('/api/subjects', {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: data.message || 'Subject saved successfully!' });
        setIsModalOpen(false);
        loadData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save subject.' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error communicating with server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (sub: any) => {
    try {
      const nextActive = sub.is_active === 1 ? 0 : 1;
      const res = await fetch('/api/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sub.id,
          name: sub.name,
          code: sub.code,
          classId: sub.class_id,
          maxMarks: sub.max_marks || 100,
          passMarks: sub.pass_marks || 40,
          isActive: nextActive === 1
        })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `Subject '${sub.name}' ${nextActive ? 'activated' : 'deactivated'} successfully.` });
        loadData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (selectedClassFilter !== 'all' && String(s.class_id) !== String(selectedClassFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-800" />
            <span>Subject & Total Mark Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure curriculum subjects with custom Total Marks (20, 25, 50, 75, 100) and pass marks across all 12 classes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Subject</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects (e.g. Fiqh, Tajweed)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none bg-white min-w-[160px] focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Classes (12 Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing <strong>{filteredSubjects.length}</strong> subjects
        </span>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
            Loading subjects...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No subjects match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Academic Class</th>
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4 text-center">Total / Max Mark</th>
                  <th className="py-3.5 px-4 text-center">Pass Mark</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((sub: any) => {
                  const isActive = sub.is_active === 1 || sub.is_active === true;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-black text-[11px]">
                          {sub.class_name}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        {sub.name}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                        {sub.code || '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                        <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                          {sub.max_marks || 100}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-600">
                        {sub.pass_marks || 40}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right pr-6 space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(sub)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-all"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(sub)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all ${
                            isActive
                              ? 'border border-rose-200 hover:bg-rose-50 text-rose-700'
                              : 'border border-emerald-200 hover:bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <span>{isActive ? 'Deactivate' : 'Activate'}</span>
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

      {/* CREATE / EDIT SUBJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-800" />
                <span>{modalMode === 'create' ? 'Add New Subject' : 'Edit Subject'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fiqh, Aqeedah, Tajweed, Arabic"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Code (Optional)</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. FIQ-C5, AQD-C1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Class *</label>
                <select
                  required
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Mark Selector & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Total / Maximum Mark *</label>
                  <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
                </div>
                
                <div className="flex items-center gap-1.5 mb-2">
                  {[20, 25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleMaxMarksPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                        Number(formMaxMarks) === preset
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={formMaxMarks}
                  onChange={(e) => {
                    setFormMaxMarks(e.target.value);
                    setFormPassMarks(String(Math.round(Number(e.target.value) * 0.4)));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pass Mark (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max={formMaxMarks}
                  value={formPassMarks}
                  onChange={(e) => setFormPassMarks(e.target.value)}
                  placeholder="e.g. 20 for 50, 40 for 100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="subjectActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="subjectActive" className="font-bold text-slate-800 cursor-pointer">
                  Active in Curriculum (Available for examination entry)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black shadow-md transition-all"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Subject' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
