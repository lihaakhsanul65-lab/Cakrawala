import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../types';
import { CalendarModal } from './CalendarModal';
import { DeviceCameraModal } from './DeviceCameraModal';
import { AVAILABLE_CLASSES } from '../data/mockData';
import { 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  ChevronDown, 
  Menu, 
  X, 
  ArrowRight,
  Cpu,
  BookOpen,
  Award,
  Database,
  Brain,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckCheck,
  Info,
  Send,
  AlertTriangle,
  Megaphone,
  Smartphone,
  Laptop,
  Camera
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string | UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, logout, users, quickSwitchUser, sessionTerminationNotice, clearSessionTerminationNotice } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { 
    globalNotifications, 
    unreadCount, 
    dispatchNotification, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isNotificationRead
  } = useNotification();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Dispatch Notification Modal state (For Admin & Guru)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchType, setDispatchType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [dispatchTargetType, setDispatchTargetType] = useState<'all' | 'class' | 'user'>('all');
  const [dispatchTargetClass, setDispatchTargetClass] = useState<string>('12-MIPA-1');
  const [dispatchTargetUserId, setDispatchTargetUserId] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchMessage.trim()) return;

    setIsDispatching(true);
    await dispatchNotification({
      title: dispatchTitle.trim(),
      message: dispatchMessage.trim(),
      type: dispatchType,
      targetType: dispatchTargetType,
      targetClass: dispatchTargetType === 'class' ? dispatchTargetClass : undefined,
      targetUserId: dispatchTargetType === 'user' ? dispatchTargetUserId : undefined,
      authorName: currentUser?.name || 'Administrator',
      authorRole: currentUser?.role || 'admin'
    });

    setIsDispatching(false);
    setIsDispatchModalOpen(false);
    setDispatchTitle('');
    setDispatchMessage('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')} 
                className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                      CAKRAWALA
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wider">
                      LMS v4.2
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                    Learning Management System
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
              {currentUser && (
                <button 
                  onClick={() => onNavigate('dashboard')} 
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'dashboard' 
                      ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dasbor
                </button>
              )}

              <button 
                onClick={() => onNavigate('catalog')} 
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'catalog' 
                    ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Kursus & Silabus
              </button>

              {/* Student Specific Links */}
              {currentUser?.role === 'siswa' && (
                <>
                  <button 
                    onClick={() => onNavigate('exam', 'asg-mat-01')} 
                    className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      currentView === 'exam' 
                        ? 'text-emerald-700 bg-emerald-50 font-bold border-b-2 border-emerald-600' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ujian SEB</span>
                  </button>
                  <button 
                    onClick={() => onNavigate('student-results')} 
                    className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      currentView === 'student-results' 
                        ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                        : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Buku Nilai
                  </button>
                </>
              )}

              {/* Teacher & Admin Specific Links */}
              {(currentUser?.role === 'guru' || currentUser?.role === 'admin') && (
                <>
                  <button 
                    onClick={() => onNavigate('teacher-review')} 
                    className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      currentView === 'teacher-review' 
                        ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                        : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>Penilaian & Review AI</span>
                  </button>

                  {currentUser?.isWaliKelas && (
                    <button 
                      onClick={() => onNavigate('rapor')} 
                      className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        currentView === 'rapor' 
                          ? 'text-indigo-700 bg-indigo-50 font-bold border-b-2 border-indigo-600' 
                          : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Rapor Kelas</span>
                    </button>
                  )}
                </>
              )}

              {/* Admin Exclusive Links */}
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => onNavigate('admin-users')} 
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'admin-users' 
                      ? 'text-purple-700 bg-purple-50 font-bold border-b-2 border-purple-600' 
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Manajemen User</span>
                </button>
              )}

              {/* Shared Calendar & Google Calendar Link */}
              {currentUser && (
                <button 
                  onClick={() => onNavigate('calendar')} 
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'calendar' 
                      ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kalender</span>
                </button>
              )}

              {/* Dual Storage (Admin & Guru) */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'guru') && (
                <button 
                  onClick={() => onNavigate('backup-drive')} 
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'backup-drive' 
                      ? 'text-blue-600 bg-blue-50 font-bold border-b-2 border-blue-600' 
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dual Storage</span>
                </button>
              )}

              {/* Google Workspace Suite Hub (Sheets, Gmail, Docs, Forms, Meet) */}
              {currentUser && (
                <button 
                  onClick={() => onNavigate('google-workspace')} 
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'google-workspace' 
                      ? 'text-emerald-700 bg-emerald-50 font-bold border-b-2 border-emerald-600' 
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Google Sheets, Gmail, Docs, Forms, dan Meet"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Suite</span>
                </button>
              )}
            </nav>

            {/* Right Action Icons & User Controls */}
            <div className="flex items-center gap-2">

              {/* Calendar Quick Launcher */}
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer relative"
                title="Buka Kalender Akademik & Agenda"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>

              {/* Centralized Global Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer relative"
                  title="Pusat Notifikasi & Pengumuman"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
                    onMouseLeave={() => setNotificationsOpen(false)}
                  >
                    {/* Header with Title and Actions */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span>Notifikasi</span>
                        </span>
                        {unreadCount > 0 ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            {unreadCount} Baru
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Semua Terbaca
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Mark All As Read Button */}
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllNotificationsAsRead(currentUser?.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 border border-blue-200 shadow-2xs"
                            title="Tandai semua notifikasi sudah dibaca"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tandai Semua Dibaca</span>
                          </button>
                        )}

                        {/* Admin & Teacher broadcast button */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'guru') && (
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              setIsDispatchModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Sebarkan pengumuman baru"
                          >
                            <Megaphone className="w-3 h-3" />
                            <span>Kirim Alert</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-3 text-[11px] font-semibold">
                      <button
                        onClick={() => setNotifFilter('all')}
                        className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                          notifFilter === 'all' 
                            ? 'bg-white text-slate-900 shadow-xs font-bold' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua ({globalNotifications.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter('unread')}
                        className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                          notifFilter === 'unread' 
                            ? 'bg-white text-blue-700 shadow-xs font-bold' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Belum Dibaca ({unreadCount})
                      </button>
                    </div>

                    {/* Notification List */}
                    {globalNotifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada notifikasi aktif saat ini.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {globalNotifications
                          .filter((n) => {
                            if (notifFilter === 'unread') {
                              return !isNotificationRead(n, currentUser?.id);
                            }
                            return true;
                          })
                          .map((n) => {
                            const isRead = isNotificationRead(n, currentUser?.id);
                            return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  if (!isRead) {
                                    markNotificationAsRead(n.id, currentUser?.id);
                                  }
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                                  isRead 
                                    ? 'bg-slate-50/70 border-slate-200/70 text-slate-600 opacity-80 hover:opacity-100' 
                                    : 'bg-blue-50/60 border-blue-200 text-slate-800 shadow-xs hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${isRead ? 'bg-slate-300' : 'bg-blue-600 animate-pulse'}`} />
                                      <span className="font-bold text-xs text-slate-900 truncate">{n.title}</span>
                                      
                                      {/* Status Tag */}
                                      {!isRead ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-extrabold uppercase tracking-wider">
                                          Baru
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-600 font-medium">
                                          Sudah Dibaca
                                        </span>
                                      )}

                                      {n.targetType === 'class' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                          {n.targetClass}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[11px] text-slate-600 leading-relaxed break-words">{n.message}</p>
                                    
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                                      <span>Dari: {n.authorName} ({n.authorRole})</span>
                                      <span>{n.timestamp}</span>
                                    </div>
                                  </div>

                                  {/* Individual Mark As Read Button */}
                                  {!isRead && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(n.id, currentUser?.id);
                                      }}
                                      title="Tandai Sudah Dibaca"
                                      className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-300 transition cursor-pointer shrink-0 shadow-2xs"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        
                        {/* If filter has no results */}
                        {notifFilter === 'unread' && unreadCount === 0 && (
                          <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="font-semibold text-slate-700">Semua notifikasi sudah dibaca!</p>
                            <p className="text-[11px] text-slate-400">Tidak ada pengumuman baru yang tertunda.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Quick Action */}
                    {unreadCount > 0 && (
                      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{unreadCount} pesan belum dibuka</span>
                        <button
                          onClick={() => markAllNotificationsAsRead(currentUser?.id)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Tandai Semua Selesai</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    language === 'id' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bahasa Indonesia"
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    language === 'en' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>

              {/* User Profile Dropdown */}
              {currentUser ? (
                <div className="relative">
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30 bg-slate-100" 
                    />
                    <div className="text-left hidden md:block leading-tight">
                      <p className="font-bold text-xs text-slate-800 max-w-[120px] truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize font-medium">{currentUser.role}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="font-bold text-xs text-slate-900">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-blue-600">
                          <span className="capitalize">{currentUser.role}</span>
                          {currentUser.identifierNumber && (
                            <span>• {currentUser.identifierNumber}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('catalog');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Katalog Kursus & Materi</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsCameraModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                        title="Buka Kamera Depan & Belakang Perangkat"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Kamera Perangkat (Depan & Belakang)</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          onNavigate('landing');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onNavigate('login')} 
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
                  >
                    Masuk
                  </button>
                  <button 
                    onClick={() => onNavigate('register')} 
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Daftar Siswa
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Menu Navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
            {currentUser && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 mb-2 border border-slate-200">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser.role} • {currentUser.email}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-1 text-xs font-semibold text-slate-700">
              {currentUser && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
                  className={`w-full text-left p-2.5 rounded-xl transition ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                >
                  Dasbor
                </button>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('catalog'); }}
                className={`w-full text-left p-2.5 rounded-xl transition ${currentView === 'catalog' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
              >
                Kursus & Silabus
              </button>

              {currentUser?.role === 'siswa' && (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('exam', 'asg-mat-01'); }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'exam' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-emerald-700 hover:bg-emerald-50'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ujian SEB</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('student-results'); }}
                    className={`w-full text-left p-2.5 rounded-xl transition ${currentView === 'student-results' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    Buku Nilai
                  </button>
                </>
              )}

              {(currentUser?.role === 'guru' || currentUser?.role === 'admin') && (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('teacher-review'); }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'teacher-review' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>Penilaian & Review AI</span>
                  </button>
                  {currentUser?.isWaliKelas && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); onNavigate('rapor'); }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'rapor' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-indigo-50'}`}
                    >
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>Rapor Kelas</span>
                    </button>
                  )}
                </>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-users'); }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'admin-users' ? 'bg-purple-50 text-purple-700 font-bold' : 'hover:bg-purple-50'}`}
                >
                  <Database className="w-4 h-4 text-purple-600" />
                  <span>Manajemen User</span>
                </button>
              )}

              {currentUser && (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('calendar'); }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'calendar' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span>Kalender Akademik</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('google-workspace'); }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'google-workspace' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Google Suite</span>
                  </button>
                  {(currentUser.role === 'admin' || currentUser.role === 'guru') && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); onNavigate('backup-drive'); }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${currentView === 'backup-drive' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                    >
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span>Dual Storage</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {currentUser ? (
              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    onNavigate('landing');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('login'); }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs text-center"
                >
                  Masuk
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('register'); }}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs text-center shadow-xs"
                >
                  Daftar Siswa
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      )}

      {/* Device Camera Modal (Front & Rear Integrated Camera) */}
      {isCameraModalOpen && (
        <DeviceCameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
        />
      )}

      {/* Dispatch Notification Modal (Admin & Guru Central Engine) */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <span>Kirim Notifikasi / Pengumuman Terpusat</span>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Penerima:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchTargetType('all')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition ${
                      dispatchTargetType === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Semua Siswa & Guru
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchTargetType('class')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition ${
                      dispatchTargetType === 'class' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Kelompok Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchTargetType('user')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition ${
                      dispatchTargetType === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Siswa Spesifik
                  </button>
                </div>
              </div>

              {dispatchTargetType === 'class' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Kelas:</label>
                  <select
                    value={dispatchTargetClass}
                    onChange={(e) => setDispatchTargetClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    {AVAILABLE_CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {dispatchTargetType === 'user' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Siswa:</label>
                  <select
                    value={dispatchTargetUserId}
                    onChange={(e) => setDispatchTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">-- Pilih Siswa Penerima --</option>
                    {users.filter(u => u.role === 'siswa').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.kelasBimbingan || s.identifierNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Alert:</label>
                <select
                  value={dispatchType}
                  onChange={(e) => setDispatchType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="info">Informasi (Biru)</option>
                  <option value="success">Sukses / Pengumuman Positif (Hijau)</option>
                  <option value="warning">Peringatan Jadwal / Tenggat (Kuning)</option>
                  <option value="alert">Pemberitahuan Mendesak / Ujian (Merah)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman:</label>
                <input
                  type="text"
                  required
                  value={dispatchTitle}
                  onChange={(e) => setDispatchTitle(e.target.value)}
                  placeholder="Misal: Perubahan Jadwal Pertemuan / Materi Tambahan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan Notifikasi:</label>
                <textarea
                  rows={3}
                  required
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  placeholder="Tuliskan detail pengumuman yang akan muncul pada ikon lonceng siswa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-blue-600 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatching ? 'Mengirim...' : 'Kirim Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual Login / Single Active Session Termination Dialog */}
      {sessionTerminationNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-300 shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 py-1 px-3 rounded-full w-fit mx-auto">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Single Active Session Enforced</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Sesi Perangkat Anda Diakhiri
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {sessionTerminationNotice}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-left text-[11px] text-slate-600 space-y-1 border border-slate-200">
              <div className="font-bold text-slate-800">Kebijakan Keamanan Institusi:</div>
              <p>Untuk menjaga integritas ujian dan perlindungan data akademik, LMS hanya memperbolehkan satu perangkat aktif dalam satu waktu.</p>
            </div>
            <button
              onClick={() => {
                clearSessionTerminationNotice();
                onNavigate('login');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Mengerti & Masuk Kembali
            </button>
          </div>
        </div>
      )}
    </>
  );
};
