
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/branding/madrassa_logo.png"
                alt="LOGO OF MDRASSA"
                className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-amber-400/80 shadow-md shrink-0"
              />
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
              <li><Link href="/login?portal=student" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Student & Parent Portal</Link></li>
              <li><Link href="/login?portal=staff" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Usthad / Staff Attendance</Link></li>
              <li><Link href="/login?portal=office" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Head & Office ERP Portal</Link></li>
              <li><Link href="/office/students" className="hover:text-amber-400 transition-colors flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Class 1 to +2 Census</Link></li>
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
                <span>Nedumparambu, Vengara (Range No. 50, Madrassa No. 5090)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 95441 82665 / +91 95673 33332</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>office@mifthahululoom.edu.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Class Timings: 6:15 AM – 9:00 AM</span>
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
