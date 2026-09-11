'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, MapPin, X, Trash2, Image as ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function OfficeEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-09-05');
  const [eventTime, setEventTime] = useState('09:00 AM');
  const [location, setLocation] = useState('Madrassa Main Auditorium');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events || []);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, eventDate, eventTime, location, description, imageUrl })
      });
      if (res.ok) {
        setShowAdd(false);
        setTitle('');
        setDescription('');
        setImageUrl('');
        setMsg('Event added to institution calendar!');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this event from calendar?')) return;
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Event removed from calendar');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-800" />
            <span>Events & Majlis Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic events, parent-teacher majlis, and Islamic fest schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Calendar Event</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="space-y-4">
        {events.map((ev) => (
          <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-start gap-4 group hover:shadow-md transition-all">
            {ev.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={ev.image_url}
                alt={ev.title}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-emerald-900 text-white flex flex-col items-center justify-center shrink-0 text-center shadow-sm">
                <Calendar className="w-5 h-5 text-amber-400 mb-0.5" />
                <span className="text-[10px] font-bold text-amber-300">{ev.event_date}</span>
              </div>
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm text-slate-900">{ev.title}</h3>
                <button
                  onClick={() => handleDelete(ev.id)}
                  title="Delete Event"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{ev.event_date}</span>
                {ev.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {ev.event_time}</span>}
                {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {ev.location}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Calendar Event</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Meelad Conference"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Madrassa Main Auditorium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <ImageUploader
                  category="events"
                  label="Event Banner / Poster Photo"
                  helperText="Drag & drop or click • Max 5MB (JPG, PNG, WebP)"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  aspectRatio="banner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Publish Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}