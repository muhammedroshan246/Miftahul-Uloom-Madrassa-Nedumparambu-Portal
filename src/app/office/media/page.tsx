'use client';

import React, { useState, useEffect } from 'react';
import { 
  Images, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Star, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Plus, 
  Filter, 
  RefreshCw, 
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

const CATEGORIES = [
  { id: 'all', name: 'All Media Assets', icon: Images },
  { id: 'branding', name: 'Madrasa Logo & Seal', icon: Star },
  { id: 'hero', name: 'Homepage Hero & Campus', icon: Sparkles },
  { id: 'principal', name: 'Principal Desk Photo', icon: ShieldCheck },
  { id: 'gallery', name: 'Campus Gallery', icon: Images },
  { id: 'events', name: 'Event Banners', icon: Images },
  { id: 'teachers', name: 'Faculty & Staff', icon: ShieldCheck },
  { id: 'achievements', name: 'Certificates & Laurels', icon: Star },
  { id: 'students', name: 'Private Student Photos', icon: Lock, isPrivate: true },
];

export default function OfficeMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media/manage');
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        setSettings(data.settings || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleSetActive = async (key: string, url: string) => {
    try {
      const res = await fetch('/api/media/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_ACTIVE_ASSET', key, url })
      });
      if (res.ok) {
        setMsg(`Successfully set as active ${key.replace('_url', '').replace('_', ' ')}!`);
        loadMedia();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (category: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await fetch(`/api/media/manage?category=${category}&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMsg('Image removed successfully');
        loadMedia();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredMedia = activeTab === 'all' 
    ? media 
    : media.filter(m => m.category === activeTab);

  const totalPublicSize = media
    .filter(m => !m.isPrivate)
    .reduce((acc, m) => acc + (m.size || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Images className="w-7 h-7 text-emerald-800" />
            <span>Media & Image Assets Library</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized repository for website logos, hero banners, faculty portraits, campus gallery, and secure student photos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            {media.length} Total Files • {(totalPublicSize / (1024 * 1024)).toFixed(2)} MB Public
          </span>
          <button
            onClick={loadMedia}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
            title="Refresh Media List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Quick Upload Box for Active Category */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-800" />
            <span>Quick Upload to {activeTab === 'all' ? 'Gallery' : activeTab.toUpperCase()}</span>
          </span>
          {activeTab === 'students' && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3" /> Private Protected Storage
            </span>
          )}
        </div>
        
        <ImageUploader
          category={activeTab === 'all' ? 'gallery' : (activeTab as any)}
          label=""
          helperText={`Upload ${activeTab} image • Max 5MB • JPG, PNG, WebP`}
          onUploadComplete={() => {
            setMsg('New image uploaded & cataloged!');
            loadMedia();
            setTimeout(() => setMsg(''), 3000);
          }}
          onChange={() => {}}
        />
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = cat.id === 'all' ? media.length : media.filter(m => m.category === cat.id).length;
          const isSelected = activeTab === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'bg-emerald-900 text-amber-300 shadow-md scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isSelected ? 'bg-emerald-800 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold">
          Scanning media libraries...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FolderImage className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No images in this category yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Use the upload box above to drag and drop or select images to store them in the {activeTab} section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item, idx) => {
            const isLogoActive = settings['logo_url'] === item.url;
            const isHeroActive = settings['hero_image_url'] === item.url;
            const isPrincipalActive = settings['principal_photo_url'] === item.url;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video sm:aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-mono uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    {item.isPrivate && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[9px] font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </div>

                  {/* Active Setting Ribbon */}
                  {(isLogoActive || isHeroActive || isPrincipalActive) && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-800 text-amber-300 text-[9px] font-bold shadow flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      <span>{isLogoActive ? 'Active Logo' : isHeroActive ? 'Active Hero' : 'Active Principal'}</span>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewItem(item)}
                      title="Preview Full Image"
                      className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-all shadow"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      title="Copy URL"
                      className="p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all shadow"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.category, item.filename)}
                      title="Delete Image"
                      className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info & Setting Triggers */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{(item.size / 1024).toFixed(1)} KB</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* 1-Click Set Active Website Asset */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                    {item.category === 'branding' && !isLogoActive && (
                      <button
                        onClick={() => handleSetActive('logo_url', item.url)}
                        className="w-full py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-colors"
                      >
                        Set as Active Logo
                      </button>
                    )}
                    {item.category === 'hero' && !isHeroActive && (
                      <button
                        onClick={() => handleSetActive('hero_image_url', item.url)}
                        className="w-full py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-colors"
                      >
                        Set as Homepage Hero
                      </button>
                    )}
                    {item.category === 'principal' && !isPrincipalActive && (
                      <button
                        onClick={() => handleSetActive('principal_photo_url', item.url)}
                        className="w-full py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-colors"
                      >
                        Set as Principal Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Zoom Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col items-center space-y-4">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">{previewItem.filename}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{previewItem.url}</p>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewItem.url}
              alt={previewItem.filename}
              className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-md"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => copyToClipboard(previewItem.url)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedUrl === previewItem.url ? 'Copied!' : 'Copy Reference URL'}</span>
              </button>
              {previewItem.category === 'branding' && (
                <button
                  onClick={() => {
                    handleSetActive('logo_url', previewItem.url);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
                >
                  Set as Active Website Logo
                </button>
              )}
              {previewItem.category === 'hero' && (
                <button
                  onClick={() => {
                    handleSetActive('hero_image_url', previewItem.url);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
                >
                  Set as Active Homepage Hero
                </button>
              )}
              {previewItem.category === 'principal' && (
                <button
                  onClick={() => {
                    handleSetActive('principal_photo_url', previewItem.url);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
                >
                  Set as Active Principal Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}