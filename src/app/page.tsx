'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Calendar, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight,
  UserCheck,
  Star,
  Quote,
  Sparkle,
  Fingerprint,
  Bell,
  Sun,
  Shield,
  Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [content, setContent] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBoys: 0,
    totalGirls: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalClasses: 12,
    totalSections: 24
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentRes, statsRes] = await Promise.all([
          fetch('/api/public/content'),
          fetch('/api/public/stats')
        ]);
        if (contentRes.ok) {
          const cData = await contentRes.json();
          setContent(cData);
        }
        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData);
        }
      } catch (err) {
        console.error('Error loading public homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const settings = content?.settings || {};
  const institution = content?.institution || {
    name: 'Mifthahul Uloom Higher Secondary Madrassa',
    range: 'Vengara',
    rangeNumber: '50',
    madrassaNumber: '5090',
    location: 'Nedumparambu',
    classTimings: {
      session1: '6:15 AM – 7:30 AM',
      session2: '7:30 AM – 9:00 AM'
    }
  };
  const administration = content?.administration || {};
  const teachers = content?.teachers || [];
  const announcements = content?.announcements || [];
  const events = content?.events || [];
  const gallery = content?.gallery || [];
  const achievements = content?.achievements || [];

  return (
    <div className="flex flex-col min-w-full min-h-screen">
      <Navbar />

      {/* Top Notice */}
      {announcements.length > 0 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
          <div className="max-w-7xl mx-auto flex items-center gap-3 w-full overflow-hidden">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 text-amber-400 rounded text-[10px] uppercase font-bold shrink-0">
              <Bell className="w-3 h-3 animate-bounce" /> Latest Notice
            </span>
            <div className="truncate text-slate-950">
              <span className="font-bold">{announcements[0].title}:</span> {announcements[0].content}
            </div>
            <Link href="#announcements" className="ml-auto underline shrink-0 hover:opacity-80">
              View Notices →
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-emerald-950 text-white pt-14 pb-24 lg:pt-20 lg:pb-32 overflow-hidden islamic-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-emerald-950/80 to-emerald-950 pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Institution Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-700 text-amber-300 text-xs font-bold shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{institution.location}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-700 text-amber-300 text-xs font-bold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Madrassa No. {institution.madrassaNumber}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-700 text-amber-300 text-xs font-bold shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{institution.range} Range — No. {institution.rangeNumber}</span>
                </div>
              </div>

              <div className="font-serif text-2xl sm:text-3xl text-amber-300/90 tracking-wide">
                مدرسة مفتاح العلوم الثانوية العليا
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
                {institution.name}
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {settings.hero_subtitle || `${institution.location} • Madrassa No. ${institution.madrassaNumber} • ${institution.range} Range — No. ${institution.rangeNumber}`}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login?portal=student"
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>STUDENT PORTAL</span>
                </Link>

                <Link
                  href="/login?portal=staff"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 shadow-md flex items-center gap-2 transition-all hover:scale-105"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>STAFF / TEACHER PORTAL</span>
                </Link>

                <Link
                  href="/login?portal=office"
                  className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-emerald-200 font-bold text-xs border border-emerald-700/50 flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>OFFICE ERP</span>
                </Link>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-emerald-200/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Classes 1 to +2 (Boys & Girls Wings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Nominal ₹100/mo Fee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Sessions: 6:15 AM – 9:00 AM</span>
                </div>
              </div>
            </div>

            {/* Hero Right Column (Authentic Madrassa Building Photo) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-700/60 group bg-emerald-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.hero_image_url || '/uploads/hero/madrassa_building.jpg'}
                  alt="Mifthahul Uloom Higher Secondary Madrassa Campus"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/40 to-transparent flex flex-col justify-end p-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-[10px] uppercase tracking-wider w-fit mb-1.5 shadow">
                    <Building2 className="w-3 h-3" />
                    <span>Official Campus • {institution.location}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                    مدرسة مفتاح العلوم الثانوية العالية
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Madrassa No. {institution.madrassaNumber} • {institution.range} Range No. {institution.rangeNumber}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Official Class Timings Card Strip */}
      <section className="relative -mt-8 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Academic Schedule</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Official Class Timings
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Classes 1 to +2 operate on dual morning schedule
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
                <Sun className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">Morning Session 1</span>
                <div className="text-xl font-extrabold text-emerald-900 font-mono">
                  {institution.classTimings?.session1 || '6:15 AM – 7:30 AM'}
                </div>
                <p className="text-xs text-emerald-800">
                  Primary & Secondary Quran memorization, Tajweed, and initial core curriculum.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">Morning Session 2</span>
                <div className="text-xl font-extrabold text-amber-950 font-mono">
                  {institution.classTimings?.session2 || '7:30 AM – 9:00 AM'}
                </div>
                <p className="text-xs text-amber-900">
                  Secondary & Higher Secondary (+1 & +2) Fiqh, Tafseer, Arabic, and academic sciences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Mifthahul Uloom Institutional Section */}
      <section id="about" className="py-20 bg-[#fbfbf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Institutional Profile
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  About Mifthahul Uloom Higher Secondary Madrassa
                </h2>
              </div>

              {/* Metadata Highlights */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution</span>
                    <strong className="text-slate-900 font-bold">Mifthahul Uloom</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                    <strong className="text-slate-900 font-bold">{institution.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Madrassa No.</span>
                    <strong className="text-emerald-800 font-mono font-bold">{institution.madrassaNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Range & No.</span>
                    <strong className="text-amber-800 font-bold">{institution.range} (No. {institution.rangeNumber})</strong>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {settings.about_history || `Mifthahul Uloom Higher Secondary Madrassa in ${institution.location} (Madrassa No. ${institution.madrassaNumber}, ${institution.range} Range No. ${institution.rangeNumber}) stands as a beacon of Islamic learning, intellectual excellence, and spiritual refinement. The institution offers comprehensive education from Class 1 to +2 with separate wings for Boys and Girls.`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <div className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Vision
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {settings.about_vision || 'To develop a generation of pious, enlightened Islamic scholars and professionals equipped with spiritual wisdom.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span> Mission
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {settings.about_mission || 'Providing holistic Islamic education rooted in authentic Ahlus Sunnah scholarship alongside state-of-the-art secondary schooling.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sadr Message Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950 text-white shadow-xl relative overflow-hidden space-y-4 border border-emerald-800">
                <Quote className="w-20 h-20 text-emerald-900 absolute -bottom-4 -right-4 pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  {administration.sadr?.photoUrl || settings.principal_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={administration.sadr?.photoUrl || settings.principal_photo_url || '/uploads/principal/sadr_jabir_baqavi_nobg.png'}
                      alt={administration.sadr?.name || 'Sadr V. K. Jabir Baqavi'}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 bg-emerald-900 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-2xl shadow-md shrink-0">
                      {administration.sadr?.name?.charAt(0) || 'V'}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                      Sadr / Head of Madrassa
                    </div>
                    <h3 className="text-lg font-extrabold text-white">
                      {administration.sadr?.name || 'V. K. Jabir Baqavi'}
                    </h3>
                    <div className="text-xs text-emerald-300 font-semibold">
                      Class +2 Faculty
                    </div>
                  </div>
                </div>

                <blockquote className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed italic border-l-2 border-amber-400 pl-4">
                  "{settings.principal_message || 'In the name of Allah, Most Gracious, Most Merciful. Our sacred duty at Mifthahul Uloom is to nurture hearts with prophetic wisdom and elevate minds with academic eminence.'}"
                </blockquote>
              </div>
            </div>

          </div>

          {/* Administration & Leadership Section */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Governance</div>
              <h3 className="text-2xl font-extrabold text-slate-900">Administration & Management</h3>
              <p className="text-xs text-slate-500">Dedicated leadership steering institutional progress and scholastic integrity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* President */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 font-extrabold flex items-center justify-center text-xl mx-auto shadow-inner">
                  {administration.president?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{administration.president?.name || 'Alavi Haji'}</h4>
                  <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block mt-0.5">
                    {administration.president?.role || 'President'}
                  </span>
                </div>
                {administration.president?.phone && (
                  <div className="pt-2 text-xs font-mono text-slate-600 flex items-center justify-center gap-1.5 border-t border-slate-100">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{administration.president.phone}</span>
                  </div>
                )}
              </div>

              {/* Secretary */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 font-extrabold flex items-center justify-center text-xl mx-auto shadow-inner">
                  {administration.secretary?.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{administration.secretary?.name || 'Mansoor Thamanchery'}</h4>
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block mt-0.5">
                    {administration.secretary?.role || 'Secretary'}
                  </span>
                </div>
                {administration.secretary?.phone && (
                  <div className="pt-2 text-xs font-mono text-slate-600 flex items-center justify-center gap-1.5 border-t border-slate-100">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{administration.secretary.phone}</span>
                  </div>
                )}
              </div>

              {/* Sadr */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 hover:shadow-md transition-shadow">
                {administration.sadr?.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={administration.sadr.photoUrl}
                    alt={administration.sadr.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 bg-amber-50 mx-auto shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-xl mx-auto shadow-inner">
                    {administration.sadr?.name?.charAt(0) || 'V'}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{administration.sadr?.name || 'V. K. Jabir Baqavi'}</h4>
                  <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block mt-0.5">
                    {administration.sadr?.role || 'Sadr / Head of Madrassa'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Class +2 Faculty</span>
                </div>
                {administration.sadr?.phone && (
                  <div className="pt-2 text-xs font-mono text-slate-600 flex items-center justify-center gap-1.5 border-t border-slate-100">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>{administration.sadr.phone}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Our Teachers / Faculty Section */}
      <section id="faculty" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Sanad Scholars & Educators</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Our Teachers & Faculty Usthads
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Distinguished scholars dedicated to imparting authentic Islamic knowledge, Quranic sciences, and moral guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teachers.map((t: any) => (
              <div
                key={t.id}
                className="bg-[#fbfbf8] rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {t.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={t.photoUrl} alt={t.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 font-extrabold flex items-center justify-center text-base shadow">
                        {t.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <strong className="block text-sm font-extrabold text-slate-900 leading-tight">{t.name}</strong>
                      <span className="text-[11px] text-emerald-800 font-semibold">{t.designation}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-100 space-y-1 text-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Assigned Classes</div>
                    <div className="font-extrabold text-emerald-950 text-xs">
                      {t.assignedClasses || 'All Classes'}
                    </div>
                  </div>
                </div>

                {t.phone && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-[10px] font-semibold text-slate-400">Contact:</span>
                    <a href={`tel:${t.phone}`} className="font-mono text-emerald-800 font-bold hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{t.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Classes Structure */}
      <section id="classes" className="py-20 bg-[#fbfbf8] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Academic Program
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Class 1 to +2 Dual Wing System (Boys & Girls)
            </h2>
            <p className="text-sm text-slate-600">
              Structured into dedicated Boys and Girls sections with specialized class teachers and subject faculty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-4">
                1–5
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Primary Madrasa</h3>
              <p className="text-xs text-slate-500 mb-4">Classes 1 to 5 (Boys & Girls)</p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Quran Hifz & Basic Tajweed</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Fiqh, Aqeedah & Du'as</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Arabic Reading & English</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Mathematics & Environmental Science</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg mb-4">
                6–10
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Secondary Madrasa</h3>
              <p className="text-xs text-slate-500 mb-4">Classes 6 to 10 (Boys & Girls)</p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Quran Tafseer & Hadith Studies</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Arabic Grammar (Nahw & Sarf)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Secondary Science & Mathematics</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Islamic History & Da'wah Ethics</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-900 text-white shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg mb-4">
                +1/+2
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Higher Secondary</h3>
              <p className="text-xs text-emerald-300 mb-4">+1 and +2 Wings</p>
              <ul className="space-y-2 text-xs text-emerald-100">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Higher Islamic Jurisprudence (Fiqh/Usul)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Advanced Arabic Rhetoric (Balagha)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Science & Commerce Streams</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Leadership & Public Discourse</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section id="achievements" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Distinction & Excellence</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Student Achievements</h2>
            </div>
            <Link href="/login?portal=student" className="text-xs font-bold text-emerald-800 hover:underline">
              Student Certificates Portal →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((ach) => (
              <div key={ach.id} className="p-5 rounded-2xl bg-[#fbfbf8] border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                <div className="space-y-2">
                  {ach.certificate_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={ach.certificate_url} alt={ach.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      🏆 {ach.position}
                    </span>
                    <span className="text-slate-400 text-[11px]">{ach.date || '2026'}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{ach.title}</h3>
                  <div className="text-xs text-emerald-800 font-semibold">{ach.competition_event}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Student: <strong className="text-slate-800">{ach.student_name}</strong></span>
                  <span>{ach.class_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events & Announcements */}
      <section id="events" className="py-20 bg-[#fbfbf8] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Calendar</div>
                <h2 className="text-2xl font-extrabold text-slate-900">Upcoming Events & Majlis</h2>
              </div>

              <div className="space-y-4">
                {events.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start gap-4">
                    {ev.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full sm:w-28 h-24 object-cover rounded-xl shrink-0"
                      />
                    ) : (
                      <div className="w-full sm:w-28 h-24 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex flex-col items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">{ev.event_date}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        {ev.category || 'Madrassa Event'} • {ev.event_time || 'Morning'}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                      {ev.location && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                          <MapPin className="w-3 h-3" /> <span>{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="announcements" className="lg:col-span-5 space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Circulars</div>
                <h2 className="text-2xl font-extrabold text-slate-900">Official Notices</h2>
              </div>

              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                        {ann.target_audience || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400">{ann.published_at?.split(' ')[0] || 'Recent'}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{ann.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
