import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, Cpu, Database, HelpCircle, Globe, LogOut, Brain } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs font-sans mt-auto">
      {/* Moodle User Session Info Bar */}
      <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {currentUser ? (
              <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                Anda masuk sebagai <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
                <button
                  onClick={() => logout()}
                  className="text-blue-600 hover:text-blue-700 underline font-medium ml-2 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Keluar
                </button>
              </span>
            ) : (
              <span>Anda belum masuk ke dalam sistem. Silakan pilih portal login peran Anda.</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              <span>Bahasa: Indonesia (id) / English (en)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">Cakrawala LMS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                Moodle Academic Edition • AI Scaffold
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Sistem Manajemen Pembelajaran (LMS) komprehensif berstandar Moodle dengan modul scaffolding pedagogis berjenjang, asisten cerdas AI Gemini, pengawasan ujian terpadu Safe Exam Browser, serta rekapitulasi nilai rapor sekolah.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 flex-wrap">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Web SEB Anti-Curang
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-blue-700 font-medium">
                <Brain className="w-3.5 h-3.5" /> AI Pedagogical Scaffold
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-700 font-medium">
                <Database className="w-3.5 h-3.5" /> Google Drive Sync
              </span>
            </div>
          </div>

          {/* Moodle Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Tautan Moodle</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><span className="hover:text-blue-600 transition cursor-pointer">Panduan Pengguna (Moodle Docs)</span></li>
              <li><span className="hover:text-blue-600 transition cursor-pointer">Aturan Integritas & Safe Exam</span></li>
              <li><span className="hover:text-blue-600 transition cursor-pointer">Metode Bimbingan Scaffolding AI</span></li>
              <li><span className="hover:text-blue-600 transition cursor-pointer">Pusat Bantuan Akademik</span></li>
            </ul>
          </div>

          {/* Institutional Compliance */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Standar Sistem</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Moodle 4.x Boost Architecture</li>
              <li>Scaffolding Bertingkat (Bloom Level C1-C6)</li>
              <li>Audit Log Pelanggaran Layar Penuh</li>
              <li>Sinkronisasi Cloud & Cadangan Kursus (.mbz)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 Cakrawala LMS. Sistem Pembelajaran Digital Terakreditasi.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Moodle™ adalah merek dagang terdaftar dari Moodle Pty Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
};
