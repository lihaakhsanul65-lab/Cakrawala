import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../types';
import { signInWithGoogle } from '../services/googleWorkspace';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Database,
  Key,
  Globe,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
  initialRole?: UserRole;
}

interface AccountPreset {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarChar: string;
  avatarBg: string;
  roleLabel: string;
  roleBadgeColor: string;
  databaseStatus: string;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'siswa'
}) => {
  const { loginWithGoogle } = useAuth();
  const { showNotification } = useNotification();

  const [selectedRoleOverride, setSelectedRoleOverride] = useState<UserRole | null>(null);
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>(initialRole);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null);

  // Accounts exactly matching user's Google Account Chooser screenshot
  const accountPresets: AccountPreset[] = [
    {
      id: 'acc-liha65',
      name: '', // In screenshot, only email is shown for account 1
      email: 'lihaakhsanul65@gmail.com',
      role: 'siswa',
      avatarChar: 'L',
      avatarBg: 'bg-[#9c27b0]', // Purple circle
      roleLabel: 'Demo User / Siswa • Kelas 12-MIPA-1',
      roleBadgeColor: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
      databaseStatus: 'Terhubung ke DB Siswa (Ujian, Nilai, Kuis, Presensi & Drive)'
    },
    {
      id: 'acc-liha6',
      name: 'liha akhsanul 3',
      email: 'lihaakhsanul6@gmail.com',
      role: 'guru',
      avatarChar: 'l',
      avatarBg: 'bg-[#455a64]', // Slate/teal circle
      roleLabel: 'Guru Pengampu & Wali Kelas • MIPA 12',
      roleBadgeColor: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
      databaseStatus: 'Terhubung ke DB Guru (Koreksi AI, Kunci Ujian, Gradebook & Workspace)'
    },
    {
      id: 'acc-mathmate',
      name: 'mathmateai',
      email: 'mathmateai.123@gmail.com',
      role: 'admin',
      avatarChar: 'm',
      avatarBg: 'bg-[#2e7d32]', // Green circle
      roleLabel: 'Site Administrator Utama',
      roleBadgeColor: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
      databaseStatus: 'Terhubung ke DB Admin (Semua Kursus, User, Log Sistem & Kontrol)'
    }
  ];

  if (!isOpen) return null;

  const handleSelectAccount = async (account: AccountPreset) => {
    setIsAuthenticating(true);
    setAuthenticatingEmail(account.email);

    const activeRole = selectedRoleOverride || account.role;
    const displayName = account.name || account.email.split('@')[0];

    const res = await loginWithGoogle(account.email, displayName, activeRole);
    setIsAuthenticating(false);
    setAuthenticatingEmail(null);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Login Google Berhasil Terhubung',
        message: `Masuk sebagai ${displayName} (${activeRole.toUpperCase()}). Semua basis data dan API key aktif!`
      });
      onSuccess(activeRole);
      onClose();
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Masuk',
        message: res.message || 'Gagal menyambungkan akun Google ke basis data LMS.'
      });
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setIsAuthenticating(true);
    setAuthenticatingEmail(customEmail.trim());

    const res = await loginWithGoogle(
      customEmail.trim(),
      customName.trim() || customEmail.split('@')[0],
      customRole
    );
    setIsAuthenticating(false);
    setAuthenticatingEmail(null);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Akun Google Terhubung',
        message: `Akun ${customEmail} berhasil didaftarkan dan terhubung ke basis data ${customRole.toUpperCase()}!`
      });
      onSuccess(customRole);
      onClose();
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Masuk',
        message: res.message || 'Autentikasi akun Google gagal.'
      });
    }
  };

  const handleLiveFirebasePopup = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithGoogle();
      if (result && result.user && result.user.email) {
        const preferredRole = selectedRoleOverride || initialRole;
        const res = await loginWithGoogle(result.user.email, result.user.displayName || result.user.email.split('@')[0], preferredRole);
        if (res.success) {
          showNotification({
            type: 'success',
            title: 'OAuth Google Terverifikasi',
            message: `Masuk dengan akun Google resmi: ${result.user.email} (${preferredRole.toUpperCase()})`
          });
          onSuccess(preferredRole);
          onClose();
        }
      }
    } catch (err: any) {
      showNotification({
        type: 'error',
        title: 'Popup Google OAuth',
        message: err.message || 'Jendela popup Google ditutup atau dibatalkan.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-sans">
      
      {/* Google Sign-in Dark Card (Replicating accounts.google.com dark mode) */}
      <div className="w-full max-w-xl bg-[#1e1f20] text-[#e3e3e3] rounded-3xl border border-[#3c4043] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Google Multi-Color G Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="text-sm font-medium text-[#e3e3e3]">Login dengan Google</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#2e3134] transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & App Destination */}
        <div className="px-6 pt-2 pb-5">
          <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Pilih akun
          </h2>
          <p className="text-sm text-[#c4c7c5] mt-1.5">
            Lanjutkan ke <span className="text-[#a8c7fa] font-medium hover:underline cursor-pointer">MMAI MathMate AI</span> • <span className="text-slate-400">Cakrawala LMS</span>
          </p>

          {/* Quick Role Mode Selector (Optional Override) */}
          <div className="mt-3.5 p-2 bg-[#131314] rounded-xl border border-[#2d2f31] flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-[#9aa0a6] pl-1 font-medium hidden sm:inline">
              Peran Sasaran:
            </span>
            <div className="flex gap-1.5 flex-1 justify-end">
              <button
                type="button"
                onClick={() => setSelectedRoleOverride(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  selectedRoleOverride === null 
                    ? 'bg-[#8ab4f8] text-[#001d35] font-bold shadow-xs' 
                    : 'text-[#c4c7c5] hover:bg-[#282a2d]'
                }`}
              >
                Otomatis Sesuai Akun
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleOverride('siswa')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  selectedRoleOverride === 'siswa' 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-[#c4c7c5] hover:bg-[#282a2d]'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleOverride('guru')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  selectedRoleOverride === 'guru' 
                    ? 'bg-cyan-600 text-white font-bold' 
                    : 'text-[#c4c7c5] hover:bg-[#282a2d]'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Guru</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleOverride('admin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  selectedRoleOverride === 'admin' 
                    ? 'bg-purple-600 text-white font-bold' 
                    : 'text-[#c4c7c5] hover:bg-[#282a2d]'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Presets List matching user screenshot */}
        <div className="border-t border-[#3c4043] divide-y divide-[#2d2f31]">
          
          {accountPresets.map((acc) => {
            const isThisLoading = isAuthenticating && authenticatingEmail === acc.email;
            const targetRole = selectedRoleOverride || acc.role;

            return (
              <button
                key={acc.id}
                type="button"
                disabled={isAuthenticating}
                onClick={() => handleSelectAccount(acc)}
                className="w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-[#282a2d] transition-colors cursor-pointer group disabled:opacity-50 focus:outline-none"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Google Profile Avatar Circle */}
                  <div className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white font-medium text-base flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                    {isThisLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      acc.avatarChar
                    )}
                  </div>

                  {/* Account Text */}
                  <div className="min-w-0 pr-2">
                    {acc.name ? (
                      <>
                        <div className="text-sm font-medium text-white truncate group-hover:text-[#a8c7fa] transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-xs text-[#9aa0a6] truncate font-mono">
                          {acc.email}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-medium text-white truncate group-hover:text-[#a8c7fa] transition-colors font-mono">
                        {acc.email}
                      </div>
                    )}
                    
                    {/* Database & Role Connection Details */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${acc.roleBadgeColor}`}>
                        {targetRole.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#8ab4f8] flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3 h-3 text-[#34a853] shrink-0" />
                        <span>{acc.databaseStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-[#8ab4f8] opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold pl-2">
                  Masuk ➔
                </div>
              </button>
            );
          })}

          {/* Option: Gunakan Akun Lain (Use another account) */}
          <div className="hover:bg-[#282a2d] transition-colors">
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={() => setIsCustomExpanded(!isCustomExpanded)}
              className="w-full px-6 py-3.5 flex items-center justify-between text-left cursor-pointer group disabled:opacity-50 focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-[#5f6368] text-[#c4c7c5] flex items-center justify-center shrink-0 group-hover:border-[#a8c7fa] group-hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[#a8c7fa] transition-colors">
                    Gunakan akun lain
                  </div>
                  <div className="text-xs text-[#9aa0a6]">
                    Masuk dengan akun Google lain atau buka popup OAuth
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#8ab4f8] font-medium">
                {isCustomExpanded ? 'Tutup ▲' : 'Buka ▼'}
              </div>
            </button>

            {/* Expanded Custom Form */}
            {isCustomExpanded && (
              <div className="px-6 pb-5 pt-1 space-y-3 bg-[#17181a] border-t border-[#2d2f31] animate-in fade-in duration-150">
                <form onSubmit={handleCustomSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[#c4c7c5] font-medium mb-1">
                        Email Akun Google Baru:
                      </label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="contoh@gmail.com"
                        required
                        className="w-full px-3 py-2 bg-[#202124] border border-[#5f6368] rounded-xl text-white text-xs focus:outline-none focus:border-[#8ab4f8] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#c4c7c5] font-medium mb-1">
                        Nama Tampilan:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nama Lengkap Pengguna"
                        className="w-full px-3 py-2 bg-[#202124] border border-[#5f6368] rounded-xl text-white text-xs focus:outline-none focus:border-[#8ab4f8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#c4c7c5] font-medium mb-1">
                      Peran & Hak Akses Database:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomRole('siswa')}
                        className={`py-1.5 px-2 rounded-lg font-bold border text-xs capitalize cursor-pointer transition ${
                          customRole === 'siswa'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#202124] text-[#c4c7c5] border-[#3c4043] hover:bg-[#282a2d]'
                        }`}
                      >
                        Siswa (Demo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomRole('guru')}
                        className={`py-1.5 px-2 rounded-lg font-bold border text-xs capitalize cursor-pointer transition ${
                          customRole === 'guru'
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-[#202124] text-[#c4c7c5] border-[#3c4043] hover:bg-[#282a2d]'
                        }`}
                      >
                        Guru & Wali
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomRole('admin')}
                        className={`py-1.5 px-2 rounded-lg font-bold border text-xs capitalize cursor-pointer transition ${
                          customRole === 'admin'
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-[#202124] text-[#c4c7c5] border-[#3c4043] hover:bg-[#282a2d]'
                        }`}
                      >
                        Admin Utama
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2d2f31]">
                    <button
                      type="button"
                      onClick={handleLiveFirebasePopup}
                      className="px-3 py-2 bg-[#202124] hover:bg-[#2d2f31] text-[#a8c7fa] border border-[#5f6368] rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      <span>Buka Popup Resmi Google OAuth</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="px-4 py-2 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#001d35] font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isAuthenticating ? 'Memproses...' : 'Masuk & Sinkron DB'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

        {/* Database & API Keys Live Status Indicator Bar */}
        <div className="px-6 py-3 bg-[#131314] border-t border-[#3c4043] text-[11px] text-[#9aa0a6] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#c4c7c5] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Status Koneksi Sistem & API Keys:</span>
            </span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
              ● SEMUA TERHUBUNG
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] text-[#9aa0a6] pt-1">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>Gemini AI API:</strong> v3.8 Flash Aktif</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>Google Suite:</strong> Drive, Sheets, Gmail, Docs, Forms, Meet</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>Basis Data:</strong> Siswa ⇄ Guru ⇄ Admin Sinkron</span>
            </div>
          </div>
        </div>

        {/* Google Chooser Footer (Matching Screenshot) */}
        <div className="px-6 py-3.5 bg-[#17181a] border-t border-[#2d2f31] flex flex-wrap items-center justify-between text-xs text-[#9aa0a6]">
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#c4c7c5] transition">
            <Globe className="w-3.5 h-3.5" />
            <span>Indonesia</span>
            <span className="text-[10px]">▾</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button type="button" className="hover:text-[#c4c7c5] transition cursor-pointer">
              Bantuan
            </button>
            <button type="button" className="hover:text-[#c4c7c5] transition cursor-pointer">
              Privasi
            </button>
            <button type="button" className="hover:text-[#c4c7c5] transition cursor-pointer">
              Persyaratan
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
