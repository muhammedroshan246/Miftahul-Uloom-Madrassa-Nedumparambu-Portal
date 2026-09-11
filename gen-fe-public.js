const fs = require('fs');
const path = require('path');
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

ensureDir('src/app');
ensureDir('src/components');

// 1. src/app/globals.css
fs.writeFileSync('src/app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --primary: #064e3b;
    --primary-dark: #022c22;
    --accent-gold: #d97706;
    --bg-cream: #fbfbf8;
  }

  body {
    background-color: #fbfbf8;
    color: #0f172a;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}

/* Subtle Islamic Star Lattice / Arabesque Background */
.islamic-pattern {
  background-color: #064e3b;
  background-image: radial-gradient(rgba(217, 119, 6, 0.15) 1px, transparent 0);
  background-size: 24px 24px;
}

.islamic-subtle-bg {
  background-color: #fbfbf8;
  background-image: radial-gradient(rgba(6, 78, 59, 0.04) 1.5px, transparent 0);
  background-size: 20px 20px;
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Print Rules for Official Marksheets and Receipts */
@media print {
  body {
    background: #ffffff !important;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
  .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
    box-shadow: none !important;
  }
}
`);

// 2. src/app/layout.tsx
fs.writeFileSync('src/app/layout.tsx', `
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mifthahul Uloom Higher Secondary Madrassa | Official Portal & ERP',
  description: 'A premier center of authentic Islamic knowledge integrated with high-caliber modern higher secondary education.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col antialiased text-slate-900 bg-[#fbfbf8]">
        {children}
      </body>
    </html>
  );
}
`);

// 3. src/components/Navbar.tsx
fs.writeFileSync('src/components/Navbar.tsx', `
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={\`sticky top-0 z-50 transition-all duration-300 \${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-emerald-950 text-white py-4'}\`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo & Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-700 p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-emerald-900 rounded-[10px] flex items-center justify-center text-amber-300">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className={\`font-bold text-base sm:text-lg leading-tight tracking-tight \${scrolled ? 'text-emerald-950' : 'text-white'}\`}>
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
          <Link href="#about" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>About</Link>
          <Link href="#academics" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Academics</Link>
          <Link href="#classes" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Classes</Link>
          <Link href="#achievements" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Achievements</Link>
          <Link href="#events" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Events</Link>
          <Link href="#gallery" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Gallery</Link>
          <Link href="#announcements" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Notices</Link>
          <Link href="#contact" className={\`transition-colors hover:text-amber-500 \${scrolled ? 'text-slate-700' : 'text-emerald-100'}\`}>Contact</Link>
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
                    <div>Student Portal</div>
                    <div className="text-[10px] text-slate-400 font-normal">Results, Fees, Attendance</div>
                  </div>
                </Link>
                <Link href="/login?portal=parent" className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Parent Portal</div>
                    <div className="text-[10px] text-slate-400 font-normal">Multi-Child Progress & Fees</div>
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
            className={\`p-2 rounded-lg \${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-emerald-900'}\`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-white text-slate-900 border-t border-slate-200 px-4 py-4 space-y-3 shadow-xl">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            <Link href="/login?portal=student" className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Student Login
            </Link>
            <Link href="/login?portal=parent" className="p-2.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Parent Login
            </Link>
            <Link href="/login?portal=staff" className="p-2.5 rounded-lg bg-blue-50 text-blue-900 text-xs font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Staff Portal
            </Link>
            <Link href="/login?portal=office" className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-xs font-bold flex items-center gap-2">
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
`);

// 4. src/components/Footer.tsx
fs.writeFileSync('src/components/Footer.tsx', `
import React from 'react';
import Link from 'next/link';
import { GraduationCap, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-16 pb-8 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: About & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-600 p-0.5">
                <div className="w-full h-full bg-emerald-900 rounded-[10px] flex items-center justify-center text-amber-300">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="font-bold text-lg text-white leading-tight">Mifthahul Uloom</div>
                <div className="text-xs text-amber-400 font-medium">Higher Secondary Madrassa</div>
              </div>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Nurturing a righteous, intellectually brilliant generation grounded in classical Quranic and Hadith scholarship integrated with modern higher secondary disciplines.
            </p>
            <div className="font-serif text-sm text-amber-300/90 pt-1">
              مدرسة مفتاح العلوم الثانوية العليا - كوزيكود
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <div className="font-bold text-sm text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              Institution
            </div>
            <ul className="space-y-2 text-xs text-emerald-200/90">
              <li><Link href="#about" className="hover:text-amber-400 transition-colors">About Our Heritage</Link></li>
              <li><Link href="#academics" className="hover:text-amber-400 transition-colors">Curriculum & Subjects</Link></li>
              <li><Link href="#classes" className="hover:text-amber-400 transition-colors">Class 1 to +2 Structure</Link></li>
              <li><Link href="#achievements" className="hover:text-amber-400 transition-colors">Hall of Fame & Awards</Link></li>
              <li><Link href="#events" className="hover:text-amber-400 transition-colors">Upcoming Events & Majlis</Link></li>
              <li><Link href="#gallery" className="hover:text-amber-400 transition-colors">Campus Photo Gallery</Link></li>
            </ul>
          </div>

          {/* Col 3: Portal Access */}
          <div className="space-y-3">
            <div className="font-bold text-sm text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              Management Portals
            </div>
            <ul className="space-y-2 text-xs text-emerald-200/90">
              <li><Link href="/login?portal=student" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Student Marksheet & Fees</Link></li>
              <li><Link href="/login?portal=parent" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Parent Multi-Child Portal</Link></li>
              <li><Link href="/login?portal=staff" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Usthad / Staff Attendance</Link></li>
              <li><Link href="/login?portal=office" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Head & Office ERP Portal</Link></li>
              <li><Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Biometric / Passkey Login</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Hours */}
          <div className="space-y-3">
            <div className="font-bold text-sm text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              Office & Helpdesk
            </div>
            <div className="space-y-2.5 text-xs text-emerald-200/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Madrassa Road, Kuttichira, Kozhikode, Kerala 673001</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 495 272 8840 / +91 98470 11223</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>office@mifthahululoom.edu.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mon – Sat: 7:30 AM – 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-emerald-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/80 gap-3">
          <div>
            © {new Date().getFullYear()} Mifthahul Uloom Higher Secondary Madrassa. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Monthly Fee Standard: ₹100/mo</span>
            <span>•</span>
            <span>Biometric Passkey Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
`);

console.log('globals.css, layout.tsx, Navbar.tsx, and Footer.tsx written successfully');
