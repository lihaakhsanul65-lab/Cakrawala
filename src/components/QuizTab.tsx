import React, { useState, useMemo, useEffect } from 'react';
import { useExam } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Assignment, Question, QuestionType, Submission, StudentAnswer } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Play, 
  Award, 
  Send, 
  UserCheck, 
  Sliders, 
  FileText, 
  Sparkles, 
  Check, 
  Search, 
  Users, 
  Camera, 
  Upload, 
  Maximize2, 
  Image as ImageIcon,
  Edit3,
  Lock,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface QuizTabProps {
  courseId: string;
  courseTitle: string;
  targetClass: string;
  onNavigate?: (view: string, param?: string) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({ 
  courseId, 
  courseTitle, 
  targetClass, 
  onNavigate 
}) => {
  const { 
    assignments, 
    submissions, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment, 
    reviewSubmission,
    fetchAssignments,
    fetchSubmissions
  } = useExam();

  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  const isTeacherOrAdmin = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Navigation mode for teacher: 'exams' | 'submissions'
  const [activeTabMode, setActiveTabMode] = useState<'exams' | 'submissions'>('exams');

  // Search & filter for submissions
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'waiting' | 'published'>('all');

  // Filter SEB exams for this specific course
  const courseExams = useMemo(() => {
    return assignments.filter(a => !a.courseId || a.courseId === courseId);
  }, [assignments, courseId]);

  // Filter submissions for this specific course or its exams
  const courseSubmissions = useMemo(() => {
    const examIds = new Set(courseExams.map(e => e.id));
    return submissions.filter(s => s.courseId === courseId || examIds.has(s.assignmentId));
  }, [submissions, courseId, courseExams]);

  // Modal State for Creating or Editing SEB Exam
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDuration, setExamDuration] = useState(30);
  const [examDeadline, setExamDeadline] = useState('2026-11-15');
  const [examIsSeb, setExamIsSeb] = useState(true);
  const [examQuestions, setExamQuestions] = useState<Question[]>([
    {
      id: `q-init-1`,
      type: 'mcq',
      prompt: 'Tentukan turunan pertama dari f(x) = 3x² + 6x - 7!',
      points: 25,
      options: ['6x + 6', '3x + 6', '6x² + 6', '6x - 7'],
      correctOptionIndex: 0,
      expectedAnswer: 'Gunakan aturan pangkat d/dx(ax^n) = a*n*x^(n-1). Turunan dari 3x² adalah 6x, turunan 6x adalah 6, konstan 0.',
      rubricCriteria: 'Pemilihan opsi yang tepat.'
    },
    {
      id: `q-init-2`,
      type: 'true_false',
      prompt: 'Turunan dari fungsi konstan selalu bernilai 0.',
      points: 25,
      correctBoolean: true,
      expectedAnswer: 'Fungsi konstan tidak memiliki laju perubahan, sehingga turunannya identik nol.',
      rubricCriteria: 'Penalaran konsep dasar.'
    }
  ]);

  // Modal State for Teacher Reviewing a Student's Submission
  const [selectedSubToReview, setSelectedSubToReview] = useState<Submission | null>(null);
  const [selectedExamForReview, setSelectedExamForReview] = useState<Assignment | null>(null);
  const [itemizedScores, setItemizedScores] = useState<Record<string, { score: number; teacherNotes: string }>>({});
  const [teacherOverallFeedback, setTeacherOverallFeedback] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Student view modal for inspecting their own submitted exam result
  const [studentViewSub, setStudentViewSub] = useState<Submission | null>(null);
  const [studentViewExam, setStudentViewExam] = useState<Assignment | null>(null);

  // Lightbox preview for photos
  const [previewFullPhoto, setPreviewFullPhoto] = useState<string | null>(null);

  // Live polling every 3 seconds to keep teacher's submissions roster and counters immediately updated
  useEffect(() => {
    fetchSubmissions();
    const timer = setInterval(() => {
      fetchSubmissions();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Helper: Open Create Exam Modal
  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setExamTitle(`Ujian SEB Blok ${courseExams.length + 1}`);
    setExamDesc('Ujian terintegrasi dengan Safe Exam Browser, kamera verifikasi pengerjaan, dan penilaian cerdas.');
    setExamDuration(30);
    setExamDeadline(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setExamIsSeb(true);
    setExamQuestions([
      {
        id: `q-${Date.now()}-1`,
        type: 'mcq',
        prompt: 'Soal Nomor 1: Analisis konsep dasar.',
        points: 25,
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctOptionIndex: 0,
        expectedAnswer: 'Kunci rujukan jawaban.',
        rubricCriteria: 'Rubrik penilaian AI & guru'
      },
      {
        id: `q-${Date.now()}-2`,
        type: 'true_false',
        prompt: 'Soal Nomor 2: Pernyataan kebenaran teorema.',
        points: 25,
        correctBoolean: true,
        expectedAnswer: 'Pernyataan benar sesuai buku referensi.',
        rubricCriteria: 'Verifikasi konsep'
      }
    ]);
    setIsExamModalOpen(true);
  };

  // Helper: Open Edit Exam Modal (Rename & Update anytime)
  const handleOpenEditModal = (exam: Assignment) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title);
    setExamDesc(exam.description || '');
    setExamDuration(exam.durationMinutes || 30);
    setExamDeadline(exam.deadline || '2026-11-15');
    setExamIsSeb(exam.isSebLocked !== false);
    setExamQuestions(exam.questions && exam.questions.length > 0 ? JSON.parse(JSON.stringify(exam.questions)) : [
      {
        id: `q-${Date.now()}-1`,
        type: 'mcq',
        prompt: 'Soal Nomor 1',
        points: 25,
        options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
        correctOptionIndex: 0
      }
    ]);
    setIsExamModalOpen(true);
  };

  // Helper: Add Question to Exam Form with flexible types
  const handleAddQuestion = (type: QuestionType = 'mcq') => {
    const newQ: Question = {
      id: `q-${Date.now()}-${examQuestions.length + 1}`,
      type,
      prompt: '',
      points: 20,
      options: type === 'mcq' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined,
      correctOptionIndex: type === 'mcq' ? 0 : undefined,
      correctBoolean: type === 'true_false' ? true : undefined,
      matchingPairs: type === 'matching' ? [
        { id: `pair-${Date.now()}-1`, left: 'Premis 1', right: 'Jawaban 1' },
        { id: `pair-${Date.now()}-2`, left: 'Premis 2', right: 'Jawaban 2' },
        { id: `pair-${Date.now()}-3`, left: 'Premis 3', right: 'Jawaban 3' }
      ] : undefined,
      expectedAnswer: '',
      rubricCriteria: 'Rubrik penilaian'
    };
    setExamQuestions(prev => [...prev, newQ]);
  };

  // Helper: Batch add questions without limit
  const handleBatchAddQuestions = (count: number) => {
    const types: QuestionType[] = ['mcq', 'true_false', 'short', 'numeric', 'essay', 'matching'];
    const added: Question[] = [];
    for (let i = 0; i < count; i++) {
      const idx = examQuestions.length + i + 1;
      const t = types[i % types.length];
      added.push({
        id: `q-${Date.now()}-${i + 1}`,
        type: t,
        prompt: `Pertanyaan #${idx}: Jabarkan dan selesaikan persoalan berikut secara runtut.`,
        points: 20,
        options: t === 'mcq' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined,
        correctOptionIndex: t === 'mcq' ? 0 : undefined,
        correctBoolean: t === 'true_false' ? true : undefined,
        matchingPairs: t === 'matching' ? [
          { id: `pair-${Date.now()}-1`, left: 'Konsep A', right: 'Definisi A' },
          { id: `pair-${Date.now()}-2`, left: 'Konsep B', right: 'Definisi B' }
        ] : undefined,
        expectedAnswer: '',
        rubricCriteria: 'Rubrik penilaian'
      });
    }
    setExamQuestions(prev => [...prev, ...added]);
    showNotification({
      type: 'success',
      title: 'Batch Soal Ditambahkan',
      message: `Berhasil menambahkan ${count} butir soal sekaligus ke dalam Ujian SEB.`
    });
  };

  // Helper: Handle Question Image Upload (Stimulus / Diagram)
  const handleQuestionImageUpload = (qId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result;
        setExamQuestions(prev => prev.map(q => q.id === qId ? { ...q, imageUrl: base64 } : q));
        showNotification({
          type: 'info',
          title: 'Gambar Soal Terpasang',
          message: 'Foto stimulus / diagram berhasil dilampirkan pada soal ini.'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper: Save SEB Exam (Create or Update)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      showNotification({
        type: 'warning',
        title: 'Nama Ujian Kosong',
        message: 'Mohon tuliskan nama/judul ujian SEB.'
      });
      return;
    }

    if (examQuestions.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Daftar Soal Kosong',
        message: 'Minimal tambahkan 1 butir soal pada ujian SEB.'
      });
      return;
    }

    if (editingExamId) {
      // Update existing exam (renaming, questions, etc.)
      const res = await updateAssignment(editingExamId, {
        title: examTitle.trim(),
        description: examDesc.trim(),
        durationMinutes: Number(examDuration),
        deadline: examDeadline,
        isSebLocked: examIsSeb,
        questions: examQuestions
      });

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Ujian SEB Diperbarui',
          message: `Nama dan butir soal ujian "${examTitle}" berhasil disimpan.`
        });
        setIsExamModalOpen(false);
      }
    } else {
      // Create new exam
      const res = await createAssignment({
        courseId,
        courseTitle,
        title: examTitle.trim(),
        description: examDesc.trim(),
        durationMinutes: Number(examDuration),
        deadline: examDeadline,
        isSebLocked: examIsSeb,
        questions: examQuestions
      });

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Ujian SEB Berhasil Dibuat',
          message: `Ujian "${examTitle}" berhasil ditambahkan ke fitur Kuis & Evaluasi.`
        });
        setIsExamModalOpen(false);
      }
    }
  };

  // Helper: Delete Exam
  const handleDeleteExam = async (examId: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus ujian SEB "${title}" beserta seluruh hasil pengerjaannya? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const res = await deleteAssignment(examId);
    if (res.success) {
      showNotification({
        type: 'info',
        title: 'Ujian SEB Dihapus',
        message: `Ujian "${title}" telah dihapus dari sistem.`
      });
    }
  };

  // Helper: Open Teacher Review Modal for a specific student submission
  const handleOpenReviewModal = (sub: Submission) => {
    const exam = courseExams.find(e => e.id === sub.assignmentId) || {
      id: sub.assignmentId,
      courseId,
      courseTitle,
      title: 'Ujian Terjadwal',
      description: '',
      deadline: '',
      durationMinutes: 30,
      isSebLocked: true,
      maxViolations: 3,
      questions: [],
      createdAt: new Date().toISOString()
    } as Assignment;

    setSelectedSubToReview(sub);
    setSelectedExamForReview(exam);

    // Initialize itemized scores from previous teacher review or AI score
    const initialMap: Record<string, { score: number; teacherNotes: string }> = {};
    (sub.answers || []).forEach(a => {
      initialMap[a.questionId] = {
        score: a.teacherScore !== undefined ? a.teacherScore : (a.aiScore || 0),
        teacherNotes: a.teacherFeedback || ''
      };
    });
    setItemizedScores(initialMap);
    setTeacherOverallFeedback(sub.teacherOverallFeedback || sub.aiOverallFeedback || '');
  };

  // Helper: Handle itemized question score change in review modal
  const handleItemScoreChange = (qId: string, maxPoints: number, val: number) => {
    const safeScore = Math.max(0, Math.min(maxPoints, isNaN(val) ? 0 : val));
    setItemizedScores(prev => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { teacherNotes: '' }),
        score: safeScore
      }
    }));
  };

  // Helper: Submit Teacher Review (Approve or Override AI decision)
  const handleSaveTeacherReview = async (useAiAsIs: boolean = false) => {
    if (!selectedSubToReview || !selectedExamForReview) return;
    setIsSavingReview(true);

    let finalCalculatedScore = 0;
    let totalMax = 0;

    selectedExamForReview.questions.forEach(q => {
      totalMax += q.points;
      if (useAiAsIs) {
        const ans = selectedSubToReview.answers.find(a => a.questionId === q.id);
        finalCalculatedScore += (ans?.aiScore || 0);
      } else {
        const item = itemizedScores[q.id];
        finalCalculatedScore += (item?.score !== undefined ? item.score : 0);
      }
    });

    const normalizedFinalPercent = totalMax > 0 
      ? Math.round((finalCalculatedScore / totalMax) * 100) 
      : finalCalculatedScore;

    const res = await reviewSubmission(selectedSubToReview.id, {
      finalScore: normalizedFinalPercent,
      teacherFeedback: useAiAsIs 
        ? `[Diverifikasi Guru] Hasil pengerjaan disetujui sesuai rekomendasi AI Gemini. Skor resmi: ${normalizedFinalPercent}/100.` 
        : (teacherOverallFeedback.trim() || `Telah diverifikasi langsung oleh ${currentUser?.name || 'Guru'}.`),
      approvedBy: currentUser?.name || 'Guru Pengampu',
      itemizedScores: useAiAsIs ? undefined : itemizedScores
    });

    setIsSavingReview(false);

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Nilai Ujian Diverifikasi & Dirilis',
        message: `Pengerjaan siswa ${selectedSubToReview.studentName} berhasil diverifikasi. Skor final: ${normalizedFinalPercent}/100.`
      });
      setSelectedSubToReview(null);
      setSelectedExamForReview(null);
      fetchSubmissions();
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Menyimpan Verifikasi',
        message: 'Koneksi ke server terputus.'
      });
    }
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return courseSubmissions.filter(sub => {
      const matchesSearch = !submissionSearch.trim() || 
        sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        sub.studentId.toLowerCase().includes(submissionSearch.toLowerCase());

      const matchesExam = selectedExamFilter === 'all' || sub.assignmentId === selectedExamFilter;

      const matchesStatus = selectedStatusFilter === 'all' || 
        (selectedStatusFilter === 'waiting' && sub.status === 'ai_graded_waiting_approval') ||
        (selectedStatusFilter === 'published' && sub.status === 'published');

      return matchesSearch && matchesExam && matchesStatus;
    });
  }, [courseSubmissions, submissionSearch, selectedExamFilter, selectedStatusFilter]);

  // Statistics counters
  const totalSubmissionsCount = courseSubmissions.length;
  const waitingApprovalCount = courseSubmissions.filter(s => s.status === 'ai_graded_waiting_approval').length;
  const publishedCount = courseSubmissions.filter(s => s.status === 'published').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                Fitur Kuis & Evaluasi
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Terintegrasi Safe Exam Browser (SEB)</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Ujian SEB & Evaluasi Cerdas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola ujian berbasis browser terkunci, pantau rekap pengerjaan siswa, dan verifikasi keputusan nilai AI.
            </p>
          </div>

          {/* Teacher Action: Buat Ujian SEB Baru */}
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Ujian SEB Baru</span>
              </button>
            </div>
          )}
        </div>

        {/* Teacher Navigation & Stat Counters */}
        {isTeacherOrAdmin && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabMode('exams')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTabMode === 'exams'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Daftar Ujian SEB ({courseExams.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('submissions')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTabMode === 'submissions'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Rekapan & Verifikasi Siswa ({totalSubmissionsCount})</span>
                {waitingApprovalCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {waitingApprovalCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold flex items-center gap-1.5">
                <span>Total Pengumpulan:</span>
                <strong className="text-slate-900">{totalSubmissionsCount}</strong>
              </div>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold flex items-center gap-1.5">
                <span>Perlu Diverifikasi:</span>
                <strong className="text-amber-800">{waitingApprovalCount}</strong>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center gap-1.5">
                <span>Tuntas Dirilis:</span>
                <strong className="text-emerald-800">{publishedCount}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================= VIEW 1: DAFTAR UJIAN SEB ======================= */}
      {(!isTeacherOrAdmin || activeTabMode === 'exams') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Daftar Ujian SEB Kursus ({courseExams.length} Ujian)</span>
            </h3>
            {isTeacherOrAdmin && (
              <span className="text-[11px] text-slate-500">
                Nama ujian dapat diganti sewaktu-waktu oleh guru.
              </span>
            )}
          </div>

          {courseExams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Ujian SEB yang Dibuat</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Guru dapat membuat ujian SEB baru dengan tipe soal tak terbatas, lampiran gambar diagram/stimulus, dan integrasi kamera.
              </p>
              {isTeacherOrAdmin && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Tambah Ujian SEB Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseExams.map((exam, idx) => {
                const examSubs = courseSubmissions.filter(s => s.assignmentId === exam.id);
                const studentSub = courseSubmissions.find(s => s.assignmentId === exam.id && s.studentId === currentUser?.id);
                const hasSubmitted = !!studentSub;

                return (
                  <div 
                    key={exam.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                              Ujian #{idx + 1}
                            </span>
                            {exam.isSebLocked && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>SEB Locked</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-base text-slate-900">
                            {exam.title}
                          </h4>
                        </div>

                        {/* Teacher Quick Actions: Rename / Edit & Delete */}
                        {isTeacherOrAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(exam)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Ubah Nama / Edit Ujian SEB"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExam(exam.id, exam.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Ujian SEB"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {exam.description || 'Tidak ada deskripsi tambahan.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{exam.durationMinutes} Menit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{exam.questions?.length || 0} Soal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{examSubs.length} Mengumpulkan</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {isTeacherOrAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExamFilter(exam.id);
                              setActiveTabMode('submissions');
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Lihat Rekap Siswa ({examSubs.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('exam', exam.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Uji Ruang SEB</span>
                          </button>
                        </>
                      ) : (
                        // Student View Actions
                        <div className="w-full flex items-center justify-between">
                          {hasSubmitted ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{studentSub.status === 'published' ? `Nilai: ${studentSub.totalTeacherScore ?? studentSub.totalAiScore}/100` : 'Menunggu Verifikasi'}</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setStudentViewSub(studentSub);
                                  setStudentViewExam(exam);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                              >
                                Lihat Ulasan Hasil
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigate && onNavigate('exam', exam.id)}
                              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Mulai Kerjakan Ujian SEB</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= VIEW 2: REKAPAN & MEJA PERIKSA GURU ======================= */}
      {isTeacherOrAdmin && activeTabMode === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa atau NISN..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="all">Semua Ujian SEB</option>
                  {courseExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="waiting">Menunggu Verifikasi Guru</option>
                  <option value="published">Telah Diverifikasi Guru</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchSubmissions();
                  showNotification({ type: 'info', title: 'Data Diperbarui', message: 'Daftar pengumpulan siswa disinkronkan.' });
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3.5">Nama Peserta Didik</th>
                    <th className="p-3.5">Ujian SEB</th>
                    <th className="p-3.5 text-center">Waktu Kumpul</th>
                    <th className="p-3.5 text-center">Integritas SEB</th>
                    <th className="p-3.5 text-center">Estimasi AI</th>
                    <th className="p-3.5 text-center">Skor Guru</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Tidak ada rekapan pengerjaan siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(sub => {
                      const matchedExam = courseExams.find(e => e.id === sub.assignmentId);
                      const isWaiting = sub.status === 'ai_graded_waiting_approval';
                      const violationsCount = sub.sebViolations?.length || 0;
                      const totalStudentPhotos = sub.answers?.reduce((acc, a) => acc + (a.imageUrls?.length || 0), 0) || 0;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {sub.studentName.charAt(0)}
                              </div>
                              <div>
                                <div>{sub.studentName}</div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>ID: {sub.studentId}</span>
                                  {totalStudentPhotos > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold inline-flex items-center gap-1">
                                      <Camera className="w-2.5 h-2.5" />
                                      <span>{totalStudentPhotos} Foto Jawaban</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-slate-800 font-semibold">
                            {matchedExam?.title || sub.assignmentId}
                          </td>

                          <td className="p-3.5 text-center text-slate-600 font-mono text-[11px]">
                            {sub.submittedAt}
                          </td>

                          <td className="p-3.5 text-center">
                            {violationsCount === 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                0 Pelanggaran (Aman)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {violationsCount}x Pelanggaran
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center font-extrabold text-blue-700">
                            {sub.totalAiScore}/100
                          </td>

                          <td className="p-3.5 text-center font-extrabold">
                            {sub.totalTeacherScore !== undefined ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {sub.totalTeacherScore}/100
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Belum Diverifikasi</span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            {isWaiting ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                Menunggu Verifikasi
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Rilis & Tuntas
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(sub)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Periksa & Verifikasi
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
        </div>
      )}

      {/* ======================= MODAL: CREATE / EDIT UJIAN SEB ======================= */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl p-6 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                  {editingExamId ? 'Ubah Nama & Butir Soal Ujian SEB' : 'Buat Ujian SEB Baru'}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {editingExamId ? `Edit: ${examTitle}` : 'Konfigurasi Ujian Safe Exam Browser'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-5">
              {/* Exam Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="sm:col-span-8 space-y-1">
                  <label className="block font-bold text-slate-700">Nama / Judul Ujian SEB:</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Contoh: Ujian Blok 1 — Kalkulus Turunan & Integral"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-slate-500">
                    Nama ujian ini dapat diubah sewaktu-waktu dan otomatis tampil di Buku Nilai (Gradebook).
                  </span>
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="block font-bold text-slate-700">Durasi Pengerjaan (Menit):</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-8 space-y-1">
                  <label className="block font-bold text-slate-700">Deskripsi / Petunjuk Pengerjaan:</label>
                  <textarea
                    rows={2}
                    value={examDesc}
                    onChange={(e) => setExamDesc(e.target.value)}
                    placeholder="Tuliskan petunjuk teknis ujian..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="block font-bold text-slate-700">Batas Waktu (Deadline):</label>
                  <input
                    type="date"
                    value={examDeadline}
                    onChange={(e) => setExamDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Questions Header & Quick Actions */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Daftar Butir Pertanyaan ({examQuestions.length} Soal)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tidak ada batasan jumlah soal. Anda dapat melampirkan foto stimulus / diagram pada setiap soal.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('mcq')}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 cursor-pointer"
                    >
                      + Pilihan Ganda
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('true_false')}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg border border-slate-300 cursor-pointer"
                    >
                      + Benar/Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('matching')}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg border border-indigo-200 cursor-pointer"
                    >
                      + Menjodohkan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('essay')}
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg border border-amber-200 cursor-pointer"
                    >
                      + Esai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchAddQuestions(5)}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 cursor-pointer"
                    >
                      +5 Soal Cepat
                    </button>
                  </div>
                </div>

                {/* Question Cards List */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {examQuestions.map((q, qIdx) => (
                    <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">#{qIdx + 1}</span>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              setExamQuestions(prev => prev.map(item => item.id === q.id ? { 
                                ...item, 
                                type: newType,
                                options: newType === 'mcq' ? (item.options || ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']) : undefined,
                                matchingPairs: newType === 'matching' ? (item.matchingPairs || [
                                  { id: `pair-1`, left: 'Premis 1', right: 'Kunci 1' },
                                  { id: `pair-2`, left: 'Premis 2', right: 'Kunci 2' }
                                ]) : undefined
                              } : item));
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-blue-800 cursor-pointer"
                          >
                            <option value="mcq">Pilihan Ganda (MCQ)</option>
                            <option value="true_false">Benar / Salah</option>
                            <option value="short">Isian Singkat</option>
                            <option value="numeric">Hitungan (Numerik)</option>
                            <option value="essay">Esai Analitis</option>
                            <option value="matching">Menjodohkan Pasangan</option>
                            <option value="image">Lembar Kerja Foto</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-600">Poin:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, points: val } : item));
                              }}
                              className="w-14 px-2 py-0.5 border border-slate-300 rounded text-center font-bold text-blue-700 bg-slate-50"
                            />
                          </div>

                          {examQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setExamQuestions(prev => prev.filter(item => item.id !== q.id))}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Hapus Soal Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt Textarea */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan / Soal:</label>
                        <textarea
                          rows={2}
                          value={q.prompt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, prompt: val } : item));
                          }}
                          placeholder="Tuliskan soal secara terperinci..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      {/* QUESTION IMAGE INPUT (Foto Soal / Stimulus / Diagram) */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Gambar Stimulus / Soal Bergambar (Opsional):</span>
                          </span>
                          {q.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, imageUrl: undefined } : item))}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Gambar</span>
                            </button>
                          )}
                        </div>

                        {q.imageUrl ? (
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => setPreviewFullPhoto(q.imageUrl!)}
                              className="w-24 h-18 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer relative group"
                              title="Klik untuk perbesar gambar soal"
                            >
                              <img src={q.imageUrl} alt="Stimulus" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px]">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              <span className="font-bold text-emerald-700 block">✓ Gambar Soal Terlampir</span>
                              <span>Siswa akan dapat melihat diagram / foto ini saat mengerjakan ujian.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-bold cursor-pointer transition flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              <span>Unggah Foto Soal / Diagram</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleQuestionImageUpload(q.id, e.target.files)}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[11px] text-slate-400">atau paste link gambar di deskripsi</span>
                          </div>
                        )}
                      </div>

                      {/* Type-Specific Editors */}
                      {q.type === 'mcq' && (
                        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-700 block">Pilihan Jawaban (Tandai Kunci Jawaban):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(q.options || ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                                <input
                                  type="radio"
                                  name={`correct_${q.id}`}
                                  checked={q.correctOptionIndex === optIdx}
                                  onChange={() => {
                                    setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctOptionIndex: optIdx } : item));
                                  }}
                                  className="text-blue-600 cursor-pointer"
                                />
                                <span className="font-bold font-mono text-slate-500">{String.fromCharCode(65 + optIdx)}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExamQuestions(prev => prev.map(item => {
                                      if (item.id === q.id) {
                                        const newOpts = [...(item.options || [])];
                                        newOpts[optIdx] = val;
                                        return { ...item, options: newOpts };
                                      }
                                      return item;
                                    }));
                                  }}
                                  className="w-full px-2 py-1 bg-transparent border-0 text-xs focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                          <span className="font-bold text-slate-700">Kunci Jawaban yang Benar:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name={`tf_${q.id}`}
                              checked={q.correctBoolean === true}
                              onChange={() => setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctBoolean: true } : item))}
                            />
                            <span>Benar (True)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name={`tf_${q.id}`}
                              checked={q.correctBoolean === false}
                              onChange={() => setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctBoolean: false } : item))}
                            />
                            <span>Salah (False)</span>
                          </label>
                        </div>
                      )}

                      {q.type === 'matching' && (
                        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 block">Daftar Pasangan Menjodohkan (Premis ➔ Kunci Jawaban):</span>
                            <button
                              type="button"
                              onClick={() => {
                                setExamQuestions(prev => prev.map(item => {
                                  if (item.id === q.id) {
                                    const pairs = [...(item.matchingPairs || [])];
                                    pairs.push({ id: `pair-${Date.now()}`, left: '', right: '' });
                                    return { ...item, matchingPairs: pairs };
                                  }
                                  return item;
                                }));
                              }}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold cursor-pointer"
                            >
                              + Baris Pasangan
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {(q.matchingPairs || []).map((pair, pIdx) => (
                              <div key={pair.id || pIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                                <span className="col-span-1 text-[10px] font-mono text-slate-400">#{pIdx + 1}</span>
                                <input
                                  type="text"
                                  placeholder="Premis kiri..."
                                  value={pair.left}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExamQuestions(prev => prev.map(item => {
                                      if (item.id === q.id) {
                                        const newP = [...(item.matchingPairs || [])];
                                        newP[pIdx] = { ...newP[pIdx], left: val };
                                        return { ...item, matchingPairs: newP };
                                      }
                                      return item;
                                    }));
                                  }}
                                  className="col-span-5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                                />
                                <span className="col-span-1 text-center font-bold text-slate-400">➔</span>
                                <input
                                  type="text"
                                  placeholder="Kunci pasangan kanan..."
                                  value={pair.right}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExamQuestions(prev => prev.map(item => {
                                      if (item.id === q.id) {
                                        const newP = [...(item.matchingPairs || [])];
                                        newP[pIdx] = { ...newP[pIdx], right: val };
                                        return { ...item, matchingPairs: newP };
                                      }
                                      return item;
                                    }));
                                  }}
                                  className="col-span-4 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-emerald-800"
                                />
                                <div className="col-span-1 flex justify-end">
                                  {(q.matchingPairs?.length || 0) > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExamQuestions(prev => prev.map(item => {
                                          if (item.id === q.id) {
                                            return { ...item, matchingPairs: (item.matchingPairs || []).filter((_, idx) => idx !== pIdx) };
                                          }
                                          return item;
                                        }));
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rubric / Expected Answer */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Kunci Jawaban Rujukan / Rubrik Penilaian AI:
                        </label>
                        <input
                          type="text"
                          value={q.expectedAnswer || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExamQuestions(prev => prev.map(item => item.id === q.id ? { ...item, expectedAnswer: val } : item));
                          }}
                          placeholder="Penjelasan konsep atau nilai hitungan yang diharapkan..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingExamId ? 'Simpan Perubahan Ujian' : 'Terbitkan Ujian SEB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: MEJA VERIFIKASI GURU (REVIEW & OVERRIDE) ======================= */}
      {selectedSubToReview && selectedExamForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                  Panel Verifikasi & Rilis Nilai Resmi Guru
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {selectedSubToReview.studentName} — {selectedExamForReview.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubToReview(null);
                  setSelectedExamForReview(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">Peserta Didik:</span>
                <strong className="text-slate-900 font-bold">{selectedSubToReview.studentName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Waktu Selesai:</span>
                <strong className="text-slate-800 font-mono">{selectedSubToReview.submittedAt}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Rekomendasi AI:</span>
                <strong className="text-blue-700 font-extrabold">{selectedSubToReview.totalAiScore}/100</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Status Integritas SEB:</span>
                <strong className={selectedSubToReview.sebViolations?.length ? 'text-rose-600' : 'text-emerald-700'}>
                  {selectedSubToReview.sebViolations?.length ? `${selectedSubToReview.sebViolations.length}x Pelanggaran` : 'Bersih (100% Aman)'}
                </strong>
              </div>
            </div>

            {/* AI Overall Feedback */}
            {selectedSubToReview.aiOverallFeedback && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ulasan Otomatis AI Gemini 3.8:</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  {selectedSubToReview.aiOverallFeedback}
                </p>
              </div>
            )}

            {/* Questions Breakdown */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Rincian Lembar Jawaban & Penyesuaian Skor per Butir Soal:
              </h4>

              {selectedExamForReview.questions.map((q, idx) => {
                const ans = selectedSubToReview.answers.find(a => a.questionId === q.id);
                const curScore = itemizedScores[q.id]?.score !== undefined 
                  ? itemizedScores[q.id].score 
                  : (ans?.teacherScore ?? ans?.aiScore ?? 0);

                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        Soal #{idx + 1} ({q.points} Poin) — <span className="uppercase text-[10px] font-mono text-slate-500">{q.type}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Skor Guru: {curScore}/{q.points} Poin
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-semibold">{q.prompt}</p>

                    {/* Question Image if uploaded by teacher */}
                    {q.imageUrl && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 max-w-md">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">Stimulus / Gambar Soal:</span>
                        <img 
                          src={q.imageUrl} 
                          alt="Gambar Soal" 
                          onClick={() => setPreviewFullPhoto(q.imageUrl!)}
                          className="max-h-48 object-contain rounded bg-white cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Student Answer */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Jawaban yang Diserahkan Siswa:
                      </span>

                      {q.type === 'mcq' && (
                        <div className="font-bold text-slate-900">
                          {q.options?.[ans?.selectedOptionIndex ?? 0] || '(Tidak Menjawab)'}
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div className="font-bold text-slate-900">
                          {ans?.selectedBoolean === true ? 'Benar (True)' : ans?.selectedBoolean === false ? 'Salah (False)' : '(Tidak Menjawab)'}
                        </div>
                      )}

                      {q.type === 'matching' && (
                        <div className="space-y-1.5">
                          {q.matchingPairs?.map((pair, pIdx) => {
                            const studentVal = (ans?.matchingAnswers || {})[pair.id || pair.left];
                            const isMatch = studentVal && studentVal.trim().toLowerCase() === pair.right.trim().toLowerCase();
                            return (
                              <div key={pair.id || pIdx} className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                isMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                              }`}>
                                <span className="font-semibold">{pIdx + 1}. {pair.left}</span>
                                <span className="font-mono font-bold flex items-center gap-1.5">
                                  <span>➔ {studentVal || '(Belum dipilih)'}</span>
                                  {isMatch ? (
                                    <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 py-0.5 rounded font-sans">Cocok ✓</span>
                                  ) : (
                                    <span className="text-[9px] bg-rose-200 text-rose-800 px-1 py-0.5 rounded font-sans">Kunci: {pair.right}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(q.type === 'short' || q.type === 'numeric' || q.type === 'essay' || q.type === 'image') && (
                        <div className="font-mono text-slate-900 whitespace-pre-wrap leading-relaxed">
                          {ans?.answerText || (ans?.imageUrls && ans.imageUrls.length > 0 ? '(Jawaban berupa foto lembar kerja terlampir)' : '(Kosong)')}
                        </div>
                      )}

                      {/* Attached Camera Photos Display (Universal for any question type) */}
                      {ans?.imageUrls && ans.imageUrls.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                          <div className="text-[10px] text-blue-700 font-bold mb-1.5 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-blue-600" />
                            <span>Foto Lembar Kerja / Coretan Siswa ({ans.imageUrls.length} Foto):</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ans.imageUrls.map((img: string, pIdx: number) => (
                              <div
                                key={pIdx}
                                onClick={() => setPreviewFullPhoto(img)}
                                className="w-20 h-16 rounded-lg overflow-hidden border border-slate-300 bg-black cursor-pointer hover:opacity-90 transition relative group shadow-2xs"
                                title="Klik untuk memperbesar foto"
                              >
                                <img src={img} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px]">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[8px] px-1 rounded font-mono">
                                  #{pIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Feedback & Teacher Adjust Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                      <div className="sm:col-span-8 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>Analisis AI:</span>
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700">
                            Saran AI: {ans?.aiScore ?? 0}/{q.points} Poin
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-950 leading-relaxed">
                          {ans?.aiFeedback || 'AI mengevaluasi kesesuaian langkah dan konsep dengan rubrik.'}
                        </p>
                      </div>

                      <div className="sm:col-span-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-amber-900">Skor Guru (0-{q.points}):</label>
                          <button
                            type="button"
                            onClick={() => handleItemScoreChange(q.id, q.points, ans?.aiScore ?? 0)}
                            className="text-[9px] font-bold text-blue-700 underline cursor-pointer"
                          >
                            Pakai Skor AI
                          </button>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={q.points}
                          value={curScore}
                          onChange={(e) => handleItemScoreChange(q.id, q.points, Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-extrabold text-blue-700 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Teacher Decision & Action */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block font-bold text-slate-800">
                Catatan Evaluasi Resmi Guru untuk Siswa:
              </label>
              <textarea
                rows={2}
                value={teacherOverallFeedback}
                onChange={(e) => setTeacherOverallFeedback(e.target.value)}
                placeholder="Tuliskan umpan balik resmi untuk siswa ini..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
              />

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveTeacherReview(true)}
                  disabled={isSavingReview}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Setujui Rekomendasi AI Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTeacherReview(false)}
                  disabled={isSavingReview}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingReview ? 'Menyimpan...' : 'Verifikasi & Rilis Nilai Resmi'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: SISWA MELIHAT ULASAN HASIL ======================= */}
      {studentViewSub && studentViewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Hasil Lembar Ujian SEB Anda
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {studentViewExam.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudentViewSub(null);
                  setStudentViewExam(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Skor Ujian Akhir</span>
                <div className="text-3xl font-extrabold text-emerald-700">
                  {studentViewSub.totalTeacherScore ?? studentViewSub.totalAiScore}
                  <span className="text-xs text-emerald-600 font-normal"> / 100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Status Verifikasi</span>
                <span className="font-bold text-slate-800">
                  {studentViewSub.status === 'published' ? '✓ Telah Diverifikasi Guru' : 'Sedang Menunggu Persetujuan Guru'}
                </span>
              </div>
            </div>

            {studentViewSub.teacherOverallFeedback && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-900 block">Catatan Pendidik:</span>
                <p className="text-xs text-blue-950">{studentViewSub.teacherOverallFeedback}</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Ulasan per Butir Soal:</h4>
              {studentViewExam.questions.map((q, idx) => {
                const ans = studentViewSub.answers?.find(a => a.questionId === q.id);
                return (
                  <div key={q.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">#{idx + 1} ({q.points} Poin)</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Skor: {ans?.teacherScore ?? ans?.aiScore ?? 0}/{q.points}
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium">{q.prompt}</p>

                    {/* Question image */}
                    {q.imageUrl && (
                      <div className="p-2 rounded bg-white border border-slate-200 max-w-sm">
                        <img src={q.imageUrl} alt="Stimulus" className="max-h-36 object-contain" />
                      </div>
                    )}

                    {ans?.imageUrls && ans.imageUrls.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] text-blue-700 font-bold block mb-1">Foto Lembar Kerja Terlampir:</span>
                        <div className="flex gap-2">
                          {ans.imageUrls.map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt="Foto"
                              onClick={() => setPreviewFullPhoto(img)}
                              className="w-16 h-12 rounded object-cover border border-slate-300 cursor-pointer"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= FULL PHOTO LIGHTBOX ======================= */}
      {previewFullPhoto && (
        <div
          onClick={() => setPreviewFullPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-800 text-white text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                Pratinjau Lembar Kerja / Foto Jawaban
              </span>
              <button
                type="button"
                onClick={() => setPreviewFullPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-black">
              <img src={previewFullPhoto} alt="Pratinjau Penuh" className="max-w-full max-h-[76vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
