'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Save, CheckCircle2, Building2, Phone, Mail, MapPin, Sparkles, Star, ShieldCheck } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function WebsiteContentCMSPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (k: string, v: string) => {
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setMsg('Website content, branding images & settings updated live!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-emerald-800" />
          <span>Website Content & Visual Branding CMS</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload and manage official logo, homepage hero photo, principal message, heritage history, vision, and contact details.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 text-xs">
        
        {/* Section 1: Official Logo & Hero Banner Images */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">1. Official Branding & Hero Images</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ImageUploader
                category="branding"
                label="Madrassa Official Logo"
                helperText="Appears on Navbar, Footer & Marksheets • PNG / WebP recommended"
                value={settings.logo_url || ''}
                onChange={(url) => handleChange('logo_url', url)}
                aspectRatio="square"
              />
            </div>
            <div>
              <ImageUploader
                category="hero"
                label="Homepage Hero / Campus Architecture Photo"
                helperText="Appears on Public Website Hero Section • High Resolution (JPG / WebP)"
                value={settings.hero_image_url || ''}
                onChange={(url) => handleChange('hero_image_url', url)}
                aspectRatio="banner"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Madrassa Official Name</label>
              <input
                type="text"
                value={settings.school_name || ''}
                onChange={(e) => handleChange('school_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Arabic Calligraphy Subtitle</label>
              <input
                type="text"
                value={settings.school_arabic_name || ''}
                onChange={(e) => handleChange('school_arabic_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none font-serif text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hero Main Heading</label>
            <input
              type="text"
              value={settings.hero_title || ''}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none text-sm font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hero Description / Tagline</label>
            <textarea
              rows={2}
              value={settings.hero_subtitle || ''}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
            ></textarea>
          </div>
        </div>

        {/* Section 2: Heritage, Vision & Mission */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">2. About Heritage, Vision & Mission</h2>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Four Decades Heritage History</label>
            <textarea
              rows={3}
              value={settings.about_history || ''}
              onChange={(e) => handleChange('about_history', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none leading-relaxed"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Institutional Vision</label>
              <textarea
                rows={3}
                value={settings.about_vision || ''}
                onChange={(e) => handleChange('about_vision', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Institutional Mission</label>
              <textarea
                rows={3}
                value={settings.about_mission || ''}
                onChange={(e) => handleChange('about_mission', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Leadership & Principal */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">3. Principal’s Desk & Photo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <ImageUploader
                category="principal"
                label="Principal / Head Portrait"
                helperText="Official portrait photo (Square / Portrait)"
                value={settings.principal_photo_url || ''}
                onChange={(url) => handleChange('principal_photo_url', url)}
                aspectRatio="square"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Principal Full Name</label>
                <input
                  type="text"
                  value={settings.principal_name || ''}
                  onChange={(e) => handleChange('principal_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation Title</label>
                <input
                  type="text"
                  value={settings.principal_title || ''}
                  onChange={(e) => handleChange('principal_title', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Principal’s Welcome Message Quote</label>
                <textarea
                  rows={3}
                  value={settings.principal_message || ''}
                  onChange={(e) => handleChange('principal_message', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contact Information */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Phone className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">4. Official Contact & Location</h2>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Campus Physical Address</label>
            <input
              type="text"
              value={settings.contact_address || ''}
              onChange={(e) => handleChange('contact_address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Helpdesk Numbers</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish Live CMS</span>
          </button>
        </div>
      </form>
    </div>
  );
}