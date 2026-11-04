import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { useExam } from '../context/ExamContext';
import { useCalendar } from '../context/CalendarContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { WireframeModal } from '../components/WireframeModal';
import { CalendarModal } from '../components/CalendarModal';
import { AdminUserManagementModal } from '../components/AdminUserManagementModal';
import { DeviceCameraModal } from '../components/DeviceCameraModal';
import { CreateSebExamModal } from '../components/CreateSebExamModal';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  ShieldAlert,
  BookOpen, 
  Award, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Layers, 
  Calendar, 
  FileCheck, 
  Database,
  Cpu,
  Plus,
  ExternalLink,
  ChevronRight,
  Brain,
  MessageSquare,
  Settings,
  UserPlus,
  Activity,
  HardDrive,
  Camera
} from 'lucide-react';

interface DashboardShellProps {
  onNavigate: (view: string, param?: string) => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ onNavigate }) => {
  const { currentUser, quickSwitchUser, users } = useAuth();
  const { courses } = useCourses();
  const { assignments, submissions } = useExam();
  const { events } = useCalendar();
  const { t } = useLanguage();

  const [isWireframeOpen, setIsWireframeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCreateSebOpen, setIsCreateSebOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center max-w-md shadow-xs">
          <p className="text-slate-600 text-sm mb-4">Sesi Anda belum aktif atau telah berakhir.</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const pendingReviews = submissions.filter(s => s.status === 'ai_graded_waiting_approval');

  const relevantCourses = currentUser.role === 'admin'
    ? courses
    : currentUser.role === 'guru'
    ? courses.filter(c => c.teacherId === currentUser.id)
    : courses.filter(c => c.enrolledStudentIds.includes(currentUser.id));

  // Admin stats
  const totalStudents = users.filter(u => u.role === 'siswa').length;
  const totalTeachers = users.filter(u => u.role === 'guru').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('landing')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Dasbor Saya (Dashboard)</span>
        </div>

        {/* Moodle User Welcome Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30 bg-slate-100"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentUser.role === 'siswa' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    currentUser.role === 'guru' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                  {currentUser.isWaliKelas && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                      Wali Kelas {currentUser.kelasBimbingan}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span>Nomor Identitas: <strong className="text-slate-700">{currentUser.identifierNumber || '-'}</strong></span>
                  <span>•</span>
                  <span>Institusi: <strong className="text-slate-700">{currentUser.institution || 'SMA Cakrawala Nusantara'}</strong></span>
                  {currentUser.role === 'siswa' && currentUser.kelasBimbingan && (
                    <>
                      <span>•</span>
                      <span>Kelas: <strong className="text-emerald-700">{currentUser.kelasBimbingan}</strong></span>
                    </>
                  )}
                </p>
              </div>
            </div>

              {/* Quick Actions (Moodle Toolbar) */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Buka Kamera Depan & Belakang Perangkat"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kamera Perangkat (Depan & Belakang)</span>
                </button>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kalender Akademik</span>
                </button>
                {/* Blueprint sistem hanya untuk Administrator (disembunyikan untuk siswa dan guru) */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setIsWireframeOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Blueprint Sistem</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('catalog')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Katalog Kursus
                </button>
              </div>
          </div>
        </div>

        {/* ===================== ROLE-SPECIFIC CONTROL BARS ===================== */}

        {/* 1. ADMIN DASHBOARD (Section 3.1 & 2.3) */}
        {currentUser.role === 'admin' && (
          <div className="space-y-4">
            {/* Admin Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Pengguna</div>
                  <div className="text-lg font-extrabold text-slate-900">{users.length} Akun</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Tenaga Pendidik</div>
                  <div className="text-lg font-extrabold text-purple-700">{totalTeachers} Guru</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Peserta Didik</div>
                  <div className="text-lg font-extrabold text-emerald-700">{totalStudents} Siswa</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Mata Pelajaran</div>
                  <div className="text-lg font-extrabold text-amber-700">{courses.length} Kursus</div>
                </div>
              </div>
            </div>

            {/* Admin Management Bar */}
            <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Pusat Administrasi & Pengelolaan Pengguna</h3>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.2 rounded-full">
                      Administrator Sistem
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola data akun guru dan siswa, status aktif/nonaktif, konfigurasi kelas bimbingan, serta pemulihan kata sandi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAdminUsersOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kelola Pengguna ({users.length})</span>
                </button>
                <button
                  onClick={() => onNavigate('backup-drive')}
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dual Storage & Google Drive</span>
                </button>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>Kalender & Google Sync</span>
                </button>
                <button
                  onClick={() => onNavigate('google-workspace')}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Suite (Sheets, Meet, Docs, Forms, Mail)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEACHER DASHBOARD (Section 3.2) */}
        {currentUser.role === 'guru' && (
          <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Antrean Review Koreksi AI Gemini</h3>
                  {pendingReviews.length > 0 && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full">
                      {pendingReviews.length} Menunggu Persetujuan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tinjau jawaban siswa yang telah dianalisis otomatis oleh AI Gemini, setujui nilai atau sesuaikan secara manual.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsCreateSebOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>+ Tambah Ujian SEB</span>
              </button>
              <button
                onClick={() => onNavigate('teacher-review')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Buka Portal Review Guru
              </button>
              {currentUser.isWaliKelas && (
                <button
                  onClick={() => onNavigate('rapor')}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                >
                  Rekap Rapor Kelas
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. STUDENT DASHBOARD (Section 3.3) */}
        {currentUser.role === 'siswa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Safe Exam Browser (Web SEB)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">30 Menit</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {assignments[0]?.title || 'Ujian Blok 1: Kalkulus Lanjut & Limit Trigonometri'}
                </h3>
                <p className="text-xs text-slate-500">
                  Ujian terkunci anti-curang dengan upload foto pengerjaan kamera langsung dan koreksi instan AI Gemini.
                </p>
              </div>
              <button
                onClick={() => onNavigate('exam', assignments[0]?.id || 'asg-mat-01')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Mulai Ujian Mode SEB
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Buku Nilai (Grades)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{submissions.length} Ujian Terkumpul</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Laporan Capaian Belajar & Catatan Guru
                </h3>
                <p className="text-xs text-slate-500">
                  Periksa nilai resmi yang telah disetujui oleh guru pengampu dan catatan integritas SEB Anda.
                </p>
              </div>
              <button
                onClick={() => onNavigate('student-results')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Lihat Nilai & Hasil Ujian
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Moodle Dashboard Layout (Course Overview Left, Blocks Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column: Moodle Course Overview (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Gambaran Umum Kursus (Course Overview)</span>
                </h3>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Katalog Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {relevantCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  Belum ada kursus yang aktif. Buka katalog untuk mendaftar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relevantCourses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onNavigate('course-detail', c.id)}
                      className="rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition cursor-pointer overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                        <img src={c.bannerImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[9px] font-bold text-blue-800">
                          {c.category}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <div className="text-[10px] font-mono text-slate-400 font-semibold">{c.code}</div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                          {c.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{c.sections.length} Minggu</span>
                          <span className="font-semibold text-slate-700">{c.teacherName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Moodle Classic Block Drawer (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Block 1: Student Scaffolding Card (Only for Student) */}
            {currentUser.role === 'siswa' && (
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-200" />
                  <h4 className="font-extrabold text-xs">Cakrawala AI Scaffolding Siswa</h4>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  Asisten AI cerdas dapat digeser di layar untuk membantu pemahaman materi dengan petunjuk berjenjang (Level 1-3) tanpa membocorkan jawaban langsung.
                </p>
              </div>
            )}

            {/* Block 2: Moodle Timeline / Upcoming Events */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Kegiatan Mendatang (Timeline)</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ujian Blok 1 Matematika (Mode SEB)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Tenggat: 25 Oktober 2026 • 30 Menit</div>
                </div>
              </div>
            </div>

            {/* Block 3: Moodle Calendar Box (Interactive Clickable) */}
            <div 
              onClick={() => setIsCalendarOpen(true)}
              className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-xs hover:border-blue-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kalender Akademik</span>
                </h4>
                <span className="text-[10px] font-bold text-blue-600 group-hover:underline">Buka Agenda</span>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                <div className="font-extrabold text-blue-700">Oktober 2026</div>
                <div className="text-[11px] text-slate-500 mt-1">Minggu Efektif Perkuliahan #7 • {events.length} Agenda</div>
              </div>
            </div>

            {/* Block 4: School IT & LMS Operational Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Status Sistem Akademik</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h4>
              <div className="space-y-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>Server LMS:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online 100%
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>Sensor Ujian (SEB):</span>
                  <span className="font-bold text-blue-600">Aktif & Siaga</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span>Koreksi AI Gemini:</span>
                  <span className="font-bold text-indigo-600">Siap Evaluasi</span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span>Single Active Session:</span>
                  <span className="font-bold text-slate-700">Terenkripsi</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <WireframeModal isOpen={isWireframeOpen} onClose={() => setIsWireframeOpen(false)} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <AdminUserManagementModal isOpen={isAdminUsersOpen} onClose={() => setIsAdminUsersOpen(false)} />
      <DeviceCameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} />
      {isCreateSebOpen && <CreateSebExamModal onClose={() => setIsCreateSebOpen(false)} />}
    </div>
  );
};
