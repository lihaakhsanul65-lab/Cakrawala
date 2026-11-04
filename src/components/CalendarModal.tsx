import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CalendarCategory, CalendarEvent } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Clock, 
  Trash2, 
  Tag, 
  Users, 
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassFilter?: string;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, targetClassFilter }) => {
  const { events, createEvent, deleteEvent } = useCalendar();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 21)); // October 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-25');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CalendarCategory>('tugas');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [targetClass, setTargetClass] = useState(targetClassFilter || 'Semua');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isTeacherOrAdmin = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date(2026, 9, 21);
    setCurrentDate(today);
    setSelectedDateStr('2026-10-21');
  };

  // Filter events based on class
  const filteredEvents = events.filter(e => {
    if (currentUser?.role === 'siswa' && currentUser.kelasBimbingan) {
      return e.targetClass === 'Semua' || e.targetClass === currentUser.kelasBimbingan;
    }
    return true;
  });

  const eventsOnSelectedDate = filteredEvents.filter(e => e.date === selectedDateStr);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDateStr) return;

    setIsSubmitting(true);
    const res = await createEvent({
      title: title.trim(),
      description: description.trim(),
      date: selectedDateStr,
      startTime,
      endTime,
      category,
      targetClass,
      courseTitle: targetClass === 'Semua' ? 'Umum / Institusi' : `Kelas ${targetClass}`,
      creatorId: currentUser?.id || 'usr-guru-01',
      creatorName: currentUser?.name || 'Pendidik',
      creatorRole: currentUser?.role || 'guru'
    });

    setIsSubmitting(false);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Agenda Ditambahkan',
        message: `Kegiatan "${title}" berhasil dijadwalkan pada ${selectedDateStr}.`
      });
      setTitle('');
      setDescription('');
      setIsAddEventOpen(false);
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Menambah Agenda',
        message: res.message || 'Terjadi gangguan saat menyimpan ke server.'
      });
    }
  };

  const handleDeleteEvent = async (id: string, eventTitle: string) => {
    if (!window.confirm(`Hapus kegiatan "${eventTitle}" dari kalender?`)) return;
    const res = await deleteEvent(id);
    if (res.success) {
      showNotification({
        type: 'info',
        title: 'Agenda Dihapus',
        message: `Kegiatan "${eventTitle}" telah dihapus.`
      });
    }
  };

  const categoryColor = (cat: CalendarCategory) => {
    switch (cat) {
      case 'tugas': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'kuis': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'ujian': return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'pertemuan': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'akademik': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const categoryBadgeColor = (cat: CalendarCategory) => {
    switch (cat) {
      case 'tugas': return 'bg-amber-500';
      case 'kuis': return 'bg-blue-600';
      case 'ujian': return 'bg-rose-600';
      case 'pertemuan': return 'bg-purple-600';
      case 'akademik': return 'bg-emerald-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Kalender Akademik & Agenda Terpadu
              </h2>
              <p className="text-xs text-slate-500">
                Jadwal tugas, kuis, ujian SEB, dan kegiatan perkuliahan aktif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTeacherOrAdmin && (
              <button
                onClick={() => setIsAddEventOpen(!isAddEventOpen)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddEventOpen ? 'Tutup Formulir' : 'Tambah Agenda'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Calendar Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Month & Navigation Header */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  {monthNames[month]} {year}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Semester Ganjil
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="p-1 text-slate-600 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 text-slate-600 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider">
              <div className="py-1 text-rose-600">Min</div>
              <div className="py-1">Sen</div>
              <div className="py-1">Sel</div>
              <div className="py-1">Rab</div>
              <div className="py-1">Kam</div>
              <div className="py-1">Jum</div>
              <div className="py-1 text-blue-600">Sab</div>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDateStr === formattedDateStr;
                const isToday = formattedDateStr === '2026-10-21';

                const dayEvents = filteredEvents.filter(e => e.date === formattedDateStr);

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDateStr(formattedDateStr)}
                    className={`h-16 sm:h-20 p-1.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40'
                        : isToday
                        ? 'border-blue-300 bg-blue-50/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold leading-none ${
                        isToday ? 'px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px]' : 'text-slate-800'
                      }`}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-bold px-1 rounded-full bg-slate-200 text-slate-700">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event category indicator dots */}
                    <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-7">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div
                          key={idx}
                          title={e.title}
                          className={`w-2 h-2 rounded-full ${categoryBadgeColor(e.category)}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] font-bold text-slate-400">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-slate-600">
              <span className="font-bold text-slate-400 uppercase">Kategori:</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Tugas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Kuis</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600"></span> Ujian SEB</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Pertemuan</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Akademik</span>
            </div>

          </div>

          {/* Right Column: Events on Selected Date & Add Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Add Event Form (For Teacher / Admin) */}
            {isAddEventOpen && isTeacherOrAdmin && (
              <form onSubmit={handleCreateEvent} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Jadwalkan Agenda ({selectedDateStr})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Kegiatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kuis Harian Limit Trigonometri"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CalendarCategory)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="tugas">Tugas</option>
                      <option value="kuis">Kuis</option>
                      <option value="ujian">Ujian SEB</option>
                      <option value="pertemuan">Pertemuan Kelas</option>
                      <option value="akademik">Kegiatan Akademik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sasaran Kelas *</label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="Semua">Semua Kelas</option>
                      <option value="12-MIPA-1">12-MIPA-1</option>
                      <option value="12-MIPA-2">12-MIPA-2</option>
                      <option value="12-MIPA-3">12-MIPA-3</option>
                      <option value="11-MIPA-1">11-MIPA-1</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Waktu Mulai</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Waktu Selesai</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Petunjuk</label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan petunjuk pengerjaan atau ruangan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan ke Kalender'}
                </button>
              </form>
            )}

            {/* Agenda List for Selected Date */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h4 className="font-extrabold text-xs text-slate-900">
                    Agenda: {selectedDateStr}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {eventsOnSelectedDate.length} Kegiatan
                </span>
              </div>

              {eventsOnSelectedDate.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <p>Tidak ada kegiatan yang dijadwalkan pada tanggal ini.</p>
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => setIsAddEventOpen(true)}
                      className="text-blue-600 font-bold hover:underline text-[11px] cursor-pointer inline-flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" /> Tambah Agenda Baru
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {eventsOnSelectedDate.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${categoryColor(ev.category)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase bg-white/80">
                              {ev.category}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {ev.targetClass}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-900 mt-1">
                            {ev.title}
                          </h5>
                        </div>

                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-black/5 pt-1.5">
                        <span className="flex items-center gap-1 font-mono font-semibold">
                          <Clock className="w-3 h-3" /> {ev.startTime} - {ev.endTime}
                        </span>
                        <span>Oleh: {ev.creatorName}</span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
