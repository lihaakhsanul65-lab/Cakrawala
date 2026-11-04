import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Camera, 
  GraduationCap, 
  UserCheck, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet, 
  HardDrive, 
  Award,
  ChevronRight,
  Brain,
  MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, roleParam?: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { quickSwitchUser, users } = useAuth();

  const adminUser = users.find(u => u.role === 'admin');
  const guruWali = users.find(u => u.role === 'guru' && u.isWaliKelas);
  const siswaUser = users.find(u => u.role === 'siswa');

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Notice */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-blue-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] tracking-wide uppercase">
              Moodle Edition • AI Scaffold
            </span>
            <span>Selamat datang di portal resmi Cakrawala LMS — Sistem Pembelajaran Cerdas & Integritas Ujian</span>
          </div>
          <div className="flex items-center gap-3 text-blue-800 font-medium">
            <span className="hidden sm:inline">Semester Ganjil 2026/2027</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SEB Active
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs">
            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-2.5 h-2.5" />
            </div>
            <span className="text-blue-700 font-bold">Moodle 4.x Compatible Core</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Pedagogical Scaffolding Tutor</span>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            <span>{t('heroTitle1')} </span>
            <span className="text-blue-600">
              {t('heroTitle2')}
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('heroDesc')}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#portals"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <span>{t('exploreLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => onNavigate('register', 'siswa')}
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>{t('registerStudent')}</span>
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="px-6 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Jelajahi Kursus Moodle</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center transition-all hover:border-blue-300">
              <div className="text-2xl font-extrabold text-blue-600">{t('stat1Value')}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{t('stat1Label')}</div>
              <div className="text-[10px] text-slate-400 mt-1">Evaluasi Esai & Analisis Jawaban</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center transition-all hover:border-emerald-300">
              <div className="text-2xl font-extrabold text-emerald-600">{t('stat2Value')}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{t('stat2Label')}</div>
              <div className="text-[10px] text-slate-400 mt-1">Web SEB Lockdown & Kamera</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center transition-all hover:border-indigo-300">
              <div className="text-2xl font-extrabold text-indigo-600">{t('stat3Value')}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{t('stat3Label')}</div>
              <div className="text-[10px] text-slate-400 mt-1">Guru berhak penuh atas nilai final</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Key Roles Portal Selector */}
      <section id="portals" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('portalSelectTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('portalSelectSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Student Card */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">{t('studentRole')}</h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Registrasi Mandiri
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('studentPortalDesc')}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mode Ujian Safe Exam Browser (SEB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tutor Scaffolding Berjenjang Level 1-3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Melihat Rilis Nilai Resmi & Feedback</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('login', 'siswa')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>{t('loginAsStudent')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('register', 'siswa')}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  {t('registerStudent')}
                </button>
              </div>
            </div>

            {/* Teacher Card */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">{t('teacherRole')}</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                    + Wali Kelas
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('teacherPortalDesc')}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Course & Syllabus Scaffolder Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Review & Validasi Hasil Koreksi AI Gemini</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rekap Nilai Rapor Siswa (Wali Kelas)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('login', 'guru')}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>{t('loginAsTeacher')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-center text-[10px] text-slate-400 py-1 font-medium">
                  Akun guru diterbitkan oleh Administrator
                </div>
              </div>
            </div>

            {/* Admin Card */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">{t('adminRole')}</h3>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                    Otoritas Penuh
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('adminPortalDesc')}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pembuatan Akun Guru & Admin Baru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pemantauan Log Integritas SEB Siswa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cadangkan & Pulihkan ke Google Drive (.json)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('login', 'admin')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>{t('loginAsAdmin')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-center text-[10px] text-slate-400 py-1 font-medium">
                  Akses Administrasi Situs Tingkat Tertinggi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
            Fitur Utama Ekosistem Moodle & AI
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Inovasi Scaffolding Cerdas dan Integritas Ujian Tanpa Kompromi
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
            Dirancang secara presisi untuk kebutuhan guru, siswa, wali kelas, dan staf kurikulum sekolah di Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">AI Pedagogical Scaffolding</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bimbingan berjenjang yang tidak langsung memberikan jawaban, melainkan memicu pemahaman konsep bertahap (ZPD) Level 1 (Konseptual), Level 2 (Rumus), hingga Level 3 (Langkah Operasional).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Safe Exam Browser (Web SEB)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ruang ujian dengan kunci layar penuh (fullscreen lock), sensor perpindahan tab otomatis (*blur event*), dan limit toleransi 3 kali sebelum ujian dikumpulkan otomatis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Foto Kamera Langsung & Multi-Lampiran</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Siswa dapat memotret lembar kerja corat-coret buram atau uraian rumus menggunakan webcam/kamera HP langsung untuk dievaluasi oleh OCR dan AI Gemini.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Gerbang Otoritas Pendidik</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI hanya bertindak sebagai asisten pengoreksi cepat (*draft* rekomendasi). Guru memiliki hak mutlak untuk menyetujui, mengoreksi, atau mengubah nilai sebelum dirilis resmi ke siswa.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Buku Nilai & Rapor Wali Kelas</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rekapitulasi nilai KKM seluruh mata pelajaran, status kenaikan kelas, catatan pembinaan wali kelas, dan fitur siap cetak lembar rapor resmi siswa.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Cadangan Google Drive Mandiri</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ekspor seluruh data LMS (kursus, soal, nilai, dan rekap) ke format snapshot JSON yang dapat disimpan di Google Drive sekolah dan dipulihkan kembali sewaktu-waktu.
            </p>
          </div>

        </div>
      </section>

      {/* Ready to Publish CTA Section */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cakrawala LMS Production Ready</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Siap Memulai Transformasi Pembelajaran Digital Sekolah Anda?</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Platform modern dengan integrasi Safe Exam Browser, koreksi AI cerdas dengan validasi otoritas guru, dan pelaporan rapor terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('login', 'siswa')}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Portal Siswa</span>
            </button>

            <button
              onClick={() => onNavigate('login', 'guru')}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Guru & Wali</span>
            </button>

            <button
              onClick={() => onNavigate('login', 'admin')}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Portal Admin</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
