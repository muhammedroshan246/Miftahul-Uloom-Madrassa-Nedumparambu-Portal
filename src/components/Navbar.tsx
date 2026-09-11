'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Menu, 
  X, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  Award, 
  Calendar, 
  PhoneCall, 
  ChevronDown,
  LogIn,
  Fingerprint
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>('/uploads/branding/madrassa_logo.png');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    async function loadLogo() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.logo_url) {
            setLogoUrl(data.settings.logo_url);
          }
        }
      } catch (e) {
        // silent fallback
      }
    }
    loadLogo();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-emerald-950 text-white py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo & Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt="Mifthahul Uloom Logo"
              className="w-11 h-11 rounded-xl object-contain bg-white/90 p-1 border border-amber-400 shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-700 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-emerald-900 rounded-[10px] flex items-center justify-center text-amber-300">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
          )}
          <div>
            <div className={`font-bold text-base sm:text-lg leading-tight tracking-tight ${scrolled ? 'text-emerald-950' : 'text-white'}`}>
              Mifthahul Uloom
            </div>
            <div className="text-[11px] font-medium tracking-wide text-amber-500 flex items-center gap-1.5">
              <span>Higher Secondary Madrassa</span>
              <span className="opacity-60 hidden sm:inline">• مدرسة مفتاح العلوم</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link href="#about" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>About</Link>
          <Link href="#faculty" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Faculty</Link>
          <Link href="#classes" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Classes</Link>
          <Link href="#achievements" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Achievements</Link>
          <Link href="#events" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Events</Link>
          <Link href="#gallery" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Gallery</Link>
          <Link href="#announcements" className={`transition-colors hover:text-amber-500 ${scrolled ? 'text-slate-700' : 'text-emerald-100'}`}>Notices</Link>
        </nav>

        {/* Portals Dropdown / Login CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setPortalOpen(!portalOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portals Login</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {portalOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setPortalOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Your Portal
                </div>
                <Link href="/login?portal=student" className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 transition-colors">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div>Student & Parent Portal</div>
                    <div className="text-[10px] text-slate-400 font-normal">Results, Fees, Attendance, Profile</div>
                  </div>
                </Link>
                <Link href="/login?portal=staff" className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div>
                    <div>Staff / Teacher Portal</div>
                    <div className="text-[10px] text-slate-400 font-normal">Attendance & Marks Entry</div>
                  </div>
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link href="/login?portal=office" className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-purple-50 hover:text-purple-800 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <div>
                    <div>Office / Admin ERP</div>
                    <div className="text-[10px] text-slate-400 font-normal">Complete Madrassa Management</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link href="/login" className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
            Login
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-emerald-900'}`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-white text-slate-900 border-t border-slate-200 px-4 py-4 space-y-3 shadow-xl">
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100">
            <Link href="/login?portal=student" className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] font-bold flex flex-col items-center gap-1 text-center">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Student & Family
            </Link>
            <Link href="/login?portal=staff" className="p-2.5 rounded-lg bg-blue-50 text-blue-900 text-[11px] font-bold flex flex-col items-center gap-1 text-center">
              <BookOpen className="w-4 h-4 text-blue-600" /> Staff / Usthad
            </Link>
            <Link href="/login?portal=office" className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-[11px] font-bold flex flex-col items-center gap-1 text-center">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Office ERP
            </Link>
          </div>
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link href="#about" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">About Madrassa</Link>
            <Link href="#academics" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Academics & Curriculum</Link>
            <Link href="#classes" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Classes (Boys & Girls)</Link>
            <Link href="#achievements" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Student Achievements</Link>
            <Link href="#events" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Upcoming Events</Link>
            <Link href="#gallery" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Campus Photo Gallery</Link>
            <Link href="#announcements" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Announcements & Notices</Link>
            <Link href="#contact" onClick={() => setIsOpen(false)} className="py-1.5 px-2 hover:bg-slate-50 rounded">Contact & Location</Link>
          </div>
        </div>
      )}
    </header>
  );
}
