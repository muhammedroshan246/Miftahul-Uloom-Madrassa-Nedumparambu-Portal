'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  School, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Save, 
  RefreshCw,
  Search,
  Filter,
  Lock,
  Unlock
} from 'lucide-react';
import { CLASSES } from '@/lib/constants';

export default function OfficePermissionsPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | 'all'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local permissions state map: key = `${teacher_id}_${section_id}`
  const [permMap, setPermMap] = useState<{ [key: string]: {
    is_class_teacher: boolean;
    can_manage_attendance: boolean;
    can_manage_marks: boolean;
    can_manage_fees: boolean;
  } }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/office/permissions');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        setSections(data.sections || []);
        setPermissions(data.permissions || []);

        // Build mapping
        const mapping: any = {};
        (data.permissions || []).forEach((p: any) => {
          const key = `${p.teacher_id}_${p.section_id}`;
          mapping[key] = {
            is_class_teacher: Boolean(p.is_class_teacher),
            can_manage_attendance: Boolean(p.can_manage_attendance),
            can_manage_marks: Boolean(p.can_manage_marks),
            can_manage_fees: Boolean(p.can_manage_fees)
          };
        });
        setPermMap(mapping);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = (teacherId: number, sectionId: number, field: 'is_class_teacher' | 'can_manage_attendance' | 'can_manage_marks' | 'can_manage_fees') => {
    const key = `${teacherId}_${sectionId}`;
    const current = permMap[key] || {
      is_class_teacher: false,
      can_manage_attendance: false,
      can_manage_marks: false,
      can_manage_fees: false
    };

    const nextVal = !current[field];
    const updated = { ...current, [field]: nextVal };

    // If making class teacher, automatically enable attendance, marks, fees
    if (field === 'is_class_teacher' && nextVal) {
      updated.can_manage_attendance = true;
      updated.can_manage_marks = true;
      updated.can_manage_fees = true;
    }

    setPermMap({
      ...permMap,
      [key]: updated
    });
  };

  const handleGrantAllForSection = (teacherId: number, sectionId: number, grant: boolean) => {
    const key = `${teacherId}_${sectionId}`;
    setPermMap({
      ...permMap,
      [key]: {
        is_class_teacher: grant,
        can_manage_attendance: grant,
        can_manage_marks: grant,
        can_manage_fees: grant
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      // Flatten permMap to array
      const payload: any[] = [];
      Object.keys(permMap).forEach((key) => {
        const [tIdStr, sIdStr] = key.split('_');
        const teacherId = parseInt(tIdStr);
        const sectionId = parseInt(sIdStr);
        const p = permMap[key];
        payload.push({
          teacher_id: teacherId,
          section_id: sectionId,
          is_class_teacher: p.is_class_teacher ? 1 : 0,
          can_manage_attendance: p.can_manage_attendance ? 1 : 0,
          can_manage_marks: p.can_manage_marks ? 1 : 0,
          can_manage_fees: p.can_manage_fees ? 1 : 0
        });
      });

      const res = await fetch('/api/office/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Staff permissions saved successfully!' });
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save permissions.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  // Filter sections
  const filteredSections = sections.filter(sec => {
    if (selectedClassId !== 'all' && sec.class_id !== parseInt(selectedClassId)) return false;
    if (selectedWing !== 'all' && sec.wing !== selectedWing) return false;
    return true;
  });

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    if (selectedTeacherId !== 'all' && t.id !== selectedTeacherId) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Loading Granular Staff Permissions Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Access Control & Governance
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              Granular Class + Section Control
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-800" />
            <span>Staff Class & Section Permissions Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Class Teacher assignments, Attendance Control, Marks Control, and Fee Collection rights per teacher per section (Boys/Girls wing).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Reload Permissions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Saving...' : 'Save All Permissions'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter Teacher:</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Faculty Usthad ({teachers.length})</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.teacher_id})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Classes (1 to +2)</option>
            {CLASSES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Wing:</span>
          <select
            value={selectedWing}
            onChange={(e) => setSelectedWing(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Both Wings (Boys & Girls)</option>
            <option value="Boys">Boys Section Only</option>
            <option value="Girls">Girls Section Only</option>
          </select>
        </div>
      </div>

      {/* Permissions Matrix Cards */}
      <div className="space-y-6">
        {filteredTeachers.map((teacher) => {
          return (
            <div key={teacher.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Teacher Header Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-sm text-white flex items-center gap-2">
                      <span>{teacher.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-amber-300 text-[10px] font-bold">
                        {teacher.teacher_id}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-200/80 font-medium">
                      {teacher.designation || 'Faculty Member'} • Phone: {teacher.phone || '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-300 font-bold text-[11px]">Assigned Sections:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-amber-300 font-bold text-xs">
                    {sections.filter(s => {
                      const key = `${teacher.id}_${s.id}`;
                      return permMap[key]?.is_class_teacher || permMap[key]?.can_manage_attendance;
                    }).length} Sections Active
                  </span>
                </div>
              </div>

              {/* Sections Matrix Table for this Teacher */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Class & Section (Wing)</th>
                      <th className="py-3 px-4 text-center">Class Teacher Assignment</th>
                      <th className="py-3 px-4 text-center">Attendance Control</th>
                      <th className="py-3 px-4 text-center">Marks Control</th>
                      <th className="py-3 px-4 text-center">Fees Control</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSections.map((sec) => {
                      const key = `${teacher.id}_${sec.id}`;
                      const p = permMap[key] || {
                        is_class_teacher: false,
                        can_manage_attendance: false,
                        can_manage_marks: false,
                        can_manage_fees: false
                      };

                      const hasAny = p.is_class_teacher || p.can_manage_attendance || p.can_manage_marks || p.can_manage_fees;

                      return (
                        <tr key={sec.id} className={`hover:bg-slate-50/80 transition-colors ${hasAny ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-3 px-4 font-black text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800">{sec.class_name}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                sec.wing === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {sec.wing}
                              </span>
                            </div>
                          </td>

                          {/* Is Class Teacher Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={p.is_class_teacher}
                                onChange={() => handleToggle(teacher.id, sec.id, 'is_class_teacher')}
                                className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-800"
                              />
                              <span className={`text-[11px] font-bold ${p.is_class_teacher ? 'text-emerald-900' : 'text-slate-400'}`}>
                                {p.is_class_teacher ? 'Class Teacher' : 'No'}
                              </span>
                            </label>
                          </td>

                          {/* Can Manage Attendance */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={p.can_manage_attendance}
                              onChange={() => handleToggle(teacher.id, sec.id, 'can_manage_attendance')}
                              className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-800"
                            />
                          </td>

                          {/* Can Manage Marks */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={p.can_manage_marks}
                              onChange={() => handleToggle(teacher.id, sec.id, 'can_manage_marks')}
                              className="w-4 h-4 text-blue-800 rounded border-slate-300 focus:ring-blue-800"
                            />
                          </td>

                          {/* Can Manage Fees */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={p.can_manage_fees}
                              onChange={() => handleToggle(teacher.id, sec.id, 'can_manage_fees')}
                              className="w-4 h-4 text-amber-700 rounded border-slate-300 focus:ring-amber-700"
                            />
                          </td>

                          {/* Quick Actions */}
                          <td className="py-3 px-4 text-right">
                            {hasAny ? (
                              <button
                                onClick={() => handleGrantAllForSection(teacher.id, sec.id, false)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] transition-all"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantAllForSection(teacher.id, sec.id, true)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition-all"
                              >
                                Grant Full Section
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
