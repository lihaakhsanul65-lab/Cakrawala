import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { useLanguage } from '../context/LanguageContext';
import { Course } from '../types';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Key, 
  GraduationCap, 
  Sparkles,
  Layers,
  ArrowLeft
} from 'lucide-react';

interface CourseCatalogViewProps {
  onNavigate: (view: string, courseIdParam?: string) => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { courses, createCourse, enrollInCourse } = useCourses();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal: Create Course
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('MIPA / Sains');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetClass, setNewTargetClass] = useState('12-MIPA-1');
  const [newKey, setNewKey] = useState('');

  // Modal: Enrollment with Key
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  const categories = ['Semua', 'MIPA / Sains', 'Bahasa & Sastra', 'IPS / Sosial', 'Umum'];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'Semua' || c.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(q) || 
                          c.code.toLowerCase().includes(q) || 
                          c.teacherName.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    await createCourse({
      title: newTitle,
      code: newCode,
      category: newCategory,
      description: newDesc,
      teacherId: currentUser?.id || 'usr-guru-01',
      teacherName: currentUser?.name || 'Drs. Bambang Suryono',
      targetClass: newTargetClass,
      bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      enrollmentKey: newKey.trim() || undefined
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewKey('');
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingCourse || !currentUser) return;
    setKeyError(null);

    const res = await enrollInCourse(enrollingCourse.id, currentUser.id, keyInput);
    if (res.success) {
      setEnrollingCourse(null);
      setKeyInput('');
      onNavigate('course-detail', enrollingCourse.id);
    } else {
      setKeyError(res.message || 'Gagal mendaftar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Katalog Kursus (Course Overview)</span>
        </div>

        {/* Header & Title */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                Moodle Course Directory
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Katalog Kursus & Pembelajaran Mingguan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Jelajahi mata pelajaran terstruktur berbasis silabus kronologis mingguan khas Cakrawala LMS.
            </p>
          </div>

          {(currentUser?.role === 'admin' || currentUser?.role === 'guru') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kursus Baru</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, kode, atau guru pengampu..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl">
              Tidak ada kursus yang cocok dengan pencarian Anda.
            </div>
          ) : (
            filteredCourses.map((c) => {
              const isEnrolled = currentUser ? c.enrolledStudentIds.includes(currentUser.id) : false;
              const isInstructor = currentUser?.id === c.teacherId;

              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group"
                >
                  <div>
                    {/* Course Card Banner */}
                    <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                      <img 
                        src={c.bannerImage} 
                        alt={c.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[10px] text-blue-700 font-bold shadow-xs">
                          {c.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] text-white font-mono font-bold">
                          {c.code}
                        </span>
                      </div>

                      {c.enrollmentKey && (
                        <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-blue-600 text-white shadow-xs" title="Dilindungi Kunci Enrolment">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                        <span className="truncate">{c.teacherName}</span>
                        {isEnrolled && (
                          <span className="bg-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terdaftar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Card Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.sections.length} Minggu Belajar</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.enrolledStudentIds.length} Siswa</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Card Footer Actions */}
                  <div className="p-5 pt-0">
                    {isEnrolled || isInstructor || currentUser?.role === 'admin' ? (
                      <button
                        onClick={() => onNavigate('course-detail', c.id)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <span>Buka Silabus Mingguan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (c.enrollmentKey) {
                            setEnrollingCourse(c);
                          } else {
                            if (currentUser) {
                              enrollInCourse(c.id, currentUser.id);
                              onNavigate('course-detail', c.id);
                            }
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <span>Daftar Kursus Ini</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL: CREATE COURSE (Moodle Form Style) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Tambah Kursus Pembelajaran Moodle Baru
              </h3>
              <form onSubmit={handleCreateCourse} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Kursus</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="misal: KIM-12-MIPA"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="MIPA / Sains">MIPA / Sains</option>
                      <option value="Bahasa & Sastra">Bahasa & Sastra</option>
                      <option value="IPS / Sosial">IPS / Sosial</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kursus</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="misal: Kimia Unsur & Senyawa Karbon"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Silabus</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Gambaran umum materi dan target capaian kurikulum..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sasaran Kelas</label>
                    <input
                      type="text"
                      value={newTargetClass}
                      onChange={(e) => setNewTargetClass(e.target.value)}
                      placeholder="misal: 12-MIPA-1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kunci Enrolment (Kosongkan jika bebas)
                    </label>
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="misal: KIMIA12"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Simpan Kursus
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ENROLLMENT WITH KEY */}
        {enrollingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kunci Pendaftaran Diperlukan</h3>
                  <p className="text-[11px] text-slate-500">{enrollingCourse.title}</p>
                </div>
              </div>

              <form onSubmit={handleEnrollSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Masukkan Enrollment Key
                  </label>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Kunci dari guru pengampu..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {keyError && <p className="text-[11px] text-red-600 mt-1">{keyError}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setEnrollingCourse(null); setKeyError(null); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
