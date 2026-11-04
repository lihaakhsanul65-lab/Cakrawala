import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowLeft, 
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  CheckCircle2
} from 'lucide-react';

interface LoginViewProps {
  initialRole: UserRole;
  onNavigate: (view: string, roleParam?: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ initialRole, onNavigate }) => {
  const { login, users, sessionTerminationNotice, clearSessionTerminationNotice } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();

  const [role, setRole] = useState<UserRole>(() => {
    return initialRole && ['siswa', 'guru', 'admin'].includes(initialRole) ? initialRole : 'siswa';
  });
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role metadata styling
  const roleConfigMap = {
    siswa: {
      title: t('loginAsStudent'),
      badge: 'Portal Peserta Didik (Siswa)',
      color: 'blue',
      icon: GraduationCap,
      placeholder: 'Nama lengkap, NISN, atau email'
    },
    guru: {
      title: t('loginAsTeacher'),
      badge: 'Portal Tenaga Pengajar & Wali Kelas',
      color: 'blue',
      icon: UserCheck,
      placeholder: 'Nama lengkap, NIP, atau email'
    },
    admin: {
      title: t('loginAsAdmin'),
      badge: 'Portal Administrator Sistem (Site Admin)',
      color: 'blue',
      icon: ShieldCheck,
      placeholder: 'Nama akun administrator atau email'
    }
  };

  const roleConfig = roleConfigMap[role] || roleConfigMap.siswa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrId.trim()) {
      setErrorMessage('Mohon masukkan Nama Lengkap, Email, atau Nomor Identitas.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Mohon masukkan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(role, emailOrId.trim(), password);
    setIsSubmitting(false);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Berhasil Masuk',
        message: `Selamat datang kembali di Cakrawala LMS!`
      });
      onNavigate('dashboard');
    } else {
      setErrorMessage(res.message || 'Login gagal. Periksa kembali nama/email dan kata sandi Anda.');
    }
  };

  const IconComponent = roleConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back Link */}
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToHome')}</span>
        </button>

        {/* Single Active Session Dual-Device Warning Banner */}
        {sessionTerminationNotice && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs shadow-md space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold">⚠️</span>
                <span>Peringatan Sesi Berakhir (Single Active Session)</span>
              </div>
              <button 
                onClick={clearSessionTerminationNotice}
                className="text-amber-700 hover:text-amber-900 p-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900 font-medium">
              {sessionTerminationNotice}
            </p>
            <div className="text-[10px] text-amber-800 bg-amber-100/70 p-2 rounded-lg font-mono">
              🛡️ Kebijakan Integritas: Akun hanya boleh aktif di 1 perangkat pada satu waktu demi keamanan data akademik & ujian.
            </div>
          </div>
        )}

        {/* Role Switcher Tabs */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center justify-between gap-1 mb-5">
          <button
            type="button"
            onClick={() => { setRole('siswa'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              role === 'siswa' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('guru'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              role === 'guru' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Guru & Wali</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              role === 'admin' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-200">
              <IconComponent className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {roleConfig.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {roleConfig.badge}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Direct Name and Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap, Email, atau Nomor Identitas
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder={roleConfig.placeholder}
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Tampilkan / Sembunyikan Kata Sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>Ingat sesi di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Memverifikasi...</span>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Registration link */}
          {role === 'siswa' ? (
            <div className="text-center text-xs text-slate-600 pt-1">
              <span>{t('noAccountYet')} </span>
              <button
                type="button"
                onClick={() => onNavigate('register', 'siswa')}
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
              >
                {t('registerNow')}
              </button>
            </div>
          ) : (
            <div className="text-center text-[11px] text-slate-500 font-medium pt-1">
              Akun {role === 'guru' ? 'Guru' : 'Admin'} terdaftar resmi di sistem sekolah.
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Bantuan Pemulihan Kata Sandi</span>
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="leading-relaxed">
              Demi keamanan data akademik dan privasi akun Anda:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Siswa:</strong> Silakan hubungi wali kelas Anda untuk mereset kata sandi melalui Portal Wali Kelas.</li>
              <li><strong>Guru & Staf:</strong> Hubungi Administrator Sistem di menu Manajemen Pengguna.</li>
              <li><strong>Bantuan Teknis:</strong> Jika mengalami kendala saat masuk, pastikan penulisan identitas dan huruf besar/kecil kata sandi sudah tepat.</li>
            </ul>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
