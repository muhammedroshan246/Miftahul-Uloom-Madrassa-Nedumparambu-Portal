'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Archive, 
  Eye, 
  Clock, 
  X, 
  AlertCircle,
  Filter,
  Users,
  Building2,
  Calendar
} from 'lucide-react';

export default function OfficeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Archived' | 'Draft'>('Published');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editNotice, setEditNotice] = useState<any>(null);
  const [archiveModal, setArchiveModal] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Medium',
    targetAudience: 'All',
    status: 'Published'
  });

  const loadNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (audienceFilter !== 'All') params.set('audience', audienceFilter);

      const res = await fetch(`/api/announcements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [statusFilter, audienceFilter]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ title: '', content: '', priority: 'Medium', targetAudience: 'All', status: 'Published' });
        setMsg('Notice created and published successfully!');
        loadNotices();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editNotice)
      });
      if (res.ok) {
        setEditNotice(null);
        setMsg('Notice updated successfully!');
        loadNotices();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveNotice = async (id: number) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}&action=archive`, { method: 'DELETE' });
      if (res.ok) {
        setArchiveModal(null);
        setMsg('Notice archived and removed from public view.');
        loadNotices();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-800" />
            <span>Notices & Circulars Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast administrative notices, majlis circulars, and exam schedules to targeted student, parent, and staff portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD NOTICE</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter Bar: Status Tabs + Audience */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setStatusFilter('Published')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'Published' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('Draft')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'Draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setStatusFilter('Archived')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'Archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Archived
          </button>
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Target Audience:</span>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="All">Everyone (All Portals)</option>
            <option value="Students">Students Only</option>
            <option value="Parents">Parents Only</option>
            <option value="Staff">Faculty / Usthads Only</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading notices...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <div>No notices found in {statusFilter} status.</div>
          </div>
        ) : (
          announcements.map((item) => {
            const isArchived = item.is_published === 2;
            const isDraft = item.is_published === 0;

            return (
              <div key={item.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.priority} Priority
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.target_audience}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isArchived ? 'bg-slate-100 text-slate-500' : isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isArchived ? 'Archived' : isDraft ? 'Draft' : 'Published'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.published_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditNotice({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        priority: item.priority,
                        targetAudience: item.target_audience,
                        status: isArchived ? 'Archived' : isDraft ? 'Draft' : 'Published'
                      })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {!isArchived && (
                      <button
                        onClick={() => setArchiveModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Archive Confirmation Modal */}
      {archiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Archive Notice?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to archive <strong>"{archiveModal.title}"</strong>? It will immediately stop displaying on public portals.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setArchiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleArchiveNotice(archiveModal.id)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow"
              >
                Confirm & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">+ Add New Notice</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mid-Term Examination Schedule Announcement"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Description / Content</label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write full circular details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="All">Everyone (All)</option>
                    <option value="Students">Students</option>
                    <option value="Parents">Parents</option>
                    <option value="Staff">Faculty Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Published">Publish Now</option>
                    <option value="Draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {editNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Edit Notice</h3>
              <button onClick={() => setEditNotice(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={editNotice.title}
                  onChange={(e) => setEditNotice({ ...editNotice, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Description / Content</label>
                <textarea
                  rows={4}
                  value={editNotice.content}
                  onChange={(e) => setEditNotice({ ...editNotice, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editNotice.priority}
                    onChange={(e) => setEditNotice({ ...editNotice, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={editNotice.targetAudience}
                    onChange={(e) => setEditNotice({ ...editNotice, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="All">Everyone (All)</option>
                    <option value="Students">Students</option>
                    <option value="Parents">Parents</option>
                    <option value="Staff">Faculty Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editNotice.status}
                    onChange={(e) => setEditNotice({ ...editNotice, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditNotice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
