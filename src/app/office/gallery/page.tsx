'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, CheckCircle2, Building2, X, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function OfficeGalleryPage() {
  const [gallery, setGallery] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Campus');
  const [imageUrl, setImageUrl] = useState('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const res = await fetch('/api/gallery');
    if (res.ok) {
      const data = await res.json();
      setGallery(data.gallery || []);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please upload or select an image file');
      return;
    }
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, imageUrl })
      });
      if (res.ok) {
        setShowAdd(false);
        setTitle('');
        setImageUrl('');
        setMsg('Photo added to campus gallery!');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this photo from campus gallery?')) return;
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Photo removed from gallery');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-emerald-800" />
            <span>Campus Photo Gallery CMS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage public media, campus architecture, Quran conference, and classroom photos.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Photo Item</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-2 group hover:shadow-md transition-all">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {item.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Building2 className="w-8 h-8 text-emerald-800" />
              )}

              <button
                onClick={() => handleDelete(item.id)}
                title="Delete Photo"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 truncate" title={item.title}>{item.title}</div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="font-semibold text-emerald-800">{item.category}</span>
                <span className="text-slate-400">Published</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Photo to Gallery</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Caption / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Secondary Science Wing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                >
                  <option value="Campus">Campus Infrastructure</option>
                  <option value="Events">Annual Events & Majlis</option>
                  <option value="Academics">Classroom & Labs</option>
                  <option value="Sports">Festivals & Sports</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <ImageUploader
                  category="gallery"
                  label="Gallery Image Photo"
                  helperText="Drag & drop or click • Max 5MB (JPG, PNG, WebP)"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  aspectRatio="banner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Add to Gallery</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}