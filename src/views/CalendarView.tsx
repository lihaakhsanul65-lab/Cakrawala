import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { CalendarEvent, CalendarCategory } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Tag, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Users,
  BookOpen,
  CalendarCheck2,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface CalendarViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { events, createEvent, updateEvent, deleteEvent } = useCalendar();
  const { showNotification } = useNotification();
  const { t, language } = useLanguage();
  const { 
    isGoogleConnected, 
    googleUser, 
    connectGoogle, 
    disconnectGoogle,
    addToCalendar,
    syncLmsEventsToCalendar,
    calendarEvents,
    refreshCalendarEvents,
    isLoadingCalendar
  } = useGoogleWorkspace();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');
  const [filterClass, setFilterClass] = useState<string>('Semua');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Google Calendar Sync State
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);
  const [syncToGoogleOnSave, setSyncToGoogleOnSave] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('2026-10-24');
  const [eventStart, setEventStart] = useState('08:00');
  const [eventEnd, setEventEnd] = useState('10:00');
  const [eventCategory, setEventCategory] = useState<CalendarCategory>('akademik');
  const [eventTargetClass, setEventTargetClass] = useState('12-MIPA-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date(2026, 9, 21));
    setSelectedDate('2026-10-21');
  };

  // Calendar Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthName = language === 'en' ? monthNamesEn[month] : monthNamesId[month];

  const dayHeadersId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dayHeadersEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayHeaders = language === 'en' ? dayHeadersEn : dayHeadersId;

  // Filter events
  const filteredEvents = events.filter(e => {
    const matchClass = filterClass === 'Semua' || e.targetClass === 'Semua' || e.targetClass === filterClass;
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    return matchClass && matchCat;
  });

  const selectedDateEvents = filteredEvents.filter(e => e.date === selectedDate);

  const openAddModal = (dateStr?: string) => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDesc('');
    setEventDate(dateStr || selectedDate);
    setEventStart('08:00');
    setEventEnd('10:00');
    setEventCategory('akademik');
    setEventTargetClass(currentUser?.kelasBimbingan || '12-MIPA-1');
    setSyncToGoogleOnSave(true);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDesc(ev.description);
    setEventDate(ev.date);
    setEventStart(ev.startTime || '08:00');
    setEventEnd(ev.endTime || '10:00');
    setEventCategory(ev.category);
    setEventTargetClass(ev.targetClass);
    setSyncToGoogleOnSave(true);
    setIsModalOpen(true);
  };

  // Sync all LMS Events to Google Calendar
  const handleSyncAllToGoogleCalendar = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Apakah Anda ingin menyinkronkan seluruh agenda (${filteredEvents.length} kegiatan) dari Cakrawala LMS ke Google Calendar utama (${googleUser?.email})?`
    );
    if (!confirmed) return;

    setIsSyncingAll(true);
    try {
      const res = await syncLmsEventsToCalendar(filteredEvents);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Google Calendar Tersinkron',
          message: `${res.syncedCount} agenda berhasil diekspor langsung ke Google Calendar Anda.`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Sinkronisasi Terkendala',
          message: res.error || 'Gagal menambahkan agenda ke Google Calendar.'
        });
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Sync single event to Google Calendar
  const handleSyncSingleEvent = async (ev: CalendarEvent) => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Tambahkan kegiatan "${ev.title}" tanggal ${ev.date} ke Google Calendar Anda?`
    );
    if (!confirmed) return;

    setSyncingEventId(ev.id);
    try {
      const res = await addToCalendar({
        summary: `[${ev.category.toUpperCase()}] ${ev.title}`,
        description: `${ev.description}\nTarget Kelas: ${ev.targetClass}`,
        date: ev.date,
        startTime: ev.startTime || '08:00',
        endTime: ev.endTime || '10:00'
      });

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Tersimpan di Google Calendar',
          message: `Kegiatan "${ev.title}" berhasil ditambahkan ke Google Calendar.`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Sinkron',
          message: res.error || 'Terjadi kesalahan saat menyinkronkan ke Google Calendar.'
        });
      }
    } finally {
      setSyncingEventId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      showNotification({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Mohon isi judul dan tanggal kegiatan agenda.'
      });
      return;
    }

    setIsSubmitting(true);
    if (editingEvent) {
      const res = await updateEvent(editingEvent.id, {
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        category: eventCategory,
        targetClass: eventTargetClass
      });
      setIsSubmitting(false);
      setIsModalOpen(false);

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Agenda Diperbarui',
          message: `Kegiatan "${eventTitle}" berhasil disimpan ke kalender akademik.`
        });

        // Also sync to Google Calendar if checked
        if (syncToGoogleOnSave && isGoogleConnected) {
          addToCalendar({
            summary: `[${eventCategory.toUpperCase()}] ${eventTitle.trim()}`,
            description: `${eventDesc.trim()}\nTarget: ${eventTargetClass}`,
            date: eventDate,
            startTime: eventStart,
            endTime: eventEnd
          });
        }
      }
    } else {
      const res = await createEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        category: eventCategory,
        targetClass: eventTargetClass,
        courseTitle: 'Matematika Peminatan Kelas XII',
        creatorId: currentUser?.id || 'usr-guru-01',
        creatorName: currentUser?.name || 'Pendidik',
        creatorRole: currentUser?.role || 'guru'
      });
      setIsSubmitting(false);
      setIsModalOpen(false);

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Agenda Dibuat',
          message: `Kegiatan baru "${eventTitle}" berhasil ditambahkan dan disinkronkan.`
        });

        // Also sync to Google Calendar if checked
        if (syncToGoogleOnSave && isGoogleConnected) {
          addToCalendar({
            summary: `[${eventCategory.toUpperCase()}] ${eventTitle.trim()}`,
            description: `${eventDesc.trim()}\nTarget: ${eventTargetClass}`,
            date: eventDate,
            startTime: eventStart,
            endTime: eventEnd
          });
        }
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus agenda "${title}"?`)) return;
    const res = await deleteEvent(id);
    if (res.success) {
      showNotification({
        type: 'info',
        title: 'Agenda Dihapus',
        message: `Kegiatan "${title}" telah dihapus dari kalender.`
      });
    }
  };

  const getCategoryBadge = (cat: CalendarCategory) => {
    switch (cat) {
      case 'tugas':
        return { label: 'Tugas', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'kuis':
        return { label: 'Kuis', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'ujian':
        return { label: 'Ujian SEB', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'pertemuan':
        return { label: 'Pertemuan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'akademik':
      default:
        return { label: 'Akademik', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
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
          <span className="text-slate-800 font-bold">Kalender Akademik & Agenda Pembelajaran</span>
        </div>

        {/* Header Bar with Google Calendar Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Calendar & Agenda System
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Google Calendar Ready
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Kalender Kegiatan & Tenggat Waktu Akademik
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Google Calendar Action Buttons */}
            {isGoogleConnected && googleUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncAllToGoogleCalendar}
                  disabled={isSyncingAll}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Ekspor seluruh agenda ke Google Calendar"
                >
                  <CalendarCheck2 className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkron ke Google Calendar'}</span>
                </button>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center gap-1"
                  title="Buka Google Calendar di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </a>
              </div>
            ) : (
              <button
                onClick={() => connectGoogle()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-2 cursor-pointer transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Hubungkan Google Calendar</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => openAddModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda</span>
              </button>
            )}

            <button
              onClick={goToday}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Google Calendar Connected Banner */}
        {isGoogleConnected && googleUser && (
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Terhubung ke Google Calendar akun <strong>{googleUser.email}</strong>. Seluruh jadwal ujian dan tenggat tugas siap disinkronkan otomatis.
              </span>
            </div>
            <button
              onClick={disconnectGoogle}
              className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer ml-2 shrink-0"
            >
              Putuskan
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600">Filter Kategori:</span>
            {['all', 'tugas', 'kuis', 'ujian', 'pertemuan', 'akademik'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition ${
                  filterCategory === cat 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Kelas:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              <option value="12-MIPA-1">12-MIPA-1</option>
              <option value="12-MIPA-2">12-MIPA-2</option>
              <option value="12-IPS-1">12-IPS-1</option>
            </select>
          </div>
        </div>

        {/* 2-Column Calendar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Monthly Calendar Grid (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {currentMonthName} {year}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 py-1">
              {dayHeaders.map((dh, i) => (
                <div key={i} className={i === 0 ? 'text-rose-500' : ''}>{dh}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/50" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === '2026-10-21';
                const dayEvents = filteredEvents.filter(e => e.date === dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-20 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-300 shadow-2xs' 
                        : isToday
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${
                        isSelected ? 'text-blue-700 font-extrabold' : isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                      }`}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    {/* Small badges */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map(ev => {
                        const b = getCategoryBadge(ev.category);
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${b.color}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-bold pl-1">
                          +{dayEvents.length - 2} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right: Selected Date Agenda List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Agenda Terpilih</span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {selectedDate}
                </h3>
              </div>
              {canManage && (
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              )}
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p>Tidak ada kegiatan terjadwal pada tanggal ini.</p>
                {canManage && (
                  <button
                    onClick={() => openAddModal(selectedDate)}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    + Buat Agenda Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(ev => {
                  const b = getCategoryBadge(ev.category);
                  const isSyncingThis = syncingEventId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}>
                          {b.label}
                        </span>
                        
                        <div className="flex items-center gap-1 text-slate-400">
                          {/* Sync single event to Google Calendar */}
                          <button
                            onClick={() => handleSyncSingleEvent(ev)}
                            disabled={isSyncingThis}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Kirim ke Google Calendar"
                          >
                            <CalendarCheck2 className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-blue-600' : ''}`} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => openEditModal(ev)}
                                className="p-1 hover:text-blue-600 rounded cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(ev.id, ev.title)}
                                className="p-1 hover:text-rose-600 rounded cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{ev.title}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{ev.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ev.startTime || '08:00'} - {ev.endTime || '10:00'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{ev.targetClass}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Modal Add / Edit Event */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingEvent ? 'Ubah Agenda Kegiatan' : 'Tambah Agenda Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Agenda / Ujian:</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Misal: Penilaian Harian Matematika SEB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi & Instruksi:</label>
                  <textarea
                    rows={2}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Instruksi kegiatan belajar atau materi yang dicakup..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal:</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Kelas:</label>
                    <select
                      value={eventTargetClass}
                      onChange={(e) => setEventTargetClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                    >
                      <option value="Semua">Semua Kelas</option>
                      <option value="12-MIPA-1">12-MIPA-1</option>
                      <option value="12-MIPA-2">12-MIPA-2</option>
                      <option value="12-IPS-1">12-IPS-1</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mulai:</label>
                    <input
                      type="time"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selesai:</label>
                    <input
                      type="time"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
                    <select
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value as CalendarCategory)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                    >
                      <option value="akademik">Akademik</option>
                      <option value="ujian">Ujian SEB</option>
                      <option value="kuis">Kuis</option>
                      <option value="tugas">Tugas</option>
                      <option value="pertemuan">Pertemuan</option>
                    </select>
                  </div>
                </div>

                {/* Google Calendar Sync Checkbox */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950">
                    <input
                      type="checkbox"
                      checked={syncToGoogleOnSave}
                      onChange={(e) => setSyncToGoogleOnSave(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Sinkronkan ke Google Calendar Saya</span>
                  </label>
                  <p className="text-[10px] text-blue-700 pl-5 mt-0.5">
                    {isGoogleConnected 
                      ? `Akan langsung menambahkan acara ke Google Calendar akun ${googleUser?.email}` 
                      : 'Hubungkan Google Calendar pada tombol di atas agar tersinkronisasi otomatis.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
