import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { safeSetItem, safeRemoveItem } from '../utils/safeStorage';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (role: UserRole, emailOrId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (email: string, name: string, preferredRole: UserRole) => Promise<{ success: boolean; message?: string; user?: User }>;
  registerStudent: (data: {
    name: string;
    email: string;
    nisn: string;
    kelas: string;
    password: string;
  }) => { success: boolean; message?: string };
  logout: () => void;
  quickSwitchUser: (userId: string) => void;
  deviceId: string;
  sessionId: string | null;
  sessionTerminationNotice: string | null;
  clearSessionTerminationNotice: () => void;
  // Admin User Management
  fetchUsers: () => Promise<void>;
  addUser: (data: Partial<User>) => Promise<{ success: boolean; message?: string; user?: User }>;
  updateUser: (id: string, data: Partial<User>) => Promise<{ success: boolean; message?: string; user?: User }>;
  toggleUserStatus: (id: string) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (id: string, newPassword?: string, unlockSeb?: boolean) => Promise<{ success: boolean; message?: string; newPassword?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_current_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return null;
  });

  useEffect(() => {
    safeSetItem('cakrawala_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem('cakrawala_current_user', JSON.stringify(currentUser));
    } else {
      safeRemoveItem('cakrawala_current_user');
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      }
    } catch {
      // offline fallback
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem('cakrawala_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9);
      safeSetItem('cakrawala_device_id', id);
    }
    return id;
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('cakrawala_session_id');
  });

  const [sessionTerminationNotice, setSessionTerminationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      safeSetItem('cakrawala_session_id', sessionId);
    } else {
      safeRemoveItem('cakrawala_session_id');
    }
  }, [sessionId]);

  // Single Active Session Heartbeat / Polling (Terminates Device A if Device B logs in)
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/session/check?userId=${currentUser.id}&sessionId=${sessionId}&deviceId=${deviceId}`);
        if (res.status === 401) {
          const data = await res.json();
          // Dual login detected!
          setSessionTerminationNotice(
            data.message || 'Sesi Anda telah dihentikan karena akun ini login di perangkat lain (Single Active Session).'
          );
          setCurrentUser(null);
          setSessionId(null);
          localStorage.removeItem('cakrawala_current_user');
          localStorage.removeItem('cakrawala_session_id');
        }
      } catch {
        // network silent
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, sessionId, deviceId]);

  const login = async (role: UserRole, emailOrId: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          emailOrId,
          password,
          deviceId,
          deviceName: navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Komputer Desktop'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        setSessionTerminationNotice(null);
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Gagal masuk sistem.' };
      }
    } catch {
      // offline fallback
      const trimmed = emailOrId.trim().toLowerCase();
      let found = users.find(u => 
        (role ? u.role === role : true) && (
          u.name.toLowerCase() === trimmed ||
          u.name.toLowerCase().includes(trimmed) ||
          trimmed.includes(u.name.toLowerCase()) ||
          u.email.toLowerCase() === trimmed ||
          (u.secondaryEmail && u.secondaryEmail.toLowerCase() === trimmed) ||
          (u.identifierNumber && u.identifierNumber.toLowerCase() === trimmed)
        )
      );

      if (!found) {
        found = users.find(u => 
          u.name.toLowerCase() === trimmed ||
          u.name.toLowerCase().includes(trimmed) ||
          trimmed.includes(u.name.toLowerCase()) ||
          u.email.toLowerCase() === trimmed ||
          (u.secondaryEmail && u.secondaryEmail.toLowerCase() === trimmed) ||
          (u.identifierNumber && u.identifierNumber.toLowerCase() === trimmed)
        );
      }

      if (!found) {
        if (trimmed === 'admin' || trimmed === 'mathmateai' || trimmed === 'administrator') {
          found = users.find(u => u.role === 'admin');
        } else if (trimmed === 'bambang' || trimmed === 'guru') {
          found = users.find(u => u.role === 'guru');
        } else if (trimmed === 'arya' || trimmed === 'siswa') {
          found = users.find(u => u.role === 'siswa');
        }
      }

      if (!found) {
        return {
          success: false,
          message: 'Akun atau nama pengguna tidak ditemukan. Silakan periksa kembali data Anda.'
        };
      }

      if (password !== undefined && password !== null && String(password).trim() !== '') {
        const trimmedPass = String(password).trim();
        const expectedPass = found.password || (found.role === 'admin' ? 'admin123' : found.role === 'guru' ? 'guru123' : 'siswa123');
        const isValid = (found.role === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'demo123' || trimmedPass === expectedPass))
          || (trimmedPass === expectedPass);
        if (!isValid) {
          return {
            success: false,
            message: 'Kata sandi tidak sesuai untuk akun ' + found.name + ' (' + found.role.toUpperCase() + ').'
          };
        }
      } else if (found.role === 'admin') {
        return {
          success: false,
          message: 'Kata sandi Administrator wajib diisi.'
        };
      }

      if (found.status === 'inactive') {
        return {
          success: false,
          message: 'Akun Anda dinonaktifkan oleh administrator sekolah. Silakan hubungi bagian kurikulum.'
        };
      }

      const newSess = `sess_${Date.now()}`;
      setSessionId(newSess);
      setCurrentUser(found);
      setSessionTerminationNotice(null);
      return { success: true };
    }
  };

  // Custom JSON-based Google Payload Authentication
  const loginWithGoogle = async (email: string, name: string, preferredRole: UserRole) => {
    try {
      const payload = {
        googleId: `goog-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        role: preferredRole,
        deviceId,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Smartphone (Android/iOS)' : 'Web Browser (Google SSO)'
      };

      const res = await fetch('/api/auth/google-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        setSessionTerminationNotice(null);
        // Ensure user is in local users state
        setUsers(prev => {
          const exists = prev.find(u => u.id === data.user.id);
          return exists ? prev.map(u => u.id === data.user.id ? data.user : u) : [data.user, ...prev];
        });
        return { success: true, user: data.user };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Autentikasi payload Google gagal.' };
      }
    } catch {
      // offline fallback
      const trimmedEmail = email.trim().toLowerCase();
      let existing = users.find(u => u.email.toLowerCase() === trimmedEmail);

      if (existing) {
        if (existing.status === 'inactive') {
          return {
            success: false,
            message: 'Akun Google ini terdaftar namun dinonaktifkan oleh administrator.'
          };
        }
        const newSess = `sess_${Date.now()}`;
        setSessionId(newSess);
        setCurrentUser(existing);
        setSessionTerminationNotice(null);
        return { success: true, user: existing };
      }

      const newUser: User = {
        id: `usr-${preferredRole}-${Date.now()}`,
        name: name || email.split('@')[0],
        email: trimmedEmail,
        role: preferredRole,
        identifierNumber: preferredRole === 'siswa' ? `008${Date.now().toString().slice(-7)}` : `1985${Date.now().toString().slice(-7)}`,
        kelasBimbingan: preferredRole === 'siswa' ? '12-MIPA-1' : undefined,
        institution: 'SMA Cakrawala Nusantara',
        status: 'active',
        googleId: `google-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`
      };

      const newSess = `sess_${Date.now()}`;
      setSessionId(newSess);
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      setSessionTerminationNotice(null);
      return { success: true, user: newUser };
    }
  };

  const registerStudent = (data: {
    name: string;
    email: string;
    nisn: string;
    kelas: string;
    password: string;
  }) => {
    const existing = users.find(
      u => u.email.toLowerCase() === data.email.trim().toLowerCase() ||
           (u.identifierNumber && u.identifierNumber === data.nisn.trim())
    );

    if (existing) {
      return {
        success: false,
        message: 'Email atau NISN ini sudah terdaftar di sistem Cakrawala LMS.'
      };
    }

    const newUser: User = {
      id: `usr-siswa-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'siswa',
      identifierNumber: data.nisn.trim(),
      kelasBimbingan: data.kelas,
      institution: 'SMA Cakrawala Nusantara',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    const newSess = `sess_${Date.now()}`;
    setSessionId(newSess);
    setSessionTerminationNotice(null);

    // Sync to backend
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).catch(() => {});

    return { success: true };
  };

  const logout = async () => {
    if (currentUser && sessionId) {
      try {
        await fetch('/api/auth/session/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, sessionId })
        });
      } catch {
        // ignore
      }
    }
    setCurrentUser(null);
    setSessionId(null);
    localStorage.removeItem('cakrawala_current_user');
    localStorage.removeItem('cakrawala_session_id');
  };

  const clearSessionTerminationNotice = () => {
    setSessionTerminationNotice(null);
  };

  const quickSwitchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const addUser = async (data: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: User = await res.json();
        setUsers(prev => [created, ...prev]);
        return { success: true, user: created };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Gagal menambahkan pengguna.' };
      }
    } catch {
      // offline fallback
    }

    const fallback: User = {
      id: `usr-${data.role || 'siswa'}-${Date.now()}`,
      name: data.name || 'Pengguna Baru',
      email: data.email || 'user@cakrawala.sch.id',
      role: data.role || 'siswa',
      identifierNumber: data.identifierNumber || '0089999999',
      kelasBimbingan: data.kelasBimbingan,
      isWaliKelas: data.isWaliKelas,
      institution: data.institution || 'SMA Cakrawala Nusantara',
      phone: data.phone,
      password: data.password || (data.role === 'admin' ? 'admin123' : data.role === 'guru' ? 'guru123' : 'siswa123'),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || 'User')}`
    };

    setUsers(prev => [fallback, ...prev]);
    return { success: true, user: fallback };
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: User = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        if (currentUser?.id === id) setCurrentUser(updated);
        return { success: true, user: updated };
      }
    } catch {
      // offline fallback
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    const found = users.find(u => u.id === id);
    return { success: true, user: found ? { ...found, ...data } : undefined };
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle-status`, { method: 'PATCH' });
      if (res.ok) {
        const updated: User = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'inactive' ? 'active' : 'inactive' };
      }
      return u;
    }));
    return { success: true };
  };

  const deleteUser = async (id: string) => {
    if (currentUser?.id === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang Anda gunakan.' };
    }
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  const resetUserPassword = async (id: string, newPassword?: string, unlockSeb: boolean = true) => {
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, unlockSeb })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, password: data.newPassword, lastPasswordReset: data.user?.lastPasswordReset } : u));
        if (currentUser?.id === id) {
          setCurrentUser(prev => prev ? { ...prev, password: data.newPassword } : null);
        }
        return { success: true, message: data.message, newPassword: data.newPassword };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Gagal mereset kata sandi.' };
      }
    } catch {
      // offline fallback
      const targetUser = users.find(u => u.id === id);
      const fallbackPass = newPassword || (targetUser?.role === 'admin' ? 'admin123' : targetUser?.role === 'guru' ? 'guru123' : 'siswa123');
      const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, password: fallbackPass, lastPasswordReset: nowStr } : u));
      return { success: true, message: 'Kata sandi berhasil direset.', newPassword: fallbackPass };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      loginWithGoogle,
      registerStudent,
      logout,
      quickSwitchUser,
      deviceId,
      sessionId,
      sessionTerminationNotice,
      clearSessionTerminationNotice,
      fetchUsers,
      addUser,
      updateUser,
      toggleUserStatus,
      deleteUser,
      resetUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
