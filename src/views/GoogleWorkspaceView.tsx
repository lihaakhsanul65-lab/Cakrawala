import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHomeroom } from '../context/HomeroomContext';
import { useExam } from '../context/ExamContext';
import { useCourse } from '../context/CourseContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { useNotification } from '../context/NotificationContext';
import { testFirestoreConnection } from '../services/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  FileSpreadsheet, 
  Mail, 
  FileText, 
  FormInput, 
  Video, 
  ExternalLink, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  RefreshCw,
  FolderSync,
  Calendar,
  Layers,
  ArrowRight,
  HardDrive,
  Presentation,
  MousePointer,
  Database,
  Flame,
  Trash2,
  Eye,
  FileCheck,
  Search,
  Upload
} from 'lucide-react';
import { PickedGoogleFile } from '../services/googleWorkspace';

interface GoogleWorkspaceViewProps {
  onNavigate: (view: string, param?: string) => void;
}

type WorkspaceTab = 
  | 'drive' 
  | 'sheets' 
  | 'gmail' 
  | 'calendar' 
  | 'docs' 
  | 'slides' 
  | 'forms' 
  | 'picker' 
  | 'firebase';

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { reportCards } = useHomeroom();
  const { assignments, submissions } = useExam();
  const { courses } = useCourse();
  const { 
    isGoogleConnected, 
    googleUser, 
    isConnecting, 
    connectGoogle, 
    disconnectGoogle,
    driveBackups,
    isLoadingDrive,
    refreshDriveBackups,
    deleteFromDrive,
    dedicatedFolder,
    folderFiles,
    isSyncingTwoWay,
    lastSyncTime,
    triggerTwoWaySync,
    calendarEvents,
    isLoadingCalendar,
    refreshCalendarEvents,
    addToCalendar,
    syncLmsEventsToCalendar,
    createSheet,
    sendEmail,
    createDoc,
    createForm,
    getFormAnswers,
    createMeetRoom,
    createSlidePresentation,
    pickFileWithGooglePicker
  } = useGoogleWorkspace();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('drive');

  // Sheets state
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [createdSheets, setCreatedSheets] = useState<Array<{ id: string; title: string; url: string; timestamp: string }>>([]);

  // Gmail state
  const [recipientEmail, setRecipientEmail] = useState('siswa@cakrawala.sch.id');
  const [emailSubject, setEmailSubject] = useState('Pemberitahuan Capaian Belajar & Rapor Akademik');
  const [emailBody, setEmailBody] = useState(
    'Yth. Siswa & Orang Tua/Wali,\n\nBerikut kami informasikan bahwa nilai evaluasi blok dan modul pembelajaran telah diperbarui pada sistem Cakrawala LMS. Silakan periksa hasil belajar secara berkala.\n\nSalam hormat,\nPendidik Cakrawala LMS'
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sentEmails, setSentEmails] = useState<Array<{ to: string; subject: string; time: string; id?: string }>>([]);

  // Calendar state
  const [calSummary, setCalSummary] = useState('Ujian Blok Matematika Peminatan');
  const [calDesc, setCalDesc] = useState('Sesi ujian resmi kalkulus menggunakan Safe Exam Browser');
  const [calDate, setCalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('08:00');
  const [calEnd, setCalEnd] = useState('10:00');
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [isSyncingAllEvents, setIsSyncingAllEvents] = useState(false);

  // Docs state
  const [docTitle, setDocTitle] = useState('Silabus & Modul Ajar Matematika Peminatan');
  const [docContent, setDocContent] = useState(
    'MODUL PEMBELAJARAN & SILABUS MATEMATIKA PEMINATAN KELAS XII\n\n1. Identitas Modul:\n- Satuan Pendidikan: SMA Cakrawala Cendekia\n- Fase/Kelas: F / XII\n- Alokasi Waktu: 4 Pertemuan (8 JP)\n\n2. Capaian Pembelajaran:\nPeserta didik mampu memahami konsep turunan fungsi trigonometri, limit fungsi, dan penerapannya dalam pemodelan kalkulus diferensial.\n\n3. Rencana Kegiatan Pembelajaran:\n- Minggu 1: Eksplorasi konsep laju perubahan sesaat.\n- Minggu 2: Teorema aturan rantai turunan trigonometri.\n- Minggu 3: Ujian Blok Terkunci (Safe Exam Browser Cakrawala LMS).'
  );
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocs, setCreatedDocs] = useState<Array<{ id: string; title: string; url: string; time: string }>>([]);

  // Slides state
  const [slideTitle, setSlideTitle] = useState('Slide Pembelajaran: Limit & Turunan Trigonometri');
  const [slideTopic, setSlideTopic] = useState('Kalkulus Lanjut Kelas XII MIPA');
  const [slideBullet1, setSlideBullet1] = useState('Pengantar Teorema Limit Apit dan Sifat Dasar');
  const [slideBullet2, setSlideBullet2] = useState('Pembuktian Rumus Turunan Sinus dan Kosinus');
  const [slideBullet3, setSlideBullet3] = useState('Aplikasi Nilai Maksimum & Minimum dalam Fisika Mekanika');
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [createdSlides, setCreatedSlides] = useState<Array<{ id: string; title: string; url: string; time: string; slidesCount?: number }>>([]);

  // Forms state
  const [formTitle, setFormTitle] = useState('Kuis & Survei Refleksi Pemahaman Belajar');
  const [formDesc, setFormDesc] = useState('Kuesioner diagnostik mandiri untuk mengevaluasi pemahaman materi kalkulus.');
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [createdForms, setCreatedForms] = useState<Array<{ id: string; title: string; url: string; time: string }>>([]);
  const [selectedFormIdForResponses, setSelectedFormIdForResponses] = useState<string>('');
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Picker state
  const [pickerViewType, setPickerViewType] = useState<'all' | 'docs' | 'sheets' | 'slides' | 'forms'>('all');
  const [pickedFiles, setPickedFiles] = useState<PickedGoogleFile[]>([]);
  const [isPickerActive, setIsPickerActive] = useState(false);

  // Firebase state
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<{ connected: boolean; message: string; timestamp: string } | null>(null);

  // Load calendar & drive when connected
  useEffect(() => {
    if (isGoogleConnected) {
      refreshDriveBackups().catch(() => {});
      refreshCalendarEvents().catch(() => {});
    }
  }, [isGoogleConnected, refreshDriveBackups, refreshCalendarEvents]);

  // Initial Firebase check
  useEffect(() => {
    testFirestoreConnection().then(res => {
      setFirebaseStatus({
        connected: res.connected,
        message: res.connected ? 'Terhubung aktif ke Cloud Firestore' : (res.error || 'Terputus'),
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
    });
  }, []);

  // 1. Export Gradebook to Google Sheets
  const handleExportToGoogleSheets = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Ekspor seluruh data rekap nilai siswa (${reportCards.length} siswa) ke lembar kerja baru di Google Sheets Anda?`
    );
    if (!confirmed) return;

    setIsExportingSheet(true);
    try {
      const rows: string[][] = [
        ['REKAPITULASI CAPAIAN NILAI & RAPOR AKADEMIK SISWA'],
        ['Sistem Terpadu Cakrawala LMS — Sinkronisasi Google Sheets'],
        [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB`],
        [],
        ['NIS', 'Nama Lengkap', 'Kelas Bimbingan', 'Mata Pelajaran', 'Nilai Angka', 'Predikat Huruf', 'Catatan Akademik']
      ];

      reportCards.forEach(rc => {
        const primaryGrade = rc.grades && rc.grades[0];
        rows.push([
          rc.nisn || rc.studentId || '-',
          rc.studentName,
          rc.kelas || '12-MIPA-1',
          primaryGrade ? (primaryGrade.courseTitle || (primaryGrade as any).subjectName) : 'Matematika Peminatan',
          String(rc.averageScore || 85),
          rc.averageScore >= 85 ? 'A' : rc.averageScore >= 75 ? 'B' : 'C',
          rc.homeroomNotes || 'Kompetensi tercapai dengan baik'
        ]);
      });

      const title = `Cakrawala LMS - Rekap Nilai Siswa (${new Date().toLocaleDateString('id-ID')})`;
      const res = await createSheet(title, rows);

      if (res.success && res.spreadsheet) {
        showNotification({
          type: 'success',
          title: 'Google Sheet Dibuat',
          message: `Berhasil mengekspor ${reportCards.length} rekaman nilai ke Google Sheets.`
        });
        setCreatedSheets(prev => [
          {
            id: res.spreadsheet!.spreadsheetId,
            title: res.spreadsheet!.title,
            url: res.spreadsheet!.spreadsheetUrl,
            timestamp: new Date().toLocaleTimeString('id-ID')
          },
          ...prev
        ]);
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Ekspor Sheet',
          message: res.error || 'Terjadi kesalahan saat membuat Google Sheets.'
        });
      }
    } finally {
      setIsExportingSheet(false);
    }
  };

  // 2. Send Gmail Message
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    if (!recipientEmail || !emailSubject || !emailBody) {
      showNotification({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Mohon lengkapi penerima, subjek, dan isi pesan.'
      });
      return;
    }

    const confirmed = window.confirm(
      `Konfirmasi pengiriman pesan email resmi melalui akun Gmail Anda ke: ${recipientEmail}?\n\nSubjek: ${emailSubject}`
    );
    if (!confirmed) return;

    setIsSendingEmail(true);
    try {
      const res = await sendEmail(recipientEmail, emailSubject, emailBody);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Email Terkirim',
          message: `Pemberitahuan resmi berhasil dikirim ke ${recipientEmail} via Gmail API.`
        });
        setSentEmails(prev => [
          {
            to: recipientEmail,
            subject: emailSubject,
            time: new Date().toLocaleTimeString('id-ID'),
            id: res.id
          },
          ...prev
        ]);
        setEmailBody('');
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Mengirim Email',
          message: res.error || 'Terjadi kendala saat mengirim pesan melalui Gmail.'
        });
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 3. Add Google Calendar Event
  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Tambahkan agenda "${calSummary}" pada tanggal ${calDate} (${calStart} - ${calEnd}) ke Google Calendar Anda?`
    );
    if (!confirmed) return;

    setIsAddingCalendar(true);
    try {
      const res = await addToCalendar({
        summary: calSummary,
        description: calDesc,
        date: calDate,
        startTime: calStart,
        endTime: calEnd,
        location: 'Ruang Ujian Safe Exam Browser - Cakrawala LMS'
      });

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Agenda Ditambahkan',
          message: `Agenda "${calSummary}" berhasil disinkronkan ke Google Calendar.`
        });
        await refreshCalendarEvents();
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Menambah Agenda',
          message: res.error || 'Terjadi kendala saat menghubungkan ke Google Calendar.'
        });
      }
    } finally {
      setIsAddingCalendar(false);
    }
  };

  // 4. Batch Sync LMS Academic Events to Calendar
  const handleBatchSyncCalendar = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const sampleEvents = [
      {
        id: 'ev-1',
        title: 'Ujian Blok 1: Kalkulus Lanjut & Limit Trigonometri (SEB)',
        description: 'Ujian semester menggunakan penguncian layar Safe Exam Browser Cakrawala LMS.',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        category: 'exam',
        targetClass: '12-MIPA-1'
      },
      {
        id: 'ev-2',
        title: 'Sesi Diskusi & Responsi Evaluasi AI Guru Pengampu',
        description: 'Review hasil koreksi cerdas AI Gemini bersama Drs. Bambang Suryono, M.Pd.',
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '15:00',
        category: 'academic',
        targetClass: 'Semua Siswa'
      }
    ];

    const confirmed = window.confirm(
      `Sinkronkan ${sampleEvents.length} agenda akademik LMS ke Google Calendar utama Anda?`
    );
    if (!confirmed) return;

    setIsSyncingAllEvents(true);
    try {
      const res = await syncLmsEventsToCalendar(sampleEvents);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Sinkronisasi Calendar Berhasil',
          message: `${res.syncedCount} agenda berhasil disinkronkan ke Google Calendar Anda.`
        });
        await refreshCalendarEvents();
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Sinkronisasi',
          message: res.error || 'Terjadi kendala saat sinkronisasi batch.'
        });
      }
    } finally {
      setIsSyncingAllEvents(false);
    }
  };

  // 5. Create Google Doc
  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Buat dokumen Google Docs baru "${docTitle}" di akun Google Drive Anda?`
    );
    if (!confirmed) return;

    setIsCreatingDoc(true);
    try {
      const res = await createDoc(docTitle, docContent);
      if (res.success && res.document) {
        showNotification({
          type: 'success',
          title: 'Google Doc Dibuat',
          message: `Dokumen "${res.document.title}" berhasil dibuat di Google Drive Anda.`
        });
        setCreatedDocs(prev => [
          {
            id: res.document!.documentId,
            title: res.document!.title,
            url: res.document!.webViewLink || `https://docs.google.com/document/d/${res.document!.documentId}/edit`,
            time: new Date().toLocaleTimeString('id-ID')
          },
          ...prev
        ]);
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Membuat Doc',
          message: res.error || 'Terjadi kendala saat membuat Google Docs.'
        });
      }
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // 6. Create Google Slides Presentation
  const handleCreateGoogleSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Buat presentasi Google Slides baru "${slideTitle}" dengan materi pembelajaran?`
    );
    if (!confirmed) return;

    setIsCreatingSlide(true);
    try {
      const slides = [
        {
          title: slideTopic,
          subtitle: 'Materi Pembelajaran Resmi Cakrawala LMS',
          bulletPoints: [slideBullet1, slideBullet2, slideBullet3]
        },
        {
          title: 'Rangkuman & Latihan Mandiri',
          subtitle: 'Petunjuk Penugasan Terpadu',
          bulletPoints: [
            'Pahami konsep dasar limit fungsi trigonometri istimewa.',
            'Kerjakan kuis latihan mandiri pada modul LMS.',
            'Evaluasi mandiri sebelum mengikuti Ujian Safe Exam Browser.'
          ]
        }
      ];

      const res = await createSlidePresentation(slideTitle, slides);
      if (res.success && res.presentation) {
        showNotification({
          type: 'success',
          title: 'Google Slides Dibuat',
          message: `Presentasi "${res.presentation.title}" berhasil dibuat di Google Drive.`
        });
        setCreatedSlides(prev => [
          {
            id: res.presentation!.presentationId,
            title: res.presentation!.title,
            url: res.presentation!.webViewLink || `https://docs.google.com/presentation/d/${res.presentation!.presentationId}/edit`,
            time: new Date().toLocaleTimeString('id-ID'),
            slidesCount: res.presentation!.slidesCount
          },
          ...prev
        ]);
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Membuat Slides',
          message: res.error || 'Terjadi kendala saat membuat presentasi Google Slides.'
        });
      }
    } finally {
      setIsCreatingSlide(false);
    }
  };

  // 7. Create Google Form
  const handleCreateGoogleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    const confirmed = window.confirm(
      `Buat formulir Google Forms baru "${formTitle}" di akun Google Anda?`
    );
    if (!confirmed) return;

    setIsCreatingForm(true);
    try {
      const sampleQuestions = [
        {
          title: 'Bagaimana tingkat pemahaman Anda terhadap konsep turunan fungsi trigonometri?',
          options: ['Sangat Paham', 'Cukup Paham', 'Perlu Pendalaman Teori', 'Belum Mengerti']
        },
        {
          title: 'Apakah petunjuk pengerjaan ujian Safe Exam Browser (SEB) mudah dipahami?',
          options: ['Sangat Jelas', 'Cukup Jelas', 'Perlu Penjelasan Guru']
        },
        {
          title: 'Tuliskan topik matematika atau kalkulus yang paling ingin Anda bahas pada sesi tatap muka berikutnya:'
        }
      ];

      const res = await createForm(formTitle, formDesc, sampleQuestions);
      if (res.success && res.form) {
        showNotification({
          type: 'success',
          title: 'Google Form Dibuat',
          message: `Formulir "${res.form.title}" berhasil dibuat dengan pertanyaan diagnostik.`
        });
        setCreatedForms(prev => [
          {
            id: res.form!.formId,
            title: res.form!.title,
            url: res.form!.responderUri,
            time: new Date().toLocaleTimeString('id-ID')
          },
          ...prev
        ]);
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Membuat Form',
          message: res.error || 'Terjadi kesalahan saat membuat Google Forms.'
        });
      }
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Load Form Responses
  const handleLoadFormResponses = async (formId: string) => {
    setSelectedFormIdForResponses(formId);
    setIsLoadingResponses(true);
    try {
      const res = await getFormAnswers(formId);
      if (res.success) {
        setFormResponses(res.responses || []);
        showNotification({
          type: 'info',
          title: 'Respon Formulir Diperbarui',
          message: `Ditemukan ${(res.responses || []).length} respon dari Google Forms.`
        });
      } else {
        showNotification({
          type: 'warning',
          title: 'Belum Ada Respon',
          message: res.error || 'Formulir belum memiliki kiriman respon dari responden.'
        });
      }
    } finally {
      setIsLoadingResponses(false);
    }
  };

  // 8. Open Google Picker
  const handleOpenGooglePicker = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    setIsPickerActive(true);
    try {
      const res = await pickFileWithGooglePicker({ viewType: pickerViewType });
      if (res.success && res.file) {
        setPickedFiles(prev => [res.file!, ...prev]);
        showNotification({
          type: 'success',
          title: 'Berkas Dipilih dari Google Drive',
          message: `Berkas "${res.file.name}" (${res.file.mimeType.split('.').pop()}) berhasil dipilih.`
        });
      } else if (res.error && !res.error.includes('dibatalkan')) {
        showNotification({
          type: 'error',
          title: 'Google Picker',
          message: res.error
        });
      }
    } finally {
      setIsPickerActive(false);
    }
  };

  // 9. Run Firebase Firestore Connection Test
  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirestoreConnection();
      setFirebaseStatus({
        connected: res.connected,
        message: res.connected 
          ? 'Koneksi ke Firestore database aktif & verified' 
          : (res.error || 'Koneksi gagal'),
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      showNotification({
        type: res.connected ? 'success' : 'error',
        title: 'Cloud Firestore Status',
        message: res.connected 
          ? `Terkoneksi ke database ID: ${(firebaseConfig as any).firestoreDatabaseId || 'default'}`
          : 'Gagal terhubung ke Cloud Firestore.'
      });
    } finally {
      setIsTestingFirebase(false);
    }
  };

  // Delete Drive File confirmation handler (MANDATORY per Workspace Skill)
  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus berkas "${fileName}" dari Google Drive Anda?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    const res = await deleteFromDrive(fileId, fileName);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Berkas Dihapus',
        message: `Berkas "${fileName}" berhasil dihapus dari Google Drive.`
      });
      await refreshDriveBackups();
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: res.error || 'Gagal menghapus berkas dari Google Drive.'
      });
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
          <span className="text-slate-800 font-bold">Integrasi Google Workspace Suite & Firebase</span>
        </div>

        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Google Workspace & Firebase Suite
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Drive • Sheets • Gmail • Calendar • Docs • Slides • Forms • Picker • Firestore
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Pusat Integrasi Ekosistem Google & Cloud Firebase
              </h1>
              <p className="text-xs text-slate-500">
                Akses terpadu Google Drive, Sheets, Gmail, Calendar, Docs, Slides, Forms, Picker, dan Cloud Firestore
              </p>
            </div>
          </div>

          {/* Google Auth Status Widget */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {isGoogleConnected && googleUser ? (
              <div className="flex items-center gap-2.5">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google'} className="w-8 h-8 rounded-full border border-blue-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {googleUser.email?.[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                <div className="text-left text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <span>{googleUser.displayName || 'Akun Google'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{googleUser.email}</div>
                </div>
                <button
                  onClick={disconnectGoogle}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer transition ml-1"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectGoogle()}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Suite Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'drive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'sheets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'gmail'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Gmail</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Google Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Google Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('slides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'slides'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Google Slides</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'forms'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FormInput className="w-4 h-4" />
            <span>Google Forms</span>
          </button>

          <button
            onClick={() => setActiveTab('picker')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'picker'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>Google Picker</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'firebase'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Firebase Firestore</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE DRIVE */}
        {activeTab === 'drive' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Folder Sinkronisasi Khusus */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FolderSync className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Folder Khusus & Sinkronisasi Dua Arah Ujian
                    </h3>
                  </div>
                  <button
                    onClick={() => triggerTwoWaySync(submissions, assignments)}
                    disabled={isSyncingTwoWay}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTwoWay ? 'animate-spin' : ''}`} />
                    <span>{isSyncingTwoWay ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Berkas hasil ujian siswa, lembar jawaban Safe Exam Browser, serta spesifikasi tugas otomatis tersinkronisasi dua arah ke Google Drive pada folder <strong>Cakrawala_LMS_Hasil_Ujian_dan_Tugas</strong>.
                </p>

                {dedicatedFolder && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-900">Folder Aktif: {dedicatedFolder.name}</div>
                      <div className="text-[10px] text-blue-700 font-mono">ID: {dedicatedFolder.id}</div>
                    </div>
                    {dedicatedFolder.webViewLink && (
                      <a
                        href={dedicatedFolder.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Folder di Drive</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Berkas Tersinkronisasi ({folderFiles.length})</span>
                    {lastSyncTime && <span className="text-[10px] text-slate-400 font-normal">Sinkronisasi terakhir: {lastSyncTime}</span>}
                  </div>

                  {folderFiles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Belum ada berkas hasil ujian di folder sinkronisasi. Tekan "Sinkronkan Sekarang" untuk mengunggah pengerjaan siswa.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {folderFiles.map(f => (
                        <div key={f.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-2 rounded-lg">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>{f.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {f.type === 'exam_submission' ? 'Hasil Ujian Siswa' : 'Spesifikasi Tugas'} • {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('id-ID') : '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                title="Buka di Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteDriveFile(f.id, f.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Hapus Berkas dari Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cadangan & Berkas Drive Lainnya */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Berkas Cadangan Drive
                    </h3>
                  </div>
                  <button
                    onClick={() => refreshDriveBackups()}
                    className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Muat Ulang"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Daftar berkas arsip dan cadangan sistem Cakrawala LMS yang tersimpan di Google Drive pengguna.
                </p>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {driveBackups.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Tidak ada arsip cadangan di Drive.
                    </div>
                  ) : (
                    driveBackups.map(file => (
                      <div key={file.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {file.createdTime ? new Date(file.createdTime).toLocaleDateString('id-ID') : '-'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteDriveFile(file.id, file.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE SHEETS */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Ekspor Lembar Nilai & Rekapitulasi Akademik ke Google Sheets
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Buat lembar kerja Google Sheets resmi secara otomatis berisi data seluruh nilai rapor, capaian evaluasi blok, dan rekapitulasi penilaian kurikulum merdeka. Lembar kerja dapat dibagikan langsung kepada tim kurikulum dan pengawas sekolah.
              </p>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-emerald-900">Rekap Nilai Siap Diekspor: {reportCards.length} Siswa</div>
                  <div className="text-[11px] text-emerald-700">Mencakup NIS, nama, kelas, nilai angka, predikat, dan catatan akademik pendidik.</div>
                </div>
                <button
                  onClick={handleExportToGoogleSheets}
                  disabled={isExportingSheet}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isExportingSheet ? 'animate-spin' : ''}`} />
                  <span>{isExportingSheet ? 'Membuat Google Sheet...' : 'Ekspor ke Google Sheets Sekarang'}</span>
                </button>
              </div>

              {createdSheets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-900">Lembar Kerja yang Baru Dibuat:</div>
                  <div className="divide-y divide-slate-100">
                    {createdSheets.map(s => (
                      <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{s.title}</div>
                          <div className="text-[10px] text-slate-400">ID: {s.id} • Dibuat: {s.timestamp}</div>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka di Google Sheets</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GMAIL */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Mail className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Kirim Pemberitahuan & Laporan Nilai via Gmail API
                  </h3>
                </div>

                <form onSubmit={handleSendGmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Email Penerima (Siswa / Orang Tua):</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="contoh: arya.pratama@siswa.cakrawala.sch.id"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Subjek Pesan:</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subjek email pemberitahuan"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Isi Surat / Pesan Resmi:</label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Ketik isi surat di sini..."
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail ? 'Mengirim Surat...' : 'Kirim Email via Gmail'}</span>
                  </button>
                </form>
              </div>

              {/* History Sent Emails */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Riwayat Pengiriman Email
                  </h4>
                </div>

                {sentEmails.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada pengiriman email di sesi ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentEmails.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span className="truncate">{item.to}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{item.subject}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-700" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Sinkronisasi Agenda & Ujian ke Google Calendar
                    </h3>
                  </div>
                  <button
                    onClick={handleBatchSyncCalendar}
                    disabled={isSyncingAllEvents}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <FolderSync className={`w-3.5 h-3.5 ${isSyncingAllEvents ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Semua Jadwal</span>
                  </button>
                </div>

                <form onSubmit={handleAddCalendarEvent} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Agenda / Ujian:</label>
                    <input
                      type="text"
                      value={calSummary}
                      onChange={(e) => setCalSummary(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Deskripsi / Petunjuk Pelaksanaan:</label>
                    <textarea
                      rows={2}
                      value={calDesc}
                      onChange={(e) => setCalDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Tanggal:</label>
                      <input
                        type="date"
                        value={calDate}
                        onChange={(e) => setCalDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Jam Mulai:</label>
                      <input
                        type="time"
                        value={calStart}
                        onChange={(e) => setCalStart(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Jam Selesai:</label>
                      <input
                        type="time"
                        value={calEnd}
                        onChange={(e) => setCalEnd(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingCalendar}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingCalendar ? 'Menyimpan...' : 'Tambah ke Google Calendar'}</span>
                  </button>
                </form>
              </div>

              {/* Agenda Calendar List */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Agenda Terjadwal di Google Calendar
                  </h4>
                  <button
                    onClick={() => refreshCalendarEvents()}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {calendarEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada agenda yang tersinkronisasi.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {calendarEvents.map(ev => (
                      <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span className="truncate">{ev.summary}</span>
                          {ev.htmlLink && (
                            <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString('id-ID') : (ev.start?.date || '-')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Buat Dokumen Silabus & RPP Otomatis di Google Docs
                </h3>
              </div>

              <form onSubmit={handleCreateGoogleDoc} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Judul Dokumen Google Docs:</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Isi Naskah / Rencana Modul:</label>
                  <textarea
                    rows={8}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-mono leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingDoc}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <FileText className={`w-3.5 h-3.5 ${isCreatingDoc ? 'animate-spin' : ''}`} />
                  <span>{isCreatingDoc ? 'Membuat Google Docs...' : 'Buat Dokumen di Google Docs'}</span>
                </button>
              </form>

              {createdDocs.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2 mt-4 text-xs">
                  <div className="font-extrabold text-indigo-900">Dokumen Google Docs yang Baru Saja Dibuat:</div>
                  <div className="divide-y divide-indigo-100">
                    {createdDocs.map(d => (
                      <div key={d.id} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{d.title}</div>
                          <div className="text-[10px] text-slate-500">ID: {d.id} • Dibuat: {d.time}</div>
                        </div>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Google Docs</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE SLIDES */}
        {activeTab === 'slides' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Presentation className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Generator Presentasi & Media Ajar Google Slides
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Buat slide presentasi kuliah interaktif untuk guru pengampu. Presentasi otomatis memiliki layout baku judul dan badan materi, siap disajikan di kelas atau diekspor ke format PDF.
              </p>

              <form onSubmit={handleCreateGoogleSlide} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Judul Berkas Presentasi (Deck Title):</label>
                    <input
                      type="text"
                      value={slideTitle}
                      onChange={(e) => setSlideTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Topik Slide Utama (Subject Topic):</label>
                    <input
                      type="text"
                      value={slideTopic}
                      onChange={(e) => setSlideTopic(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Poin-Poin Pembahasan Materi (Slide Bullet Points):</label>
                  <input
                    type="text"
                    value={slideBullet1}
                    onChange={(e) => setSlideBullet1(e.target.value)}
                    placeholder="Poin 1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={slideBullet2}
                    onChange={(e) => setSlideBullet2(e.target.value)}
                    placeholder="Poin 2"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={slideBullet3}
                    onChange={(e) => setSlideBullet3(e.target.value)}
                    placeholder="Poin 3"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingSlide}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Presentation className={`w-3.5 h-3.5 ${isCreatingSlide ? 'animate-spin' : ''}`} />
                  <span>{isCreatingSlide ? 'Menyusun Slide...' : 'Buat Presentasi Google Slides Sekarang'}</span>
                </button>
              </form>

              {createdSlides.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 mt-4 text-xs">
                  <div className="font-extrabold text-amber-900">Presentasi yang Baru Dibuat:</div>
                  <div className="divide-y divide-amber-100">
                    {createdSlides.map(s => (
                      <div key={s.id} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{s.title}</div>
                          <div className="text-[10px] text-slate-500">ID: {s.id} • {s.slidesCount || 2} Slide • {s.time}</div>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Google Slides</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: GOOGLE FORMS */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FormInput className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Buat Formulir Diagnostik / Kuis Google Forms
                  </h3>
                </div>

                <form onSubmit={handleCreateGoogleForm} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Judul Google Form:</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-hidden transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Deskripsi Formulir / Kuis:</label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-hidden transition leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingForm}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <FormInput className={`w-3.5 h-3.5 ${isCreatingForm ? 'animate-spin' : ''}`} />
                    <span>{isCreatingForm ? 'Membuat Formulir...' : 'Buat Google Form Sekarang'}</span>
                  </button>
                </form>

                {createdForms.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-slate-900">Formulir yang Telah Dibuat:</div>
                    <div className="divide-y divide-slate-100">
                      {createdForms.map(f => (
                        <div key={f.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{f.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Tautan: {f.url}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLoadFormResponses(f.id)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 transition cursor-pointer"
                            >
                              Lihat Respon
                            </button>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex items-center gap-1 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Isi Form</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inspector Responses Panel */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Hasil Respon Formulir Google
                  </h4>
                  {selectedFormIdForResponses && (
                    <button
                      onClick={() => handleLoadFormResponses(selectedFormIdForResponses)}
                      className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingResponses ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                {!selectedFormIdForResponses ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Pilih "Lihat Respon" pada salah satu Google Form di samping untuk memeriksa kiriman jawaban responden.
                  </div>
                ) : isLoadingResponses ? (
                  <div className="p-8 text-center text-xs text-purple-600">
                    Memuat respon melalui Google Forms REST API...
                  </div>
                ) : formResponses.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    Belum ada respon masuk untuk formulir ini.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto text-xs">
                    {formResponses.map((r, idx) => (
                      <div key={r.responseId || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1">
                        <div className="font-bold text-purple-900">Respon #{idx + 1}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {r.responseId} • Tanggal: {r.createTime ? new Date(r.createTime).toLocaleString('id-ID') : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: GOOGLE PICKER */}
        {activeTab === 'picker' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MousePointer className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Google Picker Dialog — Pemilih Berkas Drive Terintegrasi
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Gunakan Google Picker resmi untuk memilih dokumen (Docs), lembar kerja (Sheets), presentasi (Slides), atau formulir (Forms) dari Google Drive pengguna untuk dilampirkan ke silabus materi mingguan atau tugas ujian.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setPickerViewType('all')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      pickerViewType === 'all' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Semua Berkas
                  </button>
                  <button
                    onClick={() => setPickerViewType('docs')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      pickerViewType === 'docs' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Google Docs
                  </button>
                  <button
                    onClick={() => setPickerViewType('sheets')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      pickerViewType === 'sheets' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Google Sheets
                  </button>
                  <button
                    onClick={() => setPickerViewType('slides')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      pickerViewType === 'slides' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Google Slides
                  </button>
                  <button
                    onClick={() => setPickerViewType('forms')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      pickerViewType === 'forms' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Google Forms
                  </button>
                </div>

                <button
                  onClick={handleOpenGooglePicker}
                  disabled={isPickerActive}
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Search className={`w-4 h-4 ${isPickerActive ? 'animate-spin' : ''}`} />
                  <span>Buka Google Picker Drive</span>
                </button>
              </div>

              {pickedFiles.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="text-xs font-extrabold text-slate-900">
                    Berkas yang Dipilih via Google Picker ({pickedFiles.length}):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pickedFiles.map((file, idx) => (
                      <div key={idx} className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <div className="font-extrabold text-slate-900 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            MIME: {file.mimeType} • ID: {file.id}
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-800 font-bold rounded-lg border border-sky-200 flex items-center gap-1 transition shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: FIREBASE CLOUD FIRESTORE */}
        {activeTab === 'firebase' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Cloud Firestore & Firebase Integration Status
                    </h3>
                  </div>
                  <button
                    onClick={handleTestFirebase}
                    disabled={isTestingFirebase}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs rounded-lg border border-orange-200 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                    <span>Uji Koneksi Firestore</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Basis data Cloud Firestore telah terkonfigurasi dan diprovisi pada region <strong>asia-south1</strong> dengan aturan keamanan Zero-Trust (ABAC) yang telah dideploy via backend engine.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project ID</div>
                    <div className="font-mono font-bold text-slate-900">{firebaseConfig.projectId}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firestore Database ID</div>
                    <div className="font-mono font-bold text-slate-900 truncate">
                      {(firebaseConfig as any).firestoreDatabaseId || '(default)'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region Target</div>
                    <div className="font-bold text-slate-900">asia-south1 (Mumbai)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Koneksi Live</div>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{firebaseStatus?.message || 'Aktif'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-2">
                  <div className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span>Skema Entitas & Koleksi Firestore (firebase-blueprint.json)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/users/{'{userId}'}</div>
                      <div className="text-[10px] text-slate-500">Profil & Kredensial</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/courses/{'{courseId}'}</div>
                      <div className="text-[10px] text-slate-500">Mata Pelajaran & Silabus</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/assignments/{'{id}'}</div>
                      <div className="text-[10px] text-slate-500">Ujian & Tugas Terjadwal</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/submissions/{'{id}'}</div>
                      <div className="text-[10px] text-slate-500">Lembar Jawaban Siswa</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/examLocks/{'{lockId}'}</div>
                      <div className="text-[10px] text-slate-500">Kunci SEB & Dispensasi</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-orange-200">
                      <div className="font-bold text-slate-800">/test/connection</div>
                      <div className="text-[10px] text-slate-500">Liveness & Health Probe</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Rules Status */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Keamanan Aturan (Rules Engine)
                  </h4>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Aturan keamanan <strong>firestore.rules</strong> terpasang dan tervalidasi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Dukungan autentikasi ganda: Akun Lokal LMS dan Google Workspace OAuth.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Validasi sanitasi kunci document ID (`isValidId`) aktif mencegah ID poisoning.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
