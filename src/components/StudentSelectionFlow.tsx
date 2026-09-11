'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  User, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ClassItem {
  id: number;
  name: string;
  numeric_order: number;
  total_students: number;
  boys_count: number;
  girls_count: number;
}

interface SectionItem {
  section_id: number;
  class_id: number;
  section_name: string;
  wing: string;
  student_count: number;
}

interface StudentItem {
  id: number;
  admission_no: string;
  roll_no: number;
  full_name: string;
  gender: string;
  photo_url?: string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
}

export default function StudentSelectionFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load: fetch classes and sections
  useEffect(() => {
    async function loadClasses() {
      setLoadingData(true);
      try {
        const res = await fetch('/api/public/student-roster');
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
          setSections(data.sections || []);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadClasses();
  }, []);

  // Step 1 -> Step 2
  const handleSelectClass = (cls: ClassItem) => {
    setSelectedClass(cls);
    setSelectedSection(null);
    setSearchQuery('');
    setStep(2);
  };

  // Step 2 -> Step 3
  const handleSelectSection = async (sec: SectionItem) => {
    setSelectedSection(sec);
    setSearchQuery('');
    setLoadingStudents(true);
    setStep(3);

    try {
      const res = await fetch(`/api/public/student-roster?sectionId=${sec.section_id}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Step 3: Login as Student
  const handleStudentLogin = async (student: StudentItem) => {
    setLoggingInId(student.id);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/student-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open student dashboard');
      }

      // Successful login -> route to student dashboard
      window.location.href = data.redirect || '/student';
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to open portal');
      setLoggingInId(null);
    }
  };

  // Filter sections for the selected class
  const classSections = selectedClass 
    ? sections.filter(s => s.class_id === selectedClass.id && s.student_count > 0)
    : [];

  // Filter students based on search
  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = s.full_name?.toLowerCase().includes(q);
    const rollMatch = String(s.roll_no).includes(q) || String(s.roll_no).padStart(2, '0').includes(q);
    const admMatch = s.admission_no?.toLowerCase().includes(q);
    return nameMatch || rollMatch || admMatch;
  });

  if (loadingData) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200/80 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Madrassa Classes & Sections...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
        
        {/* ========================================================= */}
        {/* STEP 1: SELECT CLASS */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>Step 1 of 3</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Select Your Class
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select your enrolled class below to find your name and access your student marks, attendance, and fee receipts.
              </p>
            </div>

            {/* 12 Classes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className="group relative p-4 rounded-2xl border-2 border-slate-200/90 bg-slate-50 hover:bg-emerald-950 hover:border-emerald-900 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between min-h-[95px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900 group-hover:text-amber-400 transition-colors">
                      {cls.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white group-hover:bg-emerald-900/80 text-[10px] font-bold text-emerald-800 group-hover:text-emerald-200 border border-slate-200 group-hover:border-emerald-800 transition-colors">
                      {cls.total_students} Students
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
              No password needed • Select your class to continue
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SELECT SECTION (BOYS / GIRLS) */}
        {/* ========================================================= */}
        {step === 2 && selectedClass && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Change Class</span>
              </button>

              <div className="px-3 py-1 rounded-full bg-emerald-950 text-amber-400 font-black text-xs">
                {selectedClass.name}
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Step 2 of 3</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Select Your Section
              </h2>
              <p className="text-xs text-slate-500">
                Choose your gender wing in <strong className="text-slate-800">{selectedClass.name}</strong>
              </p>
            </div>

            {/* Boys & Girls Big Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {classSections.map((sec) => {
                const isBoys = sec.wing === 'Boys';
                return (
                  <button
                    key={sec.section_id}
                    onClick={() => handleSelectSection(sec)}
                    className={`group p-6 rounded-3xl border-2 text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between min-h-[140px] ${
                      isBoys 
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 hover:bg-blue-900 hover:border-blue-900' 
                        : 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-pink-50/50 hover:bg-rose-950 hover:border-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                          isBoys ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {isBoys ? 'B' : 'G'}
                        </div>
                        <div>
                          <div className="text-xl font-black text-slate-900 group-hover:text-white transition-colors">
                            {sec.wing} Wing
                          </div>
                          <div className={`text-xs font-semibold ${isBoys ? 'text-blue-700 group-hover:text-blue-200' : 'text-rose-700 group-hover:text-rose-200'}`}>
                            {selectedClass.name} — {sec.wing}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 group-hover:border-white/20 pt-3">
                      <span className="text-xs font-black text-slate-700 group-hover:text-white">
                        {sec.student_count} Students Enrolled
                      </span>
                      <span className="text-xs font-bold text-amber-600 group-hover:text-amber-300">
                        View Student List &rarr;
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SELECT STUDENT */}
        {/* ========================================================= */}
        {step === 3 && selectedClass && selectedSection && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Navigation Breadcrumbs & Back Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Section</span>
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium"
                >
                  Class 1–+2
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-950 text-amber-400 font-black text-xs">
                  {selectedClass.name} • {selectedSection.wing}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                  {students.length} Students
                </span>
              </div>
            </div>

            {/* Title & Instructions */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Select Your Name
              </h2>
              <p className="text-xs text-slate-500">
                Tap on your card below to open your student dashboard.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Real-Time Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by student name or roll number (e.g. 05 or Ayaz)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-16 py-2.5 rounded-2xl border border-slate-300 font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5 rounded bg-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Student Cards List */}
            {loadingStudents ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs font-bold text-slate-500">Loading student roster...</div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No student found matching "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredStudents.map((st) => {
                  const isLogging = loggingInId === st.id;
                  const rollStr = String(st.roll_no).padStart(2, '0');
                  
                  return (
                    <button
                      key={st.id}
                      disabled={isLogging}
                      onClick={() => handleStudentLogin(st)}
                      className={`group p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3 ${
                        isLogging 
                          ? 'bg-emerald-900 border-emerald-900 text-white' 
                          : 'bg-white border-slate-200/90 hover:bg-emerald-950 hover:border-emerald-900 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Student Avatar / Photo */}
                        {st.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={st.photo_url}
                            alt={st.full_name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl font-black text-xs flex items-center justify-center shadow-sm shrink-0 ${
                            st.gender === 'Boys' 
                              ? 'bg-blue-100 text-blue-900 group-hover:bg-amber-400 group-hover:text-slate-950' 
                              : 'bg-rose-100 text-rose-900 group-hover:bg-amber-400 group-hover:text-slate-950'
                          }`}>
                            {st.full_name.charAt(0)}
                          </div>
                        )}

                        {/* Name & Details */}
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 group-hover:bg-amber-400 group-hover:text-slate-950 font-black text-[10px]">
                              #{rollStr}
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 font-mono truncate">
                              {st.admission_no}
                            </span>
                          </div>
                          
                          <div className="font-extrabold text-xs text-slate-900 group-hover:text-white truncate mt-0.5">
                            {st.full_name}
                          </div>
                        </div>
                      </div>

                      {/* Action Spinner or Arrow */}
                      <div className="shrink-0">
                        {isLogging ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-800 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
