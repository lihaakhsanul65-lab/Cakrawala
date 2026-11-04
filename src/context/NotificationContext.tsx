import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastNotification, GlobalNotification, UserRole } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationContextType {
  // Toast notifications (ephemeral)
  notifications: ToastNotification[];
  showNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;

  // Centralized Global Notifications (Bell Icon Engine)
  globalNotifications: GlobalNotification[];
  unreadCount: number;
  fetchGlobalNotifications: (userId?: string, role?: UserRole, kelas?: string) => Promise<void>;
  dispatchNotification: (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'alert';
    targetType?: 'all' | 'class' | 'user';
    targetClass?: string;
    targetUserId?: string;
    authorName: string;
    authorRole: UserRole;
    link?: string;
  }) => Promise<{ success: boolean; notification?: GlobalNotification }>;
  markNotificationAsRead: (id: string, userId?: string) => Promise<void>;
  markAllNotificationsAsRead: (userId?: string) => Promise<void>;
  isNotificationRead: (notif: GlobalNotification, userId?: string) => boolean;
  deleteGlobalNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_read_notifs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cakrawala_read_notifs', JSON.stringify(readNotifIds));
    } catch {}
  }, [readNotifIds]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback((notif: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNotif: ToastNotification = {
      ...notif,
      id,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      duration: notif.duration ?? 4500
    };

    setNotifications(prev => [...prev.slice(-4), newNotif]); // Keep max 5 toasts

    if (newNotif.duration && newNotif.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotif.duration);
    }
  }, [removeNotification]);

  // Fetch Centralized Global Notifications from backend
  const fetchGlobalNotifications = useCallback(async (userId?: string, role?: UserRole, kelas?: string) => {
    if (userId) setCurrentUserId(userId);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (role) params.append('role', role);
      if (kelas) params.append('kelas', kelas);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data: GlobalNotification[] = await res.json();
        setGlobalNotifications(data);
      }
    } catch {
      // offline silent fallback
    }
  }, []);

  // Dispatch centralized notification (Admin & Guru authority)
  const dispatchNotification = async (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'alert';
    targetType?: 'all' | 'class' | 'user';
    targetClass?: string;
    targetUserId?: string;
    authorName: string;
    authorRole: UserRole;
    link?: string;
  }) => {
    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        const created: GlobalNotification = result.notification;
        setGlobalNotifications(prev => [created, ...prev]);
        showNotification({
          title: 'Notifikasi Terkirim',
          message: `Pengumuman "${data.title}" berhasil disebarkan.`,
          type: 'success'
        });
        return { success: true, notification: created };
      }
    } catch {
      // fallback
    }

    const fallback: GlobalNotification = {
      id: `notif-${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      targetType: data.targetType || 'all',
      targetClass: data.targetClass,
      targetUserId: data.targetUserId,
      authorName: data.authorName,
      authorRole: data.authorRole,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      readBy: [],
      link: data.link
    };
    setGlobalNotifications(prev => [fallback, ...prev]);
    showNotification({
      title: 'Notifikasi Terkirim (Lokal)',
      message: `Pengumuman "${data.title}" tersimpan di memori.`,
      type: 'info'
    });
    return { success: true, notification: fallback };
  };

  const isNotificationRead = useCallback((notif: GlobalNotification, userId?: string) => {
    if (readNotifIds.includes(notif.id)) return true;
    const target = userId || currentUserId || 'all';
    if (notif.readBy && (notif.readBy.includes(target) || notif.readBy.includes('all'))) {
      return true;
    }
    return false;
  }, [readNotifIds, currentUserId]);

  const markNotificationAsRead = async (id: string, userId?: string) => {
    setReadNotifIds(prev => prev.includes(id) ? prev : [...prev, id]);
    const targetUserId = userId || currentUserId || 'all';
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
    } catch {
      // ignore
    }

    setGlobalNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const currentRead = n.readBy || [];
        return {
          ...n,
          readBy: !currentRead.includes(targetUserId) ? [...currentRead, targetUserId] : currentRead
        };
      }
      return n;
    }));
  };

  const markAllNotificationsAsRead = async (userId?: string) => {
    const allIds = globalNotifications.map(n => n.id);
    setReadNotifIds(prev => Array.from(new Set([...prev, ...allIds])));
    const targetUserId = userId || currentUserId || 'all';
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
    } catch {
      // ignore
    }

    setGlobalNotifications(prev => prev.map(n => {
      const currentRead = n.readBy || [];
      return {
        ...n,
        readBy: !currentRead.includes(targetUserId) ? [...currentRead, targetUserId] : currentRead
      };
    }));

    showNotification({
      title: 'Notifikasi Ditandai',
      message: 'Semua notifikasi berhasil ditandai sudah dibaca.',
      type: 'success'
    });
  };

  const deleteGlobalNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setGlobalNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initial fetch and periodic polling every 6 seconds
  useEffect(() => {
    fetchGlobalNotifications();
    const interval = setInterval(() => {
      fetchGlobalNotifications();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchGlobalNotifications]);

  const unreadCount = globalNotifications.filter(n => !isNotificationRead(n)).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      removeNotification,
      globalNotifications,
      unreadCount,
      fetchGlobalNotifications,
      dispatchNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      isNotificationRead,
      deleteGlobalNotification
    }}>
      {children}
      
      {/* Fixed Toast Container at Top Right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {notifications.map((n) => {
          const bgColors = {
            success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
            error: 'bg-rose-50 border-rose-300 text-rose-950',
            warning: 'bg-amber-50 border-amber-300 text-amber-950',
            info: 'bg-blue-50 border-blue-300 text-blue-950'
          }[n.type];

          const iconColors = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            warning: 'text-amber-600',
            info: 'text-blue-600'
          }[n.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info
          }[n.type];

          return (
            <div
              key={n.id}
              className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${bgColors}`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-xs leading-snug">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed break-words">{n.message}</p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
