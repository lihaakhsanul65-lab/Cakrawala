import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useExam } from '../context/ExamContext';
import { User, UserRole, ExamLockStatus } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  X,
  Phone,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  LogIn,
  RotateCcw,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

interface AdminUsersViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onNavigate }) => {
  const { currentUser, users, addUser, updateUser, toggleUserStatus, deleteUser, resetUserPassword, quickSwitchUser } = useAuth();
  const { fetchSebLocks, unlockExamForStudent, unlockAllSebForStudent } = useExam();
  const { showNotification } = useNotification();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'users' | 'seb-locks'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('siswa');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formClass, setFormClass] = useState('12-MIPA-1');
  const [formIsWali, setFormIsWali] = useState(false);
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [terminateSessionsChecked, setTerminateSessionsChecked] = useState(true);
  const [unlockSebChecked, setUnlockSebChecked] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // SEB Locks Management State
  const [sebLocks, setSebLocks] = useState<ExamLockStatus[]>([]);
  const [isLoadingLocks, setIsLoadingLocks] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<ExamLockStatus | null>(null);
  const [unlockReason, setUnlockReason] = useState('Izin pengerjaan ulang / dispensasi teknis');
  const [allowResetSubmission, setAllowResetSubmission] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Restrict to Admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-xs">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3 max-w-md">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="font-extrabold text-base text-slate-900">Akses Dibatasi</h2>
          <p className="text-slate-600">Halaman ini hanya dapat diakses oleh Administrator Sistem Cakrawala LMS.</p>
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  // Load SEB locks
  const loadSebLocks = async () => {
    setIsLoadingLocks(true);
    try {
      const data = await fetchSebLocks();
      setSebLocks(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingLocks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'seb-locks') {
      loadSebLocks();
    }
  }, [activeTab]);

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.identifierNumber && u.identifierNumber.includes(searchQuery));
    return matchRole && matchSearch;
  });

  const countStudents = users.filter(u => u.role === 'siswa').length;
  const countTeachers = users.filter(u => u.role === 'guru').length;
  const countAdmins = users.filter(u => u.role === 'admin').length;

  const generateRandomPassword = () => {
    const prefixes = ['Cakra', 'Garuda', 'Pandu', 'Bintang', 'Siswa'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${randomPrefix}#${randomDigits}`;
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('siswa');
    setFormIdentifier('');
    setFormClass('12-MIPA-1');
    setFormIsWali(false);
    setFormPhone('');
    setFormPassword(generateRandomPassword());
    setShowPassword(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormIdentifier(u.identifierNumber || '');
    setFormClass(u.kelasBimbingan || '12-MIPA-1');
    setFormIsWali(!!u.isWaliKelas);
    setFormPhone(u.phone || '');
    setFormPassword('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openResetPasswordModal = (u: User) => {
    setResetModalUser(u);
    setNewPasswordInput(u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
    setShowResetPassword(true);
    setTerminateSessionsChecked(true);
    setUnlockSebChecked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showNotification({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Nama dan email wajib diisi.'
      });
      return;
    }

    setIsSubmitting(true);
    if (editingUser) {
      const updatePayload: Partial<User> = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        identifierNumber: formIdentifier.trim(),
        kelasBimbingan: formRole === 'siswa' || formIsWali ? formClass : undefined,
        isWaliKelas: formRole === 'guru' ? formIsWali : false,
        phone: formPhone.trim()
      };
      if (formPassword.trim()) {
        updatePayload.password = formPassword.trim();
      }

      const res = await updateUser(editingUser.id, updatePayload);
      setIsSubmitting(false);
      setIsModalOpen(false);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Akun Diperbarui',
          message: `Data akun "${formName}" berhasil diperbarui.`
        });
      }
    } else {
      const passwordToSet = formPassword.trim() || (formRole === 'admin' ? 'admin123' : formRole === 'guru' ? 'guru123' : 'siswa123');
      const res = await addUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        password: passwordToSet,
        identifierNumber: formIdentifier.trim() || (formRole === 'siswa' ? `008${Date.now().toString().slice(-7)}` : `1985${Date.now().toString().slice(-7)}`),
        kelasBimbingan: formRole === 'siswa' || formIsWali ? formClass : undefined,
        isWaliKelas: formRole === 'guru' ? formIsWali : false,
        phone: formPhone.trim()
      });
      setIsSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        showNotification({
          type: 'success',
          title: 'Akun Berhasil Dibuat',
          message: `Akun "${formName}" (${formRole.toUpperCase()}) siap digunakan login dengan sandi: ${passwordToSet}`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Membuat Akun',
          message: res.message || 'Email sudah terdaftar.'
        });
      }
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalUser) return;
    setIsResetting(true);
    const pass = newPasswordInput.trim() || (resetModalUser.role === 'admin' ? 'admin123' : resetModalUser.role === 'guru' ? 'guru123' : 'siswa123');
    
    const res = await resetUserPassword(resetModalUser.id, pass, unlockSebChecked);
    setIsResetting(false);
    
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Kata Sandi Berhasil Direset',
        message: `Kata sandi untuk ${resetModalUser.name} telah diatur menjadi: "${res.newPassword}"`
      });
      setResetModalUser(null);
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Reset Sandi',
        message: res.message || 'Terjadi kesalahan sistem.'
      });
    }
  };

  const copyCredentials = (u: User, customPass?: string) => {
    const pass = customPass || u.password || (u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
    const text = `🎓 KREDENSIAL LOGIN CAKRAWALA LMS
Nama: ${u.name}
Peran: ${u.role.toUpperCase()}
Email: ${u.email}
No. Induk (NISN/NIP): ${u.identifierNumber || '-'}
Kata Sandi: ${pass}
Portal: Akses langsung melalui halaman Masuk (Login) Cakrawala LMS`;
    navigator.clipboard.writeText(text);
    showNotification({
      type: 'info',
      title: 'Kredensial Disalin ke Clipboard',
      message: `Informasi akun ${u.name} siap dikirim via WhatsApp atau Email.`
    });
  };

  const handleToggle = async (u: User) => {
    const res = await toggleUserStatus(u.id);
    if (res.success) {
      const nextStatus = u.status === 'inactive' ? 'diaktifkan' : 'dinonaktifkan';
      showNotification({
        type: 'info',
        title: 'Status Akun Berubah',
        message: `Akun "${u.name}" berhasil ${nextStatus}.`
      });
    }
  };

  const handleDelete = async (u: User) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${u.name}" (${u.email})?`)) return;
    const res = await deleteUser(u.id);
    if (res.success) {
      showNotification({
        type: 'info',
        title: 'Akun Dihapus',
        message: `Pengguna "${u.name}" telah dihapus dari sistem.`
      });
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: res.message || 'Tidak dapat menghapus akun.'
      });
    }
  };

  const handleExecuteUnlockSeb = async () => {
    if (!unlockTarget) return;
    setIsUnlocking(true);
    const res = await unlockExamForStudent(
      unlockTarget.assignmentId,
      unlockTarget.studentId,
      currentUser?.name || 'Administrator Utama',
      unlockReason,
      allowResetSubmission
    );
    setIsUnlocking(false);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Kunci SEB Berhasil Dibuka',
        message: `Siswa ${unlockTarget.studentName} kini dapat membuka dan mengerjakan kembali ujian.`
      });
      setUnlockTarget(null);
      loadSebLocks();
    }
  };

  const handleUnlockAllForStudentDirectly = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Buka SEMUA sesi ujian SEB yang tertutup untuk siswa "${studentName}"?`)) return;
    const res = await unlockAllSebForStudent(
      studentId,
      currentUser?.name || 'Administrator Utama',
      'Dispensasi pembukaan kunci oleh Admin',
      true
    );
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Semua Kunci SEB Siswa Dibuka',
        message: res.message || `Siswa ${studentName} telah diizinkan kembali ke ruang ujian.`
      });
      loadSebLocks();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Administrasi Sistem</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Manajemen Akun & Kunci SEB</span>
        </div>

        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900">
                  Pusat Manajemen Pengguna & Kunci SEB
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Admin Control Gate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun siswa, guru, admin, atur kata sandi, dan buka kembali sesi Safe Exam Browser (SEB) yang tertutup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Pengguna & Kredensial ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('seb-locks')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'seb-locks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Pusat Pembukaan Kunci SEB Siswa</span>
            {sebLocks.filter(l => l.isLocked).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                {sebLocks.filter(l => l.isLocked).length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Total Akun Terdaftar</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{users.length}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Peserta Didik (Siswa)</span>
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-2">{countStudents}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Otomatis terdaftar ke materi & ujian</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Tenaga Pengajar (Guru)</span>
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600 mt-2">{countTeachers}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Akses materi & review AI</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Administrator</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-600 mt-2">{countAdmins}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Hak akses sistem menyeluruh</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau NISN/NIP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Filter Peran:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">Semua Peran</option>
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* User Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Identitas Pengguna</th>
                      <th className="p-4">Peran & Rombel</th>
                      <th className="p-4">No. Induk (NISN/NIP)</th>
                      <th className="p-4">Kata Sandi</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Tindakan Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isInactive = u.status === 'inactive';
                      const currentPass = u.password || (u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                              {u.phone && <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-2.5 h-2.5" />{u.phone}</div>}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border ${
                              u.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                              u.role === 'guru' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {u.role}
                            </span>
                            {u.kelasBimbingan && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {u.isWaliKelas ? `Wali: ${u.kelasBimbingan}` : u.kelasBimbingan}
                              </div>
                            )}
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-700">
                            {u.identifierNumber || '-'}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold border border-slate-200">
                                {currentPass}
                              </span>
                              <button
                                onClick={() => copyCredentials(u)}
                                title="Salin Kredensial Pengguna"
                                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {u.lastPasswordReset && (
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Direset: {u.lastPasswordReset}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => handleToggle(u)}
                              title="Klik untuk ubah status aktif/nonaktif"
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition ${
                                isInactive 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                              }`}
                            >
                              {isInactive ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              <span>{isInactive ? 'Nonaktif' : 'Aktif'}</span>
                            </button>
                          </td>

                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Atur / Reset Password Button */}
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                title="Atur / Reset Password"
                                className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Key className="w-3 h-3 text-amber-600" />
                                <span>Reset Sandi</span>
                              </button>

                              {/* Quick Test Login */}
                              <button
                                onClick={() => {
                                  quickSwitchUser(u.id);
                                  showNotification({
                                    type: 'success',
                                    title: 'Beralih Akun',
                                    message: `Sekarang masuk sebagai ${u.name} (${u.role.toUpperCase()}). Semua fitur dapat diakses sesuai perannya.`
                                  });
                                  onNavigate('dashboard');
                                }}
                                title="Masuk Sebagai Akun Ini (Uji Coba Integrasi Fitur)"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-2xs"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Modal Button */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Akun"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={currentUser?.id === u.id}
                                title={currentUser?.id === u.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Akun'}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-50 cursor-pointer shadow-2xs disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* ======================== TAB 2: SEB LOCKS MANAGEMENT ======================== */
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Daftar Sesi Ujian Safe Exam Browser (SEB) Tertutup Milik Siswa</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Siswa yang telah mengumpulkan ujian atau terkunci otomatis akibat batas pelanggaran SEB tidak dapat masuk kembali tanpa izin dispensasi Guru atau Admin.
                </p>
              </div>
              <button
                onClick={loadSebLocks}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLocks ? 'animate-spin' : ''}`} />
                <span>Segarkan Data Kunci</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Peserta Didik (Siswa)</th>
                      <th className="p-4">Mata Pelajaran & Ujian</th>
                      <th className="p-4">Status Kunci SEB</th>
                      <th className="p-4">Alasan Terkunci / Riwayat</th>
                      <th className="p-4">Waktu Terakhir</th>
                      <th className="p-4 text-right">Tindakan Pembukaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sebLocks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {isLoadingLocks ? 'Memuat status kunci SEB...' : 'Belum ada catatan kunci SEB aktif.'}
                        </td>
                      </tr>
                    ) : (
                      sebLocks.map((lock, idx) => {
                        const isLocked = lock.isLocked;
                        return (
                          <tr key={`${lock.assignmentId}_${lock.studentId}_${idx}`} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{lock.studentName || 'Siswa'}</div>
                              <div className="text-[11px] text-slate-400 font-mono">NISN: {lock.studentNis || '-'} • Kelas: {lock.studentClass || '-'}</div>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-slate-800">{lock.assignmentTitle || lock.assignmentId}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{lock.assignmentId}</div>
                            </td>

                            <td className="p-4">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                                  <Lock className="w-3 h-3 text-rose-600" />
                                  <span>Terkunci (SEB Closed)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Unlock className="w-3 h-3 text-emerald-600" />
                                  <span>Terbuka (Dapat Mengerjakan)</span>
                                </span>
                              )}
                            </td>

                            <td className="p-4 max-w-xs">
                              <div className="text-[11px] text-slate-700 leading-snug">
                                {lock.lockedReason || '-'}
                              </div>
                              {lock.unlockedBy && (
                                <div className="text-[10px] text-blue-700 mt-1 font-medium">
                                  Dibuka oleh: {lock.unlockedBy} ({lock.unlockedAt || '-'})
                                </div>
                              )}
                            </td>

                            <td className="p-4 text-[11px] font-mono text-slate-500">
                              {lock.submittedAt || lock.unlockedAt || '-'}
                            </td>

                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {isLocked ? (
                                  <button
                                    onClick={() => {
                                      setUnlockTarget(lock);
                                      setUnlockReason('Dispensasi pengerjaan ulang oleh Administrator');
                                      setAllowResetSubmission(true);
                                    }}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Buka Kunci SEB</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                    Akses Aktif
                                  </span>
                                )}

                                <button
                                  onClick={() => handleUnlockAllForStudentDirectly(lock.studentId, lock.studentName || 'Siswa')}
                                  title="Buka semua ujian SEB untuk siswa ini"
                                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ======================== MODAL: ADD / EDIT USER ======================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama Lengkap dengan Gelar"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Email:</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@cakrawala.sch.id"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Password Setting Field */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>{editingUser ? 'Ubah Kata Sandi (Opsional):' : 'Atur Kata Sandi Login:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(generateRandomPassword())}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Buat Sandi Acak</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah sandi' : 'Masukkan kata sandi akun'}
                    className="w-full px-3 py-2 pr-10 bg-white border border-amber-300 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800">
                  Kata sandi ini terintegrasi langsung dan dapat digunakan untuk masuk secara nyata pada aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran Akun:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="siswa">Peserta Didik (Siswa)</option>
                    <option value="guru">Tenaga Pengajar (Guru)</option>
                    <option value="admin">Administrator Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formRole === 'siswa' ? 'NISN (10 Digit):' : 'NIP / ID Pendidik:'}
                  </label>
                  <input
                    type="text"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value)}
                    placeholder="Contoh: 0081234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / Kontak (Opsional):</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              {formRole === 'guru' && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950">
                    <input
                      type="checkbox"
                      checked={formIsWali}
                      onChange={(e) => setFormIsWali(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Guru ini juga bertugas sebagai Wali Kelas</span>
                  </label>
                  {formIsWali && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rombel Bimbingan Wali:</label>
                      <select
                        value={formClass}
                        onChange={(e) => setFormClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="12-MIPA-1">12-MIPA-1</option>
                        <option value="12-MIPA-2">12-MIPA-2</option>
                        <option value="12-IPS-1">12-IPS-1</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {formRole === 'siswa' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rombongan Belajar (Kelas):</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="12-MIPA-1">12-MIPA-1</option>
                    <option value="12-MIPA-2">12-MIPA-2</option>
                    <option value="12-IPS-1">12-IPS-1</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    *Siswa baru akan otomatis didaftarkan ke semua kursus aktif sehingga materi dan ujian langsung muncul.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== MODAL: RESET PASSWORD ======================== */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Atur & Reset Kata Sandi Pengguna</span>
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg hover:bg-amber-100 text-amber-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={resetModalUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resetModalUser.name)}`}
                  alt={resetModalUser.name}
                  className="w-10 h-10 rounded-full object-cover bg-white border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900">{resetModalUser.name}</div>
                  <div className="text-[11px] text-slate-500">{resetModalUser.email}</div>
                  <div className="text-[10px] uppercase font-bold text-blue-700">{resetModalUser.role}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Kata Sandi Baru:</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateRandomPassword())}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Ketik kata sandi baru"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setNewPasswordInput(resetModalUser.role === 'admin' ? 'admin123' : resetModalUser.role === 'guru' ? 'guru123' : 'siswa123')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  Gunakan Default ({resetModalUser.role === 'admin' ? 'admin123' : resetModalUser.role === 'guru' ? 'guru123' : 'siswa123'})
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terminateSessionsChecked}
                    onChange={(e) => setTerminateSessionsChecked(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-[11px]">Hentikan sesi aktif di perangkat lain (Single Active Session)</span>
                </label>

                {resetModalUser.role === 'siswa' && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unlockSebChecked}
                      onChange={(e) => setUnlockSebChecked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[11px]">Buka kunci semua ujian SEB yang tertutup untuk siswa ini</span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => copyCredentials(resetModalUser, newPasswordInput)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Info</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteResetPassword}
                    disabled={isResetting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isResetting ? 'Mereset...' : 'Simpan Sandi Baru'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: SEB UNLOCK REASON ======================== */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-rose-950 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-rose-600" />
                <span>Buka Kunci Safe Exam Browser (SEB)</span>
              </h3>
              <button
                onClick={() => setUnlockTarget(null)}
                className="p-1 rounded-lg hover:bg-rose-100 text-rose-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{unlockTarget.studentName}</div>
                <div className="text-slate-500">Ujian: <strong className="text-slate-800">{unlockTarget.assignmentTitle}</strong></div>
                <div className="text-[11px] text-rose-700 font-medium">Alasan terkunci: {unlockTarget.lockedReason}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Alasan Dispensasi Pembukaan Kunci:</label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-[11px] text-amber-900">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={allowResetSubmission}
                    onChange={(e) => setAllowResetSubmission(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Reset Lembar Jawaban Sebelumnya (Mulai Ulang Penuh)</span>
                </label>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Jika dicentang, berkas/jawaban sebelumnya akan dihapus sehingga siswa dapat memulai pengerjaan ujian baru secara bersih.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteUnlockSeb}
                  disabled={isUnlocking}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isUnlocking ? 'Membuka Kunci...' : 'Buka Kunci Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
