import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';

interface Translations {
  [key: string]: {
    id: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & Nav
  brandName: { id: 'Cakrawala LMS', en: 'Cakrawala LMS' },
  brandTagline: { id: 'Sistem Pembelajaran Cerdas & Integritas Ujian', en: 'Intelligent Learning & Exam Integrity System' },
  home: { id: 'Beranda', en: 'Home' },
  features: { id: 'Fitur Unggulan', en: 'Features' },
  profile: { id: 'Profil E-Learning', en: 'About Platform' },
  courses: { id: 'Katalog Kursus', en: 'Course Catalog' },
  login: { id: 'Masuk', en: 'Sign In' },
  registerStudent: { id: 'Daftar Siswa', en: 'Student Register' },
  logout: { id: 'Keluar', en: 'Logout' },
  quickDemo: { id: 'Demo Cepat 1-Klik', en: '1-Click Quick Demo' },

  // Roles
  adminRole: { id: 'Administrator', en: 'Administrator' },
  teacherRole: { id: 'Guru Pengampu', en: 'Teacher' },
  studentRole: { id: 'Peserta Didik (Siswa)', en: 'Student' },
  waliKelasBadge: { id: 'Wali Kelas', en: 'Homeroom Teacher' },

  // Hero
  heroBadge: { id: 'LMS Generasi Baru dengan AI Gemini & Safe Exam Browser', en: 'Next-Gen LMS Powered by Gemini AI & Safe Exam Browser' },
  heroTitle1: { id: 'Ekosistem Belajar Cerdas,', en: 'Intelligent Learning Ecosystem,' },
  heroTitle2: { id: 'Integritas Ujian Tanpa Kompromi.', en: 'Uncompromising Exam Integrity.' },
  heroDesc: {
    id: 'Platform e-learning komprehensif berstandar modern yang menggabungkan kedalaman fitur Moodle dengan koreksi otomatis AI Gemini, penguncian ujian anti-curang, dan rekap nilai terpadu.',
    en: 'A comprehensive modern e-learning platform combining Moodle-level depth with Gemini AI automated grading, anti-cheat exam lockdown, and integrated grade management.'
  },
  getStarted: { id: 'Mulai Belajar Sekarang', en: 'Start Learning Now' },
  exploreLogin: { id: 'Pilih Portal Masuk', en: 'Select Portal Access' },
  stat1Value: { id: '99.8%', en: '99.8%' },
  stat1Label: { id: 'Akurasi Rekomendasi Koreksi AI', en: 'AI Grading Recommendation Accuracy' },
  stat2Value: { id: '0.0%', en: '0.0%' },
  stat2Label: { id: 'Toleransi Kecurangan (Web SEB)', en: 'Cheat Tolerance (Web SEB)' },
  stat3Value: { id: '100%', en: '100%' },
  stat3Label: { id: 'Otoritas Final Tetap di Tangan Guru', en: 'Final Authority Held by Teachers' },

  // Pillars & Features
  featureAiTitle: { id: 'Koreksi Otomatis AI Gemini', en: 'Gemini AI Automated Evaluation' },
  featureAiDesc: {
    id: 'Menganalisis jawaban esai, isian, hingga tulisan tangan multi-foto dengan rubrik guru. Guru tetap memiliki kendali penuh untuk menyetujui atau mengoreksi manual.',
    en: 'Evaluates essays, short answers, and multi-photo handwriting submissions against teacher rubrics. Teachers maintain 100% final approval control.'
  },
  featureSebTitle: { id: 'Safe Exam Browser (SEB)', en: 'Web Safe Exam Browser (SEB)' },
  featureSebDesc: {
    id: 'Mode ujian terkunci dengan fullscreen otomatis, sensor deteksi pindah tab (blur detection), dan pencatat log pelanggaran secara otomatis.',
    en: 'Locked exam mode featuring automatic fullscreen, tab-switching sensor (blur detection), and automated violation auditing.'
  },
  featureMultiMediaTitle: { id: 'Multi-Input: Kamera & Galeri', en: 'Multi-Input: Camera & Gallery' },
  featureMultiMediaDesc: {
    id: 'Siswa dapat mengunggah banyak foto pengerjaan tugas secara langsung dari kamera perangkat atau penyimpanan lokal dengan preview resolusi tinggi.',
    en: 'Students can upload multiple photos directly from camera capture or local storage with high-resolution preview.'
  },
  featureWaliTitle: { id: 'Portal Wali Kelas & Rapor', en: 'Homeroom Portal & Report Cards' },
  featureWaliDesc: {
    id: 'Fasilitas rekapitulasi nilai semester dan kompilasi rapor terpadu bagi guru yang bertugas sebagai wali kelas.',
    en: 'Comprehensive semester grade compilation and integrated report card recaps for homeroom teachers.'
  },

  // E-Learning Profile
  aboutTitle: { id: 'Profil Cakrawala LMS', en: 'About Cakrawala LMS' },
  aboutSubtitle: { id: 'Membangun Generasi Unggul dengan Teknologi Terbuka dan Berintegritas', en: 'Empowering Next Generations with Open and High-Integrity Tech' },
  aboutDesc1: {
    id: 'Cakrawala LMS dirancang khusus untuk memenuhi standar kurikulum akademis institusional, memadukan fleksibilitas manajemen kursus bergaya topik Moodle dengan kecerdasan buatan Gemini.',
    en: 'Cakrawala LMS is tailored for institutional academic excellence, marrying Moodle-style topic-based course management with Gemini AI intelligence.'
  },
  aboutDesc2: {
    id: 'Kami percaya bahwa teknologi AI hadir bukan untuk menggantikan peran pendidik, melainkan menjadi asisten cerdas yang membebaskan guru dari beban repetitif pemeriksaan ratusan lembar jawaban.',
    en: 'We believe AI is built not to replace educators, but to serve as a tireless intelligent co-pilot, relieving teachers from repetitive grading overhead.'
  },

  // Login & Registration
  portalSelectTitle: { id: 'Pilih Portal Masuk Sesuai Peran Anda', en: 'Choose Your Role-Based Portal' },
  portalSelectSubtitle: { id: 'Setiap peran memiliki hak akses dan tampilan lingkungan kerja yang disesuaikan.', en: 'Each role has customized permissions and tailored workspaces.' },
  loginAsStudent: { id: 'Masuk Sebagai Siswa', en: 'Student Login' },
  loginAsTeacher: { id: 'Masuk Sebagai Guru', en: 'Teacher Login' },
  loginAsAdmin: { id: 'Masuk Sebagai Admin', en: 'Admin Login' },
  studentPortalDesc: { id: 'Akses kursus, kerjakan ujian SEB, kirim foto jawaban, dan pantau nilai resmi.', en: 'Access courses, take locked SEB exams, submit photo answers, and view official grades.' },
  teacherPortalDesc: { id: 'Kelola silabus, tinjau rekomendasi koreksi AI, rilis nilai, dan pantau siswa.', en: 'Manage syllabus, review AI grading drafts, publish scores, and monitor student histories.' },
  adminPortalDesc: { id: 'Kontrol penuh pengguna, registrasi guru, audit log kecurangan, dan backup data.', en: 'Full control of users, teacher registration, cheat audit logs, and data backup.' },

  emailOrId: { id: 'Email atau Nomor Identitas (NISN/NIP)', en: 'Email or Identity Number (NISN/NIP)' },
  password: { id: 'Kata Sandi', en: 'Password' },
  rememberMe: { id: 'Ingat sesi saya', en: 'Remember my session' },
  signInBtn: { id: 'Masuk ke Sistem', en: 'Sign In' },
  noAccountYet: { id: 'Belum memiliki akun siswa?', en: 'No student account yet?' },
  registerNow: { id: 'Daftar Akun Siswa Mandiri', en: 'Register as Student' },
  alreadyHaveAccount: { id: 'Sudah memiliki akun?', en: 'Already have an account?' },
  backToHome: { id: 'Kembali ke Beranda', en: 'Back to Home' },

  // Register Form
  studentRegTitle: { id: 'Pendaftaran Akun Siswa Mandiri', en: 'Student Self-Registration' },
  studentRegSubtitle: { id: 'Lengkapi identitas siswa untuk langsung mengakses materi dan ujian Cakrawala LMS.', en: 'Complete your student details to instantly access courses and exams.' },
  fullName: { id: 'Nama Lengkap', en: 'Full Name' },
  nisn: { id: 'NISN / Nomor Induk Siswa', en: 'Student Identification Number' },
  emailAddress: { id: 'Alamat Email Aktif', en: 'Active Email Address' },
  classSelect: { id: 'Tingkat / Rombongan Belajar (Kelas)', en: 'Class / Grade Group' },
  confirmPassword: { id: 'Konfirmasi Kata Sandi', en: 'Confirm Password' },
  createAccountBtn: { id: 'Buat Akun Siswa Saya', en: 'Create My Student Account' },
  regSuccess: { id: 'Registrasi Berhasil! Anda sekarang dapat masuk.', en: 'Registration Successful! You can now sign in.' },

  // Phase 1 Dashboard Shell
  welcomeBack: { id: 'Selamat Datang,', en: 'Welcome back,' },
  currentRoleStatus: { id: 'Peran Aktif Sistem', en: 'Active System Role' },
  fase1CompletedNotice: { id: 'Fase 1 (Fondasi & Autentikasi 3 Peran) Berhasil Diaktifkan!', en: 'Phase 1 (Foundation & 3-Role Auth) Active!' },
  fase1Desc: {
    id: 'Sistem autentikasi mandiri siswa, login terpisah 3 peran, struktur bilingual ID/EN, dan data sesi pengguna telah berfungsi penuh. Siap melanjutkan ke Fase 2.',
    en: 'Student self-registration, separate 3-role logins, ID/EN bilingual architecture, and user session storage are fully operational. Ready for Phase 2.'
  },
  quickSwitchLabel: { id: 'Ganti Peran Uji Coba Cepat:', en: 'Quick Switch Demo Role:' },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('cakrawala_lang');
    return (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('cakrawala_lang', lang);
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item.id || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
