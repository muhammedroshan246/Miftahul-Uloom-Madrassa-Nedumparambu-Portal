'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  CheckCircle2, 
  X, 
  Trash2, 
  Image as ImageIcon,
  Filter,
  Trophy,
  Star,
  Users,
  School
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function OfficeAchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'STUDENT' | 'CLASS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('1st Prize');
  const [category, setCategory] = useState('Quran');
  const [competitionEvent, setCompetitionEvent] = useState("State Level Qira'at Competition");
  const [date, setDate] = useState('2026-07-20');
  const [description, setDescription] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/achievements'),
        fetch('/api/students?limit=200')
      ]);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAchievements(aData.achievements || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
        if (sData.students?.length > 0 && !selectedStudent) {
          setSelectedStudent(String(sData.students[0].id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select an enrolled student');
      return;
    }
    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          title: `[${category}] ${title}`,
          competitionEvent,
          position,
          date,
          description,
          certificateUrl
        })
      });
      if (res.ok) {
        setShowAdd(false);
        setTitle('');
        setDescription('');
        setCertificateUrl('');
        setMsg('Achievement and certificate published successfully!');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    'Quran',
    'Hadith',
    'Arabic',
    'Islamic Studies',
    'Academic',
    'Sports',
    'Arts',
    'Speech',
    'Debate',
    'Other'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Student Hall of Fame & Achievements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Quran recitation laurels, Hadith memorization awards, and state-level competition medals.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ ADD ACHIEVEMENT</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Top Filter Buttons */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'ALL' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            [ ALL ACHIEVEMENTS ]
          </button>
          <button
            onClick={() => setTab('STUDENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'STUDENT' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            [ STUDENT ACHIEVEMENTS ]
          </button>
          <button
            onClick={() => setTab('CLASS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'CLASS' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            [ CLASS ACHIEVEMENTS ]
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading achievements...</span>
          </div>
        ) : achievements.length === 0 ? (
          <div className="col-span-3 bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <div>No achievements found. Click [+ ADD ACHIEVEMENT] to create one.</div>
          </div>
        ) : (
          achievements.map((a) => (
            <div key={a.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              
              {a.certificate_url ? (
                <div className="relative h-44 bg-slate-950 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.certificate_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] shadow">
                    {a.position}
                  </div>
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-amber-500/20 to-emerald-900/30 p-4 flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xl shadow">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow">
                    {a.position}
                  </span>
                </div>
              )}

              <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{a.title}</h3>
                  <div className="text-xs font-semibold text-emerald-800">{a.competition_event}</div>
                  <p className="text-xs text-slate-600 line-clamp-2">{a.description || 'Awarded for extraordinary scholastic and Quranic merit.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="font-bold text-slate-800">{a.student_name || 'Enrolled Student'}</span>
                  </div>
                  <span className="font-mono text-[11px]">{a.date}</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Add Achievement Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">+ Add Student Achievement</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_no} • {s.class_name} {s.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position / Rank</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. 1st Position (Gold)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Achievement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quran Recitation Competition"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event / Competition Name</label>
                <input
                  type="text"
                  value={competitionEvent}
                  onChange={(e) => setCompetitionEvent(e.target.value)}
                  placeholder="e.g. All Kerala State Madrassa Fest 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the laurel..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Certificate / Trophy Image</label>
                <ImageUploader
                  category="achievements"
                  currentImage={certificateUrl}
                  onImageUploaded={(url) => setCertificateUrl(url)}
                  label="Upload Certificate Photo"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                >
                  Publish Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
