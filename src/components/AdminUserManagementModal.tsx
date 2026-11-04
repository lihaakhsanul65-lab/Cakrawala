import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, UserRole } from '../types';
import { AVAILABLE_CLASSES } from '../data/mockData';
import { 
  Users, 
  X, 
  Plus, 
  Search, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
  Copy,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, resetUserPassword } = useAuth();
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Add User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('siswa');
  const [password, setPassword] = useState('siswa123');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierNumber, setIdentifierNumber] = useState('');
  const [kelasBimbingan, setKelasBimbingan] = useState(AVAILABLE_CLASSES[0]);
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick reset modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassInput, setNewPassInput] = useState('');

  // Local state copy for immediate UI updates
  const [userList, setUserList] = useState<User[]>(users);

  React.useEffect(() => {
    setUserList(users);
  }, [users]);

  if (!isOpen) return null;

  const filteredUsers = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.identifierNumber && u.identifierNumber.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const generateRandomPass = () => {
    const prefixes = ['Cakra', 'Garuda', 'Pandu', 'Siswa'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `${p}#${digits}`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const passwordToSet = password.trim() || (role === 'admin' ? 'admin123' : role === 'guru' ? 'guru123' : 'siswa123');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password: passwordToSet,
          identifierNumber: identifierNumber.trim() || (role === 'siswa' ? `008${Date.now().toString().slice(-7)}` : `1985${Date.now().toString().slice(-7)}`),
          kelasBimbingan: role === 'siswa' || isWaliKelas ? kelasBimbingan : undefined,
          isWaliKelas: role === 'guru' && isWaliKelas
        })
      });

      if (res.ok) {
        const newUser: User = await res.json();
        setUserList(prev => [newUser, ...prev]);
        showNotification({
          type: 'success',
          title: 'Pengguna Ditambahkan',
          message: `Akun ${newUser.name} (${newUser.role}) berhasil didaftarkan. Kata sandi: ${passwordToSet}`
        });
        setName('');
        setEmail('');
        setPassword('siswa123');
        setIdentifierNumber('');
        setIsAddUserOpen(false);
      } else {
        const err = await res.json();
        showNotification({
          type: 'error',
          title: 'Gagal Menambah Pengguna',
          message: err.error || 'Terjadi kesalahan pada server.'
        });
      }
    } catch {
      // offline fallback
      const fallbackUser: User = {
        id: `usr-${role}-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: passwordToSet,
        identifierNumber: identifierNumber.trim() || `008${Date.now().toString().slice(-7)}`,
        kelasBimbingan: role === 'siswa' || isWaliKelas ? kelasBimbingan : undefined,
        isWaliKelas: role === 'guru' && isWaliKelas,
        institution: 'SMA Cakrawala Nusantara',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`
      };
      setUserList(prev => [fallbackUser, ...prev]);
      showNotification({
        type: 'success',
        title: 'Pengguna Ditambahkan',
        message: `Akun ${fallbackUser.name} telah disimpan dengan kata sandi: ${passwordToSet}`
      });
      setName('');
      setEmail('');
      setPassword('siswa123');
      setIdentifierNumber('');
      setIsAddUserOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      // ignore
    }
    setUserList(prev => prev.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
    showNotification({
      type: 'info',
      title: 'Status Pengguna Diperbarui',
      message: `Status akun diubah menjadi ${newStatus}.`
    });
  };

  const copyCreds = (u: User) => {
    const pass = u.password || (u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
    navigator.clipboard.writeText(`Akun: ${u.name}\nEmail/ID: ${u.email}\nKata Sandi: ${pass}`);
    showNotification({
      type: 'info',
      title: 'Kredensial Disalin',
      message: `Data login ${u.name} telah disalin.`
    });
  };

  const executeResetPass = async (u: User) => {
    const pass = newPassInput.trim() || (u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
    const res = await resetUserPassword(u.id, pass, true);
    if (res.success) {
      setUserList(prev => prev.map(usr => usr.id === u.id ? { ...usr, password: res.newPassword } : usr));
      showNotification({
        type: 'success',
        title: 'Kata Sandi Direset',
        message: `Kata sandi akun ${u.name} telah diatur menjadi: "${res.newPassword}"`
      });
      setResettingUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Pusat Administrasi & Pengelolaan Pengguna (Site Admin)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola akun siswa, guru, admin, kata sandi login asli, dan rombel bimbingan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddUserOpen ? 'Tutup Formulir' : 'Daftarkan Pengguna'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Add User Form */}
        {isAddUserOpen && (
          <form onSubmit={handleCreateUser} className="p-4 sm:p-5 bg-blue-50/40 border-b border-blue-100 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Formulir Pendaftaran Akun Pengguna Baru
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Arya Pratama, S.Pd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Sekolah / Google *</label>
                <input
                  type="email"
                  required
                  placeholder="user@cakrawala.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Peran Akses (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setRole(r);
                    setPassword(r === 'admin' ? 'admin123' : r === 'guru' ? 'guru123' : 'siswa123');
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="siswa">Peserta Didik (Siswa)</option>
                  <option value="guru">Tenaga Pengajar (Guru)</option>
                  <option value="admin">Administrator Sekolah</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {role === 'siswa' ? 'NISN (Nomor Induk)' : 'NIP / NUPTK'}
                </label>
                <input
                  type="text"
                  placeholder={role === 'siswa' ? '0087654321' : '198205142008011005'}
                  value={identifierNumber}
                  onChange={(e) => setIdentifierNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3 p-3 bg-white rounded-xl border border-blue-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kata Sandi Login Akun:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateRandomPass())}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Acak Sandi</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi akun"
                    className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                {role === 'siswa' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rombongan Belajar (Kelas):</label>
                    <select
                      value={kelasBimbingan}
                      onChange={(e) => setKelasBimbingan(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300"
                    >
                      {AVAILABLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {role === 'guru' && (
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isWaliKelas}
                        onChange={(e) => setIsWaliKelas(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Tugaskan sebagai Wali Kelas ({kelasBimbingan})</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Daftarkan'}
              </button>
            </div>
          </form>
        )}

        {/* Filters & Search Toolbar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, atau NIP/NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({userList.length})
            </button>
            <button
              onClick={() => setRoleFilter('siswa')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'siswa' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Siswa ({userList.filter(u => u.role === 'siswa').length})
            </button>
            <button
              onClick={() => setRoleFilter('guru')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'guru' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Guru ({userList.filter(u => u.role === 'guru').length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'admin' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Admin ({userList.filter(u => u.role === 'admin').length})
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Pengguna</th>
                  <th className="p-3">Peran / Role</th>
                  <th className="p-3">ID / NISN / NIP</th>
                  <th className="p-3">Kata Sandi</th>
                  <th className="p-3">Status Akun</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada pengguna yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isInactive = u.status === 'inactive';
                    const pass = u.password || (u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {currentUser?.id === u.id && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'guru' ? 'bg-blue-100 text-blue-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.role}
                          </span>
                          {u.kelasBimbingan && (
                            <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                              {u.isWaliKelas ? `Wali: ${u.kelasBimbingan}` : u.kelasBimbingan}
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono font-medium text-slate-700">
                          {u.identifierNumber || '-'}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {pass}
                            </span>
                            <button
                              onClick={() => copyCreds(u)}
                              title="Salin Kredensial"
                              className="p-1 hover:bg-slate-200 text-slate-500 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                              isInactive 
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {isInactive ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{isInactive ? 'Dinonaktifkan' : 'Aktif'}</span>
                          </button>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setNewPassInput(u.role === 'admin' ? 'admin123' : u.role === 'guru' ? 'guru123' : 'siswa123');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>Reset Sandi</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reset Password Prompt Modal */}
        {resettingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Reset Sandi Akun {resettingUser.name}</span>
              </h4>
              <p className="text-xs text-slate-500">
                Atur kata sandi baru untuk pengguna ini:
              </p>
              <input
                type="text"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => executeResetPass(resettingUser)}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Sandi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
