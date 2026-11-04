import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { Course, WeeklySection, CourseResource, User, ForumTopic, ForumPost, CourseIntroMaterial, DigitalAttendance } from '../types';
import { 
  Key, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  FileCheck, 
  BookOpen, 
  Folder, 
  HelpCircle, 
  MessageSquare, 
  Award, 
  Users, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Video, 
  Link as LinkIcon, 
  ExternalLink, 
  Circle, 
  Bot, 
  Send, 
  RefreshCw, 
  Settings, 
  ShieldCheck,
  ShieldAlert,
  X,
  Clock,
  Lock,
  Upload
} from 'lucide-react';
import { MediaAjarTab } from '../components/MediaAjarTab';
import { QuizTab } from '../components/QuizTab';
import { CreateSebExamModal } from '../components/CreateSebExamModal';
import { useExam } from '../context/ExamContext';

interface CourseDetailViewProps {
  courseId: string;
  onNavigate: (view: string, courseIdParam?: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId, onNavigate }) => {
  const { currentUser, users } = useAuth();
  const { assignments, submissions } = useExam();
  const { showNotification } = useNotification();
  const { 
    courses, 
    enrollInCourse, 
    unenrollFromCourse, 
    addWeeklySection, 
    addMaterialToSection, 
    toggleMaterialCompleted,
    addIntroMaterial,
    deleteIntroMaterial,
    recordAttendance,
    fetchAttendance,
    fetchGradebook,
    forums,
    fetchForums,
    createForumTopic,
    addForumPost,
    requestAiForumReply,
    applyAiScaffoldToCourse
  } = useCourses();
  const { t } = useLanguage();

  const course = courses.find(c => c.id === courseId);

  // Active tab inside course view: Moodle Pillars & Learning Media
  const [activeTab, setActiveTab] = useState<'syllabus' | 'media' | 'quizzes' | 'forum' | 'grades' | 'participants'>('syllabus');

  // Teacher edit mode (Moodle "Turn editing on")
  const [isEditMode, setIsEditMode] = useState(false);

  // Expanded weeks state (default: all expanded)
  const [expandedWeeks, setExpandedWeeks] = useState<{ [secId: string]: boolean }>({});

  // Modals state
  const [isAddWeekModalOpen, setIsAddWeekModalOpen] = useState(false);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isAiScaffoldModalOpen, setIsAiScaffoldModalOpen] = useState(false);
  const [isNewForumModalOpen, setIsNewForumModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Intro & Contract Modal state
  const [isAddIntroModalOpen, setIsAddIntroModalOpen] = useState(false);
  const [introTitle, setIntroTitle] = useState('');
  const [introContent, setIntroContent] = useState('');
  const [introFileUrl, setIntroFileUrl] = useState('');
  const [introFileName, setIntroFileName] = useState('');
  const [isSubmittingIntro, setIsSubmittingIntro] = useState(false);

  // Digital Attendance (Presensi Digital) state
  const [attendances, setAttendances] = useState<DigitalAttendance[]>([]);
  const [isRecordingAtt, setIsRecordingAtt] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [manualAttStatus, setManualAttStatus] = useState<'hadir' | 'izin' | 'sakit' | 'terlambat'>('hadir');
  const [manualAttNotes, setManualAttNotes] = useState('');
  const [selectedAttSectionId, setSelectedAttSectionId] = useState<string>('');

  // Synchronized Gradebook state
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [loadingGradebook, setLoadingGradebook] = useState(false);

  // Re-entry SEB Exam Unlock state (For Teacher / Admin)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockStudentId, setUnlockStudentId] = useState('usr-siswa-01');
  const [unlockReason, setUnlockReason] = useState('Dispensasi pengerjaan / re-entry');
  const [isUnlockingExam, setIsUnlockingExam] = useState(false);

  // Add week form state
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [newWeekDesc, setNewWeekDesc] = useState('');
  const [newWeekStart, setNewWeekStart] = useState('');
  const [newWeekEnd, setNewWeekEnd] = useState('');

  // Add resource form state
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'text' | 'pdf' | 'link' | 'video'>('text');
  const [resContent, setResContent] = useState('');
  const [resFileUrl, setResFileUrl] = useState('');

  // AI Scaffold Modal state (Teacher)
  const [aiTopicInput, setAiTopicInput] = useState(course?.title || 'Kalkulus Lanjut');
  const [aiWeeksCount, setAiWeeksCount] = useState(4);
  const [isGeneratingScaffold, setIsGeneratingScaffold] = useState(false);
  const [generatedScaffoldWeeks, setGeneratedScaffoldWeeks] = useState<any[] | null>(null);
  const [isCreateSebModalOpen, setIsCreateSebModalOpen] = useState(false);

  // Forum state
  const [activeForumTopicId, setActiveForumTopicId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Enrollment Key input for un-enrolled students
  const [enteredKey, setEnteredKey] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // Load Attendances and Gradebook for this course
  const loadAttendanceRecords = async () => {
    if (!courseId) return;
    const records = await fetchAttendance(courseId);
    setAttendances(records);
  };

  const loadGradebookRecords = async () => {
    if (!courseId) return;
    setLoadingGradebook(true);
    const gb = await fetchGradebook(courseId, currentUser?.id, currentUser?.role);
    if (gb) {
      setGradebookData(gb);
    }
    setLoadingGradebook(false);
  };

  useEffect(() => {
    if (courseId) {
      fetchForums(courseId);
      loadAttendanceRecords();
      loadGradebookRecords();
    }
  }, [courseId, currentUser?.id, activeTab]);

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-700">
        <p>Kursus tidak ditemukan.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  // Admin has FULL permission over ALL courses, syllabus, quizzes, forums, and grading
  const isTeacherOrAdmin = currentUser?.role === 'admin' || (currentUser?.role === 'guru' && (currentUser?.id === course.teacherId || !course.teacherId));
  const isEnrolled = currentUser ? (currentUser.role !== 'siswa' || course.enrolledStudentIds.includes(currentUser.id)) : false;

  const courseForums = forums.filter(f => f.courseId === course.id);
  const activeTopic = courseForums.find(f => f.id === activeForumTopicId) || courseForums[0];

  const toggleWeekExpand = (secId: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [secId]: prev[secId] === undefined ? false : !prev[secId]
    }));
  };

  const handleEnroll = async () => {
    if (!currentUser) return;
    setEnrollError(null);
    setEnrollSuccess(null);

    const res = await enrollInCourse(course.id, currentUser.id, enteredKey);
    if (res.success) {
      setEnrollSuccess(res.message || 'Berhasil terdaftar!');
    } else {
      setEnrollError(res.message || 'Pendaftaran gagal');
    }
  };

  const handleAddWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekTitle.trim()) return;

    await addWeeklySection(course.id, {
      title: newWeekTitle,
      description: newWeekDesc,
      startDate: newWeekStart || new Date().toISOString().split('T')[0],
      endDate: newWeekEnd || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });

    setIsAddWeekModalOpen(false);
    setNewWeekTitle('');
    setNewWeekDesc('');
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId || !resTitle.trim()) return;

    await addMaterialToSection(course.id, {
      sectionId: selectedSectionId,
      title: resTitle,
      type: resType,
      content: resContent,
      fileUrl: resFileUrl || undefined
    });

    setIsAddResourceModalOpen(false);
    setResTitle('');
    setResContent('');
    setResFileUrl('');
  };

  // Run AI Scaffold Generation
  const handleGenerateAiScaffold = async () => {
    setIsGeneratingScaffold(true);
    try {
      const res = await fetch('/api/ai/scaffold-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopicInput,
          category: course.category,
          targetClass: course.targetClass,
          weeksCount: aiWeeksCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedScaffoldWeeks(data.weeks || []);
      }
    } catch {
      // offline
    } finally {
      setIsGeneratingScaffold(false);
    }
  };

  const handleApplyAiScaffold = async () => {
    if (!generatedScaffoldWeeks) return;
    await applyAiScaffoldToCourse(course.id, generatedScaffoldWeeks);
    setIsAiScaffoldModalOpen(false);
    setGeneratedScaffoldWeeks(null);
  };

  // Create Forum Topic
  const handleCreateForumTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !currentUser) return;

    const created = await createForumTopic(course.id, newTopicTitle, newTopicContent, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    });

    if (created) {
      setActiveForumTopicId(created.id);
      setIsNewForumModalOpen(false);
      setNewTopicTitle('');
      setNewTopicContent('');
    }
  };

  // Add Reply to Forum
  const handleAddForumReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser || !activeTopic) return;

    await addForumPost(course.id, activeTopic.id, replyContent, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar
    });

    setReplyContent('');
  };

  // Request AI Tutor Reply in Forum
  const handleRequestAiForumReply = async (topicId: string) => {
    setIsAiReplying(true);
    await requestAiForumReply(course.id, topicId);
    setIsAiReplying(false);
  };

  const handleOpenAttendanceModal = (sectionId: string) => {
    setSelectedAttSectionId(sectionId);
    const existing = attendances.find(a => a.studentId === currentUser?.id);
    if (existing) {
      setManualAttStatus(existing.status);
      setManualAttNotes(existing.notes || '');
    } else {
      setManualAttStatus('hadir');
      setManualAttNotes('');
    }
    setIsAttendanceModalOpen(true);
  };

  const handleSubmitManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedAttSectionId) return;
    setIsRecordingAtt(true);
    const res = await recordAttendance(course.id, {
      sectionId: selectedAttSectionId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNis: currentUser.identifierNumber,
      status: manualAttStatus,
      notes: manualAttNotes.trim(),
      deviceInfo: navigator.userAgent.includes('Mobile') ? 'Smartphone Web' : 'Desktop Browser'
    });
    setIsRecordingAtt(false);
    setIsAttendanceModalOpen(false);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Presensi Berhasil Dicatat',
        message: `Status kehadiran Anda tercatat sebagai "${manualAttStatus.toUpperCase()}".`
      });
      loadAttendanceRecords();
      loadGradebookRecords();
    } else {
      showNotification({
        type: 'error',
        title: 'Presensi Gagal',
        message: res.message || 'Gagal menyimpan presensi.'
      });
    }
  };

  const handleAddIntroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!introTitle.trim()) return;
    setIsSubmittingIntro(true);

    const res = await addIntroMaterial(course.id, {
      title: introTitle.trim(),
      content: introContent.trim(),
      fileUrl: introFileUrl || undefined,
      fileName: introFileName || undefined,
      authorName: currentUser?.name || 'Drs. Bambang Suryono',
      authorRole: currentUser?.role || 'guru'
    });

    setIsSubmittingIntro(false);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Pengumuman / Kontrak Berhasil Diunggah',
        message: `Materi "${introTitle}" dipublikasikan. Notifikasi otomatis dikirimkan ke ikon lonceng siswa.`
      });
      setIsAddIntroModalOpen(false);
      setIntroTitle('');
      setIntroContent('');
      setIntroFileUrl('');
      setIntroFileName('');
    }
  };

  const handleDeleteIntro = async (matId: string, title: string) => {
    if (!window.confirm(`Hapus dokumen "${title}"?`)) return;
    await deleteIntroMaterial(course.id, matId);
    showNotification({
      type: 'info',
      title: 'Materi Dihapus',
      message: `Dokumen "${title}" telah dihapus.`
    });
  };

  const handleUnlockExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockStudentId.trim()) return;
    setIsUnlockingExam(true);

    try {
      const res = await fetch(`/api/assignments/asg-mat-01/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: unlockStudentId.trim(),
          unlockedBy: currentUser?.name || 'Administrator',
          reason: unlockReason.trim() || 'Dispensasi pengerjaan / re-entry'
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification({
          type: 'success',
          title: 'Akses Ujian Dibuka (Unlocked)',
          message: data.message || `Siswa ID ${unlockStudentId} dapat mengerjakan ulang ujian.`
        });
        setIsUnlockModalOpen(false);
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Gagal Membuka Kunci',
        message: 'Koneksi server gagal.'
      });
    } finally {
      setIsUnlockingExam(false);
    }
  };

  const enrolledStudents = users.filter(u => course.enrolledStudentIds.includes(u.id));

  // Calculate total course completion for current student
  const totalResources = course.sections.reduce((acc, s) => acc + s.resources.length, 0);
  const completedResources = course.sections.reduce((acc, s) => {
    return acc + s.resources.filter(r => currentUser && r.completedByStudentIds?.includes(currentUser.id)).length;
  }, 0);
  const progressPercent = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('catalog')} className="hover:text-blue-600 transition cursor-pointer">
            Kursus Saya
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-sm">{course.title}</span>
        </div>

        {/* Course Header Banner (Moodle Boost Style) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img src={course.bannerImage} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                    {course.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                    {course.code}
                  </span>
                  {course.enrollmentKey && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      <span>Kunci: {course.enrollmentKey}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {course.title}
                </h1>

                <p className="text-xs text-slate-500 flex items-center gap-2.5 flex-wrap">
                  <span>Pengampu: <strong className="text-slate-700">{course.teacherName}</strong></span>
                  <span>•</span>
                  <span>Sasaran: <strong className="text-slate-700">{course.targetClass}</strong></span>
                  <span>•</span>
                  <span>{course.sections.length} Seksi Perkuliahan</span>
                </p>
              </div>
            </div>

            {/* Quick Action: Enrollment / Turn Editing On / AI Scaffold */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {isTeacherOrAdmin && (
                <>
                  <button
                    onClick={() => setIsCreateSebModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-100" />
                    <span>+ Tambah Ujian SEB</span>
                  </button>

                  <button
                    onClick={() => setIsAiScaffoldModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                    <span>AI Scaffold Generator</span>
                  </button>

                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      isEditMode
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'Matikan Mode Edit' : 'Nyalakan Mode Edit (Moodle)'}</span>
                  </button>
                </>
              )}

              {currentUser?.role === 'siswa' && !isEnrolled && (
                <div className="flex items-center gap-2">
                  {course.enrollmentKey && (
                    <input
                      type="password"
                      placeholder="Masukkan Kunci..."
                      value={enteredKey}
                      onChange={(e) => setEnteredKey(e.target.value)}
                      className="text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                    />
                  )}
                  <button
                    onClick={handleEnroll}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Daftar ke Kursus
                  </button>
                </div>
              )}

              {currentUser?.role === 'siswa' && isEnrolled && (
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terdaftar Aktif</span>
                </span>
              )}
            </div>
          </div>

          {/* Student Progress Bar (Moodle Completion Tracking) */}
          {currentUser?.role === 'siswa' && isEnrolled && (
            <div className="px-6 sm:px-8 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Kemajuan Pembelajaran Mandiri:</span>
                <span className="font-bold text-blue-700">{completedResources} dari {totalResources} aktivitas selesai ({progressPercent}%)</span>
              </div>
              <div className="w-36 h-2 bg-blue-200 rounded-full overflow-hidden shrink-0">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Moodle Navigation Tabs (Silabus, Media Ajar, Kuis & Asesmen, Forum Diskusi, Buku Nilai, Peserta & Presensi) */}
          <div className="flex items-center gap-2 px-6 sm:px-8 bg-slate-50 border-t border-slate-200 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('syllabus')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'syllabus'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Silabus & Materi Mingguan</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'media'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Media Ajar Digital</span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'quizzes'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Kuis & Evaluasi</span>
            </button>

            <button
              onClick={() => setActiveTab('forum')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'forum'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Forum Diskusi ({courseForums.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('grades')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'grades'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Buku Nilai (Gradebook)</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'participants'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Peserta & Presensi ({enrolledStudents.length})</span>
            </button>
          </div>

        </div>

        {/* Notifications / Errors */}
        {enrollError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {enrollError}
          </div>
        )}
        {enrollSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
            {enrollSuccess}
          </div>
        )}

        {/* 2-Column Moodle Course Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Primary Course Tab Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* TAB 1: SYLLABUS & WEEKLY SECTIONS */}
            {activeTab === 'syllabus' && (
              <div className="space-y-4">
                
                {/* 1. Course Pengantar & Kontrak Pembelajaran (With File Upload & Notifications) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <span className="uppercase tracking-wider">Pengantar & Kontrak Pembelajaran Semester</span>
                    </div>

                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => setIsAddIntroModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Unggah Kontrak / Silabus</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {course.description || 'Selamat datang di mata pelajaran. Silakan unduh silabus dan kontrak pembelajaran di bawah ini untuk panduan perkuliahan selama satu semester.'}
                  </p>

                  {/* Uploaded Intro / Contract Documents List */}
                  {course.introMaterials && course.introMaterials.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Dokumen Resmi & Silabus Pembelajaran ({course.introMaterials.length}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {course.introMaterials.map((mat) => (
                          <div
                            key={mat.id}
                            className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition flex items-start justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 truncate">
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate">{mat.title}</span>
                              </div>
                              {mat.content && (
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {mat.content}
                                </p>
                              )}
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1 flex-wrap">
                                <span>Oleh: <strong>{mat.authorName}</strong></span>
                                <span>•</span>
                                <span>{mat.updatedAt}</span>
                              </div>
                              {mat.fileUrl && (
                                <a
                                  href={mat.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline pt-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Unduh Dokumen Silabus ({mat.fileName || 'Berkas'})</span>
                                </a>
                              )}
                            </div>

                            {isTeacherOrAdmin && (
                              <button
                                onClick={() => handleDeleteIntro(mat.id, mat.title)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer shrink-0"
                                title="Hapus materi kontrak ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Notifikasi Otomatis: Setiap pengunggahan materi baru otomatis memicu pemberitahuan lonceng ke seluruh peserta kelas.</span>
                  </div>
                </div>

                {/* 2. Interactive Digital Attendance (Presensi Digital Sesi Kelas) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase font-mono">
                        Presensi Mandiri Siswa
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Pertemuan Sesi 1: Orientasi & Pengantar Silabus
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Siswa mengisi presensi secara mandiri dengan memilih status: Hadir, Izin, Sakit, atau Terlambat.
                    </p>
                  </div>

                  {currentUser?.role === 'siswa' ? (
                    <div>
                      {(() => {
                        const myAtt = attendances.find(a => a.studentId === currentUser.id);
                        if (!myAtt) {
                          return (
                            <button
                              onClick={() => handleOpenAttendanceModal(course.sections[0]?.id || 'sec-mat-w1')}
                              disabled={isRecordingAtt}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Isi Presensi Mandiri (Hadir/Izin/Sakit/Terlambat)</span>
                            </button>
                          );
                        }

                        const statusConfig = {
                          hadir: { bg: 'bg-emerald-50 border-emerald-300 text-emerald-900', label: 'Hadir Tepat Waktu', icon: '🟢' },
                          izin: { bg: 'bg-amber-50 border-amber-300 text-amber-900', label: 'Izin', icon: '🟡' },
                          sakit: { bg: 'bg-rose-50 border-rose-300 text-rose-900', label: 'Sakit', icon: '🔴' },
                          terlambat: { bg: 'bg-orange-50 border-orange-300 text-orange-900', label: 'Terlambat', icon: '🟠' }
                        }[myAtt.status] || { bg: 'bg-emerald-50 border-emerald-300 text-emerald-900', label: 'Hadir', icon: '🟢' };

                        return (
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 font-bold text-xs shadow-2xs ${statusConfig.bg}`}>
                              <span>{statusConfig.icon}</span>
                              <span>Presensi Anda: <strong>{statusConfig.label}</strong></span>
                              {myAtt.notes && <span className="text-[11px] font-normal italic font-sans text-slate-600">({myAtt.notes})</span>}
                            </div>
                            <button
                              onClick={() => handleOpenAttendanceModal(course.sections[0]?.id || 'sec-mat-w1')}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                            >
                              Ubah
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="font-semibold text-slate-600">Rekap Sesi Ini:</span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px]">
                        🟢 Hadir: {attendances.filter(a => a.status === 'hadir').length}
                      </span>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px]">
                        🟡 Izin: {attendances.filter(a => a.status === 'izin').length}
                      </span>
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px]">
                        🔴 Sakit: {attendances.filter(a => a.status === 'sakit').length}
                      </span>
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg font-bold text-[11px]">
                        🟠 Terlambat: {attendances.filter(a => a.status === 'terlambat').length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Teacher Action: Add Section */}
                {isEditMode && isTeacherOrAdmin && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-dashed border-blue-300 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-blue-900">Tambah Seksi Mingguan (Week Section)</div>
                      <div className="text-[11px] text-blue-700">Rancang silabus perkuliahan untuk minggu berikutnya</div>
                    </div>
                    <button
                      onClick={() => setIsAddWeekModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Minggu</span>
                    </button>
                  </div>
                )}

                {/* Weekly Sections List (Moodle Accordion Weeks) */}
                <div className="space-y-4">
                  {course.sections.map((sec) => {
                    const isExpanded = expandedWeeks[sec.id] !== false; // default expanded

                    return (
                      <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        
                        {/* Week Accordion Header */}
                        <div 
                          onClick={() => toggleWeekExpand(sec.id)}
                          className="p-4 bg-slate-50/80 hover:bg-slate-100/80 transition flex items-center justify-between cursor-pointer border-b border-slate-200/80 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              W{sec.weekNumber}
                            </span>
                            <div>
                              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                                {sec.title}
                              </h3>
                              <p className="text-[10px] text-slate-500">
                                Rentang Waktu: {sec.startDate} s/d {sec.endDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {sec.resources.length} Materi
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Week Resources & Activities Content */}
                        {isExpanded && (
                          <div className="p-4 space-y-3">
                            {sec.description && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                                {sec.description}
                              </p>
                            )}

                            {/* Resource items */}
                            <div className="divide-y divide-slate-100">
                              {sec.resources.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4 italic">
                                  Belum ada materi atau tugas pada minggu ini.
                                </p>
                              ) : (
                                sec.resources.map((res) => {
                                  const isCompleted = currentUser && res.completedByStudentIds?.includes(currentUser.id);

                                  return (
                                    <div key={res.id} className="py-2.5 flex items-start justify-between gap-3 group">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-blue-600 shrink-0">
                                          {res.type === 'pdf' && <FileText className="w-4 h-4" />}
                                          {res.type === 'video' && <Video className="w-4 h-4" />}
                                          {res.type === 'link' && <LinkIcon className="w-4 h-4" />}
                                          {res.type === 'text' && <BookOpen className="w-4 h-4" />}
                                        </div>

                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs text-slate-800 hover:text-blue-600 cursor-pointer">
                                              {res.title}
                                            </span>
                                            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                              {res.type}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 leading-snug">
                                            {res.content}
                                          </p>
                                          {res.fileUrl && (
                                            <a 
                                              href={res.fileUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold mt-1"
                                            >
                                              <span>Unduh / Akses Berkas Materi</span>
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      </div>

                                      {/* Student Completion Checkbox */}
                                      {currentUser?.role === 'siswa' && isEnrolled && (
                                        <button
                                          onClick={() => toggleMaterialCompleted(course.id, res.id, currentUser.id)}
                                          className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                                            isCompleted ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-500'
                                          }`}
                                          title={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                                        >
                                          {isCompleted ? <CheckCircle2 className="w-5 h-5 fill-emerald-100" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Teacher Action: Add Resource inside this week */}
                            {isEditMode && isTeacherOrAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedSectionId(sec.id);
                                  setIsAddResourceModalOpen(true);
                                }}
                                className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Materi / Aktivitas Baru (Moodle Resource)</span>
                              </button>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 2: MOODLE DISCUSSION FORUM */}
            {activeTab === 'forum' && (
              <div className="space-y-4">
                
                {/* Forum Action Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Forum Diskusi Perkuliahan & Tanya Jawab</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Diskusikan materi perkuliahan dengan rekan kelas, guru pengampu, atau minta asistensi AI Scaffold.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsNewForumModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Topik Diskusi Baru</span>
                  </button>
                </div>

                {/* Forum Topic Threads */}
                {courseForums.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    Belum ada diskusi perkuliahan. Buat topik pertama Anda sekarang!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseForums.map((topic) => (
                      <div key={topic.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        
                        {/* Topic Header */}
                        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              {topic.isPinned && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                                  Disematkan
                                </span>
                              )}
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {topic.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Dimulai oleh <strong className="text-slate-700">{topic.creatorName}</strong> ({topic.creatorRole}) • {topic.createdAt}
                            </p>
                          </div>

                          {/* Quick AI Tutor Assist Action */}
                          <button
                            onClick={() => handleRequestAiForumReply(topic.id)}
                            disabled={isAiReplying}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Bot className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isAiReplying ? 'AI Menulis...' : 'Minta Umpan Balik AI Scaffold'}</span>
                          </button>
                        </div>

                        {/* Posts Thread */}
                        <div className="p-4 space-y-3.5 divide-y divide-slate-100">
                          {topic.posts.map((post) => (
                            <div key={post.id} className="pt-3.5 first:pt-0 flex gap-3 items-start">
                              <img
                                src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                                alt={post.authorName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-200"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{post.authorName}</span>
                                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                      post.isAiGenerated
                                        ? 'bg-blue-600 text-white'
                                        : post.authorRole === 'guru'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {post.isAiGenerated ? 'AI Scaffold' : post.authorRole}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">{post.createdAt}</span>
                                </div>
                                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                  {post.content}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Quick Reply Box */}
                          <div className="pt-3">
                            <form
                              onSubmit={(e) => {
                                setActiveForumTopicId(topic.id);
                                handleAddForumReply(e);
                              }}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                placeholder={`Tulis tanggapan untuk "${topic.title}"...`}
                                value={activeForumTopicId === topic.id ? replyContent : ''}
                                onFocus={() => setActiveForumTopicId(topic.id)}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
                              />
                              <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Kirim</span>
                              </button>
                            </form>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB: MEDIA AJAR DIGITAL (Section 7 & 9) */}
            {activeTab === 'media' && (
              <MediaAjarTab
                courseId={course.id}
                courseTitle={course.title}
                targetClass={course.targetClass}
              />
            )}

            {/* TAB: KUIS & ASESMEN FORMATIF (Section 8) */}
            {activeTab === 'quizzes' && (
              <QuizTab
                courseId={course.id}
                courseTitle={course.title}
                targetClass={course.targetClass}
                onNavigate={onNavigate}
              />
            )}

            {/* TAB: GRADEBOOK (BUKU NILAI MOODLE TERPADU - SINKRONISASI LENGKAP) */}
            {activeTab === 'grades' && (() => {
              const courseExamsList = assignments.filter(a => !a.courseId || a.courseId === course.id);
              const targetStudents = currentUser?.role === 'siswa'
                ? enrolledStudents.filter(s => s.id === currentUser.id)
                : enrolledStudents;

              return (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>Buku Nilai Terpadu & Terverifikasi (Unified Gradebook)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Bobot Nilai Akhir: Presensi Digital 10% (Hadir 100%, Izin/Sakit/Terlambat 50%, Alpha 0%) + Rata-Rata Ujian SEB 90%
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadGradebookRecords}
                        disabled={loadingGradebook}
                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingGradebook ? 'animate-spin' : ''}`} />
                        <span>Segarkan Nilai</span>
                      </button>

                      {currentUser?.role !== 'siswa' && (
                        <button
                          onClick={() => {
                            let csv = ["Nama Siswa", "NISN", "Kelas", "Presensi Digital (10%)", ...courseExamsList.map(e => `"${e.title}"`), "Rata-Rata SEB", "Nilai Akhir (100%)", "Predikat", "Status"].join(',') + "\n";
                            
                            enrolledStudents.forEach(st => {
                              const stAtts = attendances.filter(a => a.studentId === st.id);
                              let attScore = 0;
                              if (stAtts.length > 0) {
                                const totalAtt = stAtts.reduce((sum, cur) => {
                                  if (cur.status === 'hadir') return sum + 100;
                                  if (cur.status === 'izin' || cur.status === 'sakit' || cur.status === 'terlambat') return sum + 50;
                                  return sum;
                                }, 0);
                                attScore = Math.round(totalAtt / stAtts.length);
                              }

                              const examScoresList = courseExamsList.map(asg => {
                                const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === st.id);
                                return sub?.totalTeacherScore !== undefined ? sub.totalTeacherScore : (sub ? sub.totalAiScore : undefined);
                              });

                              const validScores = examScoresList.filter((s): s is number => s !== undefined);
                              const rataSeb = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
                              const finalScore = Math.round((attScore * 0.10) + (rataSeb * 0.90));

                              let p = 'E';
                              if (finalScore >= 90) p = 'A';
                              else if (finalScore >= 80) p = 'B';
                              else if (finalScore >= 75) p = 'C';
                              else if (finalScore >= 50) p = 'D';

                              const stLabel = finalScore >= 75 ? 'Tuntas' : 'Perlu Remedial';

                              csv += `"${st.name}","${st.identifierNumber || '-'}","${st.kelasBimbingan || course.targetClass}","${attScore}%",` + 
                                examScoresList.map(s => s !== undefined ? `"${s}"` : `"-"`).join(',') + 
                                `,"${rataSeb}","${finalScore}","${p}","${stLabel}"\n`;
                            });

                            const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `buku_nilai_${course.code}_resmi.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ekspor Nilai Resmi (.csv)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Nama Peserta Didik</th>
                          <th className="p-3 text-center min-w-[140px]">
                            <div>Presensi Digital</div>
                            <div className="text-[9px] font-normal text-slate-500">Bobot 10% (H:100% | I/S/T:50% | A:0%)</div>
                          </th>

                          {/* Dynamic SEB Exam Columns */}
                          {courseExamsList.map((asg, idx) => (
                            <th key={asg.id} className="p-3 text-center min-w-[150px]">
                              <div className="font-bold truncate max-w-[160px]" title={asg.title}>{asg.title}</div>
                              <div className="text-[9px] font-normal text-slate-500">Ujian SEB #{idx + 1}</div>
                            </th>
                          ))}

                          <th className="p-3 text-center min-w-[130px]">
                            <div>Nilai Akhir</div>
                            <div className="text-[9px] font-normal text-slate-500">10% Presensi + 90% SEB</div>
                          </th>
                          <th className="p-3 text-center">Predikat</th>
                          <th className="p-3 text-center">Status Kelulusan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {targetStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5 + courseExamsList.length} className="p-8 text-center text-slate-500">
                              Belum ada data peserta didik yang terdaftar dalam kursus ini.
                            </td>
                          </tr>
                        ) : (
                          targetStudents.map((student) => {
                            // Attendance calculation
                            const studentAtts = attendances.filter(a => a.studentId === student.id);
                            let attScore = 0;
                            if (studentAtts.length > 0) {
                              const totalAtt = studentAtts.reduce((sum, cur) => {
                                if (cur.status === 'hadir') return sum + 100;
                                if (cur.status === 'izin' || cur.status === 'sakit' || cur.status === 'terlambat') return sum + 50;
                                return sum;
                              }, 0);
                              attScore = Math.round(totalAtt / studentAtts.length);
                            }

                            // Dynamic SEB Exam Scores
                            const examScores = courseExamsList.map(asg => {
                              const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === student.id);
                              const score = sub?.totalTeacherScore !== undefined 
                                ? sub.totalTeacherScore 
                                : (sub ? sub.totalAiScore : undefined);
                              return {
                                asgId: asg.id,
                                score,
                                isApproved: sub?.status === 'published',
                                subId: sub?.id
                              };
                            });

                            // Calculate average of SEB exams
                            const validExamScores = examScores
                              .map(e => e.score)
                              .filter((s): s is number => s !== undefined);

                            const rataSeb = validExamScores.length > 0 
                              ? Math.round(validExamScores.reduce((a, b) => a + b, 0) / validExamScores.length) 
                              : 0;

                            // Nilai Akhir: 10% Presensi + 90% Ujian SEB
                            const nilaiAkhir = Math.round((attScore * 0.10) + (rataSeb * 0.90));

                            // Predikat: 90-100 A, 80-89 B, 75-79 C, 50-74 D, 0-49 E
                            let letterGrade = 'E';
                            if (nilaiAkhir >= 90) letterGrade = 'A';
                            else if (nilaiAkhir >= 80) letterGrade = 'B';
                            else if (nilaiAkhir >= 75) letterGrade = 'C';
                            else if (nilaiAkhir >= 50) letterGrade = 'D';
                            else letterGrade = 'E';

                            const isTuntas = nilaiAkhir >= 75;

                            return (
                              <tr key={student.id} className="hover:bg-slate-50/80 transition">
                                <td className="p-3 font-semibold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                      {student.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold flex items-center gap-1.5">
                                        <span>{student.name}</span>
                                        {student.id === currentUser?.id && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">Anda</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        NISN: {student.identifierNumber || '-'} • Kelas: {student.kelasBimbingan || course.targetClass}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Attendance Percentage */}
                                <td className="p-3 text-center">
                                  <div className="inline-block">
                                    <span className="font-bold text-slate-800 text-xs">
                                      {attScore}%
                                    </span>
                                    <div className="text-[9px] text-slate-400">
                                      {studentAtts.length > 0 ? `(${studentAtts[0].status})` : '(Alpha)'}
                                    </div>
                                  </div>
                                </td>

                                {/* Dynamic Columns for each SEB Exam */}
                                {examScores.map((item, eIdx) => (
                                  <td key={item.asgId || eIdx} className="p-3 text-center">
                                    {item.score !== undefined ? (
                                      <div className="inline-block">
                                        <span className={`font-extrabold px-2.5 py-0.5 rounded border text-xs ${
                                          item.isApproved 
                                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                                            : 'text-amber-800 bg-amber-50 border-amber-200'
                                        }`}>
                                          {item.score}
                                        </span>
                                        <div className="text-[8px] text-slate-400 mt-0.5">
                                          {item.isApproved ? 'Diverifikasi' : 'Estimasi AI'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">Belum Ujian</span>
                                    )}
                                  </td>
                                ))}

                                {/* Nilai Akhir (10% Presensi + 90% SEB) */}
                                <td className="p-3 text-center font-extrabold text-sm text-slate-900">
                                  <div className="inline-block">
                                    <span className="text-base text-blue-900 font-black">{nilaiAkhir}</span>
                                    <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                                  </div>
                                </td>

                                {/* Predikat */}
                                <td className="p-3 text-center">
                                  <span className={`font-extrabold px-2.5 py-0.5 rounded text-xs ${
                                    letterGrade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                    letterGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    letterGrade === 'C' ? 'bg-amber-100 text-amber-800' :
                                    letterGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {letterGrade}
                                  </span>
                                </td>

                                {/* Status Kelulusan */}
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isTuntas
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isTuntas ? 'Tuntas' : 'Perlu Remedial'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}


            {/* TAB 4: PARTICIPANTS & ATTENDANCE */}
            {activeTab === 'participants' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Daftar Peserta & Presensi Perkuliahan ({enrolledStudents.length} Siswa)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Status presensi mandiri siswa terdata langsung secara realtime
                    </p>
                  </div>

                  {currentUser?.role === 'siswa' && course.sections.length > 0 && (
                    <button
                      onClick={() => handleOpenAttendanceModal(course.sections[0].id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Isi Presensi Mandiri</span>
                    </button>
                  )}
                </div>

                {/* Summary counters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-medium">Total Siswa</span>
                    <strong className="text-sm font-extrabold text-slate-900">{enrolledStudents.length}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-700 block font-medium">Hadir</span>
                    <strong className="text-sm font-extrabold text-emerald-800">
                      {attendances.filter(a => a.status === 'hadir').length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                    <span className="text-[10px] text-amber-700 block font-medium">Izin</span>
                    <strong className="text-sm font-extrabold text-amber-800">
                      {attendances.filter(a => a.status === 'izin').length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-700 block font-medium">Sakit</span>
                    <strong className="text-sm font-extrabold text-rose-800">
                      {attendances.filter(a => a.status === 'sakit').length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-center">
                    <span className="text-[10px] text-orange-700 block font-medium">Terlambat</span>
                    <strong className="text-sm font-extrabold text-orange-800">
                      {attendances.filter(a => a.status === 'terlambat').length}
                    </strong>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                  {enrolledStudents.map((s) => {
                    const studentAtt = attendances.find(a => a.studentId === s.id);
                    return (
                      <div key={s.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                        <div className="flex items-center gap-3">
                          <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full bg-slate-100" />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{s.name}</span>
                              {s.id === currentUser?.id && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Anda</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">NISN: {s.identifierNumber || '-'} • Kelas: {s.kelasBimbingan || '-'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {studentAtt ? (
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  studentAtt.status === 'hadir'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : studentAtt.status === 'izin'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : studentAtt.status === 'sakit'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}>
                                  {studentAtt.status === 'hadir' && '🟢 Hadir'}
                                  {studentAtt.status === 'izin' && '🟡 Izin'}
                                  {studentAtt.status === 'sakit' && '🔴 Sakit'}
                                  {studentAtt.status === 'terlambat' && '🟠 Terlambat'}
                                </span>
                              </div>
                              {studentAtt.notes && (
                                <p className="text-[10px] text-slate-500 mt-0.5 italic max-w-xs truncate">
                                  "{studentAtt.notes}"
                                </p>
                              )}
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                {studentAtt.timestamp ? new Date(studentAtt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Tercatat'}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                ⚪ Belum Presensi
                              </span>
                              {s.id === currentUser?.id && course.sections.length > 0 && (
                                <button
                                  onClick={() => handleOpenAttendanceModal(course.sections[0].id)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                >
                                  Isi Sekarang
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Moodle Classic Block Drawer (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Block 1: AI Scaffold Assistant Quick Card */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl text-white p-4 space-y-3 shadow-md shadow-blue-500/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">AI Tutor & Scaffolding</h4>
                  <p className="text-[10px] text-blue-100">Bantuan Belajar Mandiri</p>
                </div>
              </div>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Bingung dengan pembuktian rumus atau soal esai? Buka asisten AI di pojok kanan bawah untuk mendapatkan bimbingan berjenjang (Level 1, 2, 3) tanpa membocorkan langsung jawaban akhir.
              </p>
            </div>

            {/* Block 2: Course Administration (Administrasi Kursus) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                <span>Administrasi Kursus</span>
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="p-2 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Format Kursus:</span>
                  <strong className="text-slate-800">Mingguan Berurutan</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Enrolment Key:</span>
                  <strong className="text-blue-600">{course.enrollmentKey || 'Terbuka'}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Total Seksi Minggu:</span>
                  <strong className="text-slate-800">{course.sections.length} Minggu</strong>
                </div>
              </div>
            </div>

            {/* Block 3: Quick Exam Access */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ujian Safe Exam Browser (SEB)</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tersedia Ujian Blok 1 dengan perlindungan penguncian layar Web SEB dan koreksi otomatis AI Gemini.
              </p>
              <button
                onClick={() => onNavigate('exam', 'asg-mat-01')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Buka Ujian Blok 1 (SEB)
              </button>
            </div>

            {/* Block 4: Online Users & Teachers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Pengajar & Pembina</span>
              </h4>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80" alt="Guru" className="w-10 h-10 rounded-full object-cover" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{course.teacherName}</div>
                  <div className="text-[11px] text-slate-500">Guru Pengampu Utama & Wali Kelas</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL: AI SCAFFOLD GENERATOR (TEACHER) */}
        {isAiScaffoldModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">AI Pedagogical Scaffold Generator</h3>
                    <p className="text-[11px] text-slate-500">Rancang silabus modul bertingkat otomatis ke kursus ini</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiScaffoldModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topik Modul yang Akan Dirancang:</label>
                  <input
                    type="text"
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Minggu Silabus:</label>
                  <select
                    value={aiWeeksCount}
                    onChange={(e) => setAiWeeksCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value={2}>2 Minggu Pembelajaran</option>
                    <option value={4}>4 Minggu (1 Blok Penuh)</option>
                    <option value={6}>6 Minggu</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAiScaffoldModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAiScaffold}
                    disabled={isGeneratingScaffold}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isGeneratingScaffold ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Merancang Kurikulum...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mulai Rancang AI</span>
                      </>
                    )}
                  </button>
                </div>

                {generatedScaffoldWeeks && (
                  <div className="mt-4 p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <div className="font-bold text-blue-900 flex items-center justify-between">
                      <span>Rancangan Berhasil ({generatedScaffoldWeeks.length} Minggu)</span>
                      <button
                        onClick={handleApplyAiScaffold}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xs cursor-pointer"
                      >
                        Terapkan ke Kursus Ini
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 text-[11px] text-slate-700">
                      {generatedScaffoldWeeks.map((w, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-blue-100">
                          <strong className="text-blue-800">{w.title}</strong>
                          <p className="text-slate-500">{w.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD WEEK */}
        {isAddWeekModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Tambah Minggu Perkuliahan Baru (Moodle Section)</h3>
              <form onSubmit={handleAddWeek} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Minggu:</label>
                  <input
                    type="text"
                    value={newWeekTitle}
                    onChange={(e) => setNewWeekTitle(e.target.value)}
                    placeholder="misal: Minggu 4: Aplikasi Integral Tentu"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uraian / Capaian:</label>
                  <textarea
                    value={newWeekDesc}
                    onChange={(e) => setNewWeekDesc(e.target.value)}
                    rows={2}
                    placeholder="Deskripsi materi dan target kompetensi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={newWeekStart}
                      onChange={(e) => setNewWeekStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={newWeekEnd}
                      onChange={(e) => setNewWeekEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWeekModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                  >
                    Simpan Minggu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD RESOURCE */}
        {isAddResourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Tambah Materi / Aktivitas Pembelajaran</h3>
              <form onSubmit={handleAddResource} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Aktivitas Moodle:</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="text">Catatan / Teks Penjelasan (Page)</option>
                    <option value="pdf">Dokumen Modul / PDF (File)</option>
                    <option value="video">Video Pembelajaran (URL Video)</option>
                    <option value="link">Tautan Eksternal (URL Link)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Materi:</label>
                  <input
                    type="text"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="misal: Modul PDF Sifat Aljabar"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penjelasan / Deskripsi:</label>
                  <textarea
                    value={resContent}
                    onChange={(e) => setResContent(e.target.value)}
                    rows={2}
                    placeholder="Rangkuman atau petunjuk belajar..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Berkas / Tautan (Opsional):</label>
                  <input
                    type="url"
                    value={resFileUrl}
                    onChange={(e) => setResFileUrl(e.target.value)}
                    placeholder="https://example.com/modul.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddResourceModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                  >
                    Tambah Materi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE FORUM TOPIC */}
        {isNewForumModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Buat Topik Diskusi Forum Baru</h3>
              <form onSubmit={handleCreateForumTopic} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Topik Diskusi:</label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="misal: Pertanyaan Seputar Teorema L'Hopital"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Isi Pertanyaan / Topik Bahasan:</label>
                  <textarea
                    value={newTopicContent}
                    onChange={(e) => setNewTopicContent(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan pertanyaan atau studi kasus yang ingin didiskusikan secara mendalam..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewForumModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                  >
                    Publikasikan Topik
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreateSebModalOpen && (
          <CreateSebExamModal
            initialCourseId={course.id}
            onClose={() => setIsCreateSebModalOpen(false)}
            onSuccess={() => {
              setIsCreateSebModalOpen(false);
              showNotification({
                type: 'success',
                title: 'Ujian SEB Baru Berhasil Dibuat',
                message: `Ujian SEB untuk kursus "${course.title}" telah dipublikasikan.`
              });
            }}
          />
        )}

        {/* MODAL: MANUAL STUDENT ATTENDANCE */}
        {isAttendanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Presensi Kehadiran Siswa</h3>
                    <p className="text-[11px] text-slate-500">Pilih status kehadiran dan tuliskan keterangan bila perlu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitManualAttendance} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-2">Pilih Status Kehadiran Anda:</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'hadir', label: 'Hadir', badge: '🟢 Hadir', desc: 'Mengikuti sesi pembelajaran', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                      { id: 'izin', label: 'Izin', badge: '🟡 Izin', desc: 'Ada urusan penting / dispensasi', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                      { id: 'sakit', label: 'Sakit', badge: '🔴 Sakit', desc: 'Kondisi kesehatan berhalangan', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                      { id: 'terlambat', label: 'Terlambat', badge: '🟠 Terlambat', desc: 'Hadir melebihi batas waktu', color: 'border-orange-500 bg-orange-50 text-orange-900' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setManualAttStatus(opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          manualAttStatus === opt.id
                            ? `${opt.color} ring-2 ring-blue-500/50 font-bold shadow-xs`
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm">{opt.badge}</span>
                          {manualAttStatus === opt.id && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Keterangan / Alasan Tambahan {manualAttStatus !== 'hadir' && <span className="text-rose-500 font-extrabold">* (Wajib diisi)</span>}:
                  </label>
                  <textarea
                    value={manualAttNotes}
                    onChange={(e) => setManualAttNotes(e.target.value)}
                    rows={3}
                    placeholder={
                      manualAttStatus === 'hadir'
                        ? 'Catatan opsional (misal: hadir dari lab komputer sekolah)'
                        : 'Tuliskan rincian alasan izin, sakit, atau terlambat...'
                    }
                    required={manualAttStatus !== 'hadir'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nama Siswa:</span>
                    <strong className="text-slate-900 font-bold">{currentUser?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">NISN:</span>
                    <strong className="text-slate-900 font-mono">{currentUser?.identifierNumber || '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Waktu Presensi:</span>
                    <strong className="text-slate-900">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAttendanceModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingAtt}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isRecordingAtt ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Presensi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simpan Presensi Saya</span>
                      </>
                    )}
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
