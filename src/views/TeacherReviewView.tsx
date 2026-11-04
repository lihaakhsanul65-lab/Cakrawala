import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { Submission, StudentAnswer, ExamLockStatus } from '../types';
import { useNotification } from '../context/NotificationContext';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  UserCheck, 
  Clock, 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  FileText, 
  Camera, 
  AlertTriangle, 
  Award,
  Send,
  X,
  Sliders,
  Settings,
  Brain,
  FolderSync,
  Folder,
  Check,
  Lock,
  Unlock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { CreateSebExamModal } from '../components/CreateSebExamModal';

interface TeacherReviewViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { submissions, reviewSubmission, assignments, fetchSubmissions, fetchSebLocks, unlockExamForStudent } = useExam();
  const { isGoogleConnected, autoSyncEnabled, dedicatedFolder } = useGoogleWorkspace();

  const [isCreateSebModalOpen, setIsCreateSebModalOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(
    submissions.length > 0 ? submissions[0].id : null
  );

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'submissions' | 'seb-locks'>('submissions');
  const [sebLocks, setSebLocks] = useState<ExamLockStatus[]>([]);
  const [isLoadingLocks, setIsLoadingLocks] = useState(false);
  const [isRefreshingSubmissions, setIsRefreshingSubmissions] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<ExamLockStatus | null>(null);
  const [unlockReason, setUnlockReason] = useState('Izin pengerjaan ulang / dispensasi pendidik');
  const [allowResetSubmission, setAllowResetSubmission] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const loadSebLocks = async () => {
    setIsLoadingLocks(true);
    try {
      const data = await fetchSebLocks();
      setSebLocks(data);
    } catch {} finally {
      setIsLoadingLocks(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshingSubmissions(true);
    await fetchSubmissions();
    await loadSebLocks();
    setIsRefreshingSubmissions(false);
  };

  React.useEffect(() => {
    loadSebLocks();
    fetchSubmissions();
    // Live polling every 3 seconds so teacher immediately sees when student finishes exam!
    const timer = setInterval(() => {
      fetchSubmissions();
      loadSebLocks();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Auto-select latest submission if none selected or when a new submission arrives
  React.useEffect(() => {
    if (!selectedSubId && submissions.length > 0) {
      setSelectedSubId(submissions[0].id);
    }
  }, [submissions, selectedSubId]);

  const handleExecuteUnlock = async () => {
    if (!unlockTarget) return;
    setIsUnlocking(true);
    const res = await unlockExamForStudent(
      unlockTarget.assignmentId,
      unlockTarget.studentId,
      currentUser?.name || 'Guru Pengampu',
      unlockReason,
      allowResetSubmission
    );
    setIsUnlocking(false);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Kunci SEB Berhasil Dibuka',
        message: 'Siswa ' + unlockTarget.studentName + ' kini dapat membuka kembali ujian.'
      });
      setUnlockTarget(null);
      loadSebLocks();
    }
  };

  const handleQuickUnlockForActiveSub = async () => {
    if (!activeSub) return;
    setIsUnlocking(true);
    const res = await unlockExamForStudent(
      activeSub.assignmentId,
      activeSub.studentId,
      currentUser?.name || 'Guru Pengampu',
      'Izin re-entry / pengerjaan ulang dari Guru Pengampu',
      false
    );
    setIsUnlocking(false);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Akses SEB Siswa Dibuka',
        message: 'Kunci ujian untuk ' + activeSub.studentName + ' telah dibuka.'
      });
      loadSebLocks();
    }
  };

  const activeSub = submissions.find(s => s.id === selectedSubId);
  const activeAssignment = assignments.find(a => a.id === activeSub?.assignmentId);

  const [finalScoreInput, setFinalScoreInput] = useState<number>(
    activeSub?.totalTeacherScore ?? activeSub?.totalAiScore ?? 85
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(
    activeSub?.teacherOverallFeedback || ''
  );
  const [itemizedScores, setItemizedScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Initialize or re-sync itemized scores when activeSub changes
  React.useEffect(() => {
    if (!activeSub || !activeAssignment) return;
    const initialScores: Record<string, { score: number; feedback: string }> = {};
    activeAssignment.questions.forEach(q => {
      const ans = activeSub.answers.find(a => a.questionId === q.id);
      initialScores[q.id] = {
        score: ans?.teacherScore ?? ans?.aiScore ?? 0,
        feedback: ans?.teacherFeedback ?? ''
      };
    });
    setItemizedScores(initialScores);
    setFinalScoreInput(activeSub.totalTeacherScore ?? activeSub.totalAiScore ?? 85);
    setFeedbackInput(activeSub.teacherOverallFeedback || '');
  }, [activeSub?.id]);

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedSubId(sub.id);
    setSuccessNotice(null);
  };

  const handleItemScoreChange = (qId: string, maxPoints: number, val: number) => {
    const clamped = Math.max(0, Math.min(maxPoints, isNaN(val) ? 0 : val));
    setItemizedScores(prev => {
      const next = {
        ...prev,
        [qId]: {
          score: clamped,
          feedback: prev[qId]?.feedback || ''
        }
      };

      // Recalculate total score dynamically
      const totalPoints = Object.values(next).reduce((sum, item) => sum + (Number(item.score) || 0), 0);
      setFinalScoreInput(totalPoints);
      return next;
    });
  };

  const handleItemFeedbackChange = (qId: string, text: string) => {
    setItemizedScores(prev => ({
      ...prev,
      [qId]: {
        score: prev[qId]?.score ?? 0,
        feedback: text
      }
    }));
  };

  const handleApproveAiScore = async () => {
    if (!activeSub) return;
    setIsSaving(true);
    setSuccessNotice(null);

    await reviewSubmission(activeSub.id, {
      finalScore: activeSub.totalAiScore,
      teacherFeedback: feedbackInput.trim() || 'Hasil evaluasi dan rekomendasi AI Gemini telah disetujui resmi oleh guru.',
      approvedBy: currentUser?.name || 'Drs. Bambang Suryono, M.Pd'
    });

    setIsSaving(false);
    setSuccessNotice('Rekomendasi AI Gemini berhasil disetujui & dipublikasikan ke siswa!');
  };

  const handleSaveManualOverride = async () => {
    if (!activeSub) return;
    setIsSaving(true);
    setSuccessNotice(null);

    await reviewSubmission(activeSub.id, {
      finalScore: Number(finalScoreInput),
      teacherFeedback: feedbackInput.trim() || 'Nilai resmi telah disesuaikan dan difinalisasi oleh guru pengampu.',
      approvedBy: currentUser?.name || 'Drs. Bambang Suryono, M.Pd',
      itemizedScores
    });

    setIsSaving(false);
    setSuccessNotice('Nilai per-soal dan nilai akhir berhasil difinalisasi & dirilis ke siswa!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Penilaian & Review AI (Grader Report)</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Grader Gate
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Gemini AI Evaluator
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Portal Review Koreksi AI & Validasi Nilai Guru
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              title="Muat ulang jawaban ujian siswa terbaru dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingSubmissions ? 'animate-spin' : ''}`} />
              <span>Segarkan Jawaban ({submissions.length})</span>
            </button>

            <button
              onClick={() => setIsCreateSebModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-100" />
              <span>+ Tambah Ujian SEB Baru</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
              <FolderSync className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Penyimpanan Cloud GDrive</div>
                <div className="font-extrabold text-slate-800 flex items-center gap-1">
                  <span>{isGoogleConnected && autoSyncEnabled ? 'Auto-Sync Aktif' : 'Tersinkron Lokal'}</span>
                  {isGoogleConnected && autoSyncEnabled && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'submissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Hasil Evaluasi & Review Koreksi AI (${submissions.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('seb-locks');
              loadSebLocks();
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'seb-locks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Manajemen Kunci SEB Siswa</span>
            {sebLocks.filter(l => l.isLocked).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold">
                {sebLocks.filter(l => l.isLocked).length} Terkunci
              </span>
            )}
          </button>
        </div>

        {activeTab === 'submissions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Submissions List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider px-1">
              Hasil Pengerjaan Siswa ({submissions.length})
            </h3>

            <div className="space-y-2">
              {submissions.map((sub) => {
                const isSelected = sub.id === selectedSubId;
                const isApproved = sub.status === 'published';

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                      isSelected 
                        ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-200' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{sub.studentName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isApproved ? 'Disetujui' : 'Draft AI'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Waktu: {sub.submittedAt.split(' ')[1] || sub.submittedAt}</span>
                      <span className="font-bold text-blue-600">Skor AI: {sub.totalAiScore}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>{sub.sebViolations.length} Pelanggaran SEB</span>
                      {sub.totalTeacherScore !== undefined && (
                        <span className="font-extrabold text-emerald-700">Final: {sub.totalTeacherScore}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Review Box (8 cols) */}
          {activeSub ? (
            <div className="lg:col-span-8 space-y-4">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{activeSub.studentName}</h2>
                    <p className="text-xs text-slate-500">{activeAssignment?.title} • {activeSub.submittedAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Rekomendasi AI</div>
                      <div className="text-2xl font-extrabold text-blue-600">{activeSub.totalAiScore}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Catatan Keseluruhan Analisis AI Gemini:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{activeSub.aiOverallFeedback}</p>
                </div>

                {activeSub.sebViolations.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-800">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Log Pelanggaran Safe Exam Browser ({activeSub.sebViolations.length}x):</span>
                    </div>
                    {activeSub.sebViolations.map((v, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600">• {v.description} ({v.timestamp})</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Lembar Jawaban Siswa & Koreksi Per Butir Soal</span>
                  </h3>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    Otomatis Menghitung Ulang Total Nilai
                  </span>
                </div>

                {activeAssignment?.questions.map((q, idx) => {
                  const ans = activeSub.answers.find(a => a.questionId === q.id);
                  const currentItem = itemizedScores[q.id] || {
                    score: ans?.teacherScore ?? ans?.aiScore ?? 0,
                    feedback: ans?.teacherFeedback ?? ''
                  };
                  const isOverridden = ans && currentItem.score !== (ans.aiScore ?? 0);

                  return (
                    <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs transition hover:border-slate-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="font-extrabold text-xs text-slate-900">
                          Soal #{idx + 1} <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-1">{q.type}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Bobot: {q.points} Poin</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            Rekomendasi AI: {ans?.aiScore ?? 0}/{q.points}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 font-semibold leading-relaxed">{q.prompt}</p>

                      {/* Student Submitted Answer */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                          Lembar Jawaban Siswa ({q.type.toUpperCase()}):
                        </div>

                        {q.type === 'mcq' && (
                          <div className="font-semibold text-slate-800">
                            Pilihan Siswa: <span className="text-blue-700 font-bold">{q.options?.[ans?.selectedOptionIndex ?? 0] || 'Tidak menjawab'}</span>
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="font-semibold text-slate-800">
                            Jawaban Siswa: <span className="text-blue-700 font-bold">
                              {ans?.selectedBoolean === true ? 'Benar (True)' : ans?.selectedBoolean === false ? 'Salah (False)' : 'Tidak menjawab'}
                            </span>
                          </div>
                        )}

                        {(q.type === 'short' || q.type === 'numeric') && (
                          <div className="font-mono text-slate-900 bg-white p-2 rounded-lg border border-slate-200 inline-block">
                            {ans?.answerText || '(Kosong / Tidak menjawab)'}
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <div className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                            {ans?.answerText || (ans?.imageUrls && ans.imageUrls.length > 0 ? '(Jawaban berupa foto lembar kerja terlampir di bawah)' : '(Tidak ada teks pengerjaan)')}
                          </div>
                        )}

                        {q.type === 'matching' && (
                          <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-700 block text-[11px]">Pasangan yang Dijodohkan Siswa:</span>
                            {q.matchingPairs && q.matchingPairs.length > 0 ? (
                              <div className="divide-y divide-slate-100 text-xs">
                                {q.matchingPairs.map((pair, pIdx) => {
                                  const studentMatched = ans?.matchingAnswers?.[pair.id] || ans?.matchingAnswers?.[pair.left] || '';
                                  const isCorrect = studentMatched === pair.right;
                                  return (
                                    <div key={pIdx} className="py-1 flex items-center justify-between">
                                      <span className="font-semibold text-slate-800">{pair.left}</span>
                                      <span className="text-slate-400 font-bold">➔</span>
                                      <span className={`font-mono font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {studentMatched || '(Belum dijodohkan)'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Data pasangan tidak tersedia</span>
                            )}
                          </div>
                        )}

                        {/* ALWAYS RENDER STUDENT CAMERA PHOTOS REGARDLESS OF QUESTION TYPE */}
                        {ans?.imageUrls && ans.imageUrls.length > 0 ? (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lampiran Foto Lembar Kerja Siswa ({ans.imageUrls.length} Foto Jepretan Kamera Web) — Klik untuk Memperbesar:</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {ans.imageUrls.map((url, i) => (
                                <div
                                  key={i}
                                  onClick={() => setZoomedImage(url)}
                                  className="w-28 h-24 rounded-xl overflow-hidden border-2 border-slate-300 hover:border-blue-500 cursor-pointer shadow-xs transition group relative bg-black"
                                  title="Klik untuk zoom berkas pengerjaan siswa"
                                >
                                  <img src={url} alt={`Lampiran ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs">
                                    <Eye className="w-4 h-4 mr-1" />
                                    <span>Zoom</span>
                                  </div>
                                  <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                    Foto #{i + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : q.type === 'image' ? (
                          <div className="text-slate-400 italic text-[11px] pt-1">
                            (Siswa tidak melampirkan foto lembar kerja pada butir soal ini)
                          </div>
                        ) : null}
                      </div>

                      {/* AI Evaluation */}
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-blue-700 text-[11px] flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Evaluasi Cerdas AI Gemini:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">{ans?.aiFeedback || 'Evaluasi AI otomatis diterapkan.'}</p>
                      </div>

                      {/* Guru Score Override & Notes per Question */}
                      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-amber-600" />
                            <span>Koreksi & Edit Nilai Guru (Override Skor Butir Ini):</span>
                          </span>
                          {isOverridden && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                              Diedit Guru (AI: {ans?.aiScore ?? 0} → {currentItem.score})
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Skor Soal (Maks {q.points}):
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={q.points}
                              value={currentItem.score}
                              onChange={(e) => handleItemScoreChange(q.id, q.points, Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-extrabold text-blue-700 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Catatan Koreksi Guru (Tampil di Lembar Siswa):
                            </label>
                            <input
                              type="text"
                              value={currentItem.feedback}
                              onChange={(e) => handleItemFeedbackChange(q.id, e.target.value)}
                              placeholder={`Contoh: Langkah pengerjaan benar, tetapi ada kesalahan kalkulasi limit akhir.`}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Teacher Decision Box */}
              <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Otoritas Penilaian Guru & Rekalkulasi Otomatis (Teacher Final Authority):</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                    Total Dihitung Otomatis: {finalScoreInput}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Nilai Akhir (0-100):</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={finalScoreInput}
                      onChange={(e) => setFinalScoreInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-lg font-extrabold text-blue-700 focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Otomatis terakumulasi dari total per butir soal di atas.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Evaluasi Resmi Guru (Global):</label>
                    <input
                      type="text"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Tuliskan umpan balik untuk siswa..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={handleApproveAiScore}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Hasil AI ({activeSub.totalAiScore}) & Publikasikan</span>
                  </button>
                  <button
                    onClick={handleSaveManualOverride}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>Simpan Nilai Hasil Edit Guru ({finalScoreInput}) & Rilis ke Siswa</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
              Pilih salah satu siswa di sebelah kiri untuk memeriksa jawaban.
            </div>
          )}
        </div>
        ) : (
          /* SEB Locks Table */
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Siswa Terkunci Safe Exam Browser (Aturan 1 Kali Pengerjaan & Pelanggaran)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sebagai Guru Pengampu atau Admin, Anda dapat memberikan dispensasi pembukaan kunci SEB bagi siswa yang mengalami kendala teknis atau izin pengerjaan ulang.
                </p>
              </div>
              <button
                onClick={loadSebLocks}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLocks ? "animate-spin" : ""}`} />
                <span>Segarkan Data Kunci</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Peserta Didik</th>
                      <th className="p-4">Ujian & Mata Pelajaran</th>
                      <th className="p-4">Status SEB</th>
                      <th className="p-4">Alasan Terkunci / Riwayat Dispensasi</th>
                      <th className="p-4">Waktu</th>
                      <th className="p-4 text-right">Tindakan Pembukaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sebLocks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {isLoadingLocks ? "Memuat status kunci..." : "Belum ada catatan kunci SEB aktif."}
                        </td>
                      </tr>
                    ) : (
                      sebLocks.map((lock, idx) => {
                        const isLocked = lock.isLocked;
                        return (
                          <tr key={`${lock.assignmentId}_${lock.studentId}_${idx}`} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{lock.studentName || "Siswa"}</div>
                              <div className="text-[11px] text-slate-400 font-mono">NISN: {lock.studentNis || "-"} • {lock.studentClass || "-"}</div>
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
                              <div className="text-[11px] text-slate-700 leading-snug">{lock.lockedReason || "-"}</div>
                              {lock.unlockedBy && (
                                <div className="text-[10px] text-blue-700 mt-1 font-medium">
                                  Dibuka oleh: {lock.unlockedBy} ({lock.unlockedAt || "-"})
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-[11px] font-mono text-slate-500">
                              {lock.submittedAt || lock.unlockedAt || "-"}
                            </td>
                            <td className="p-4 text-right">
                              {isLocked ? (
                                <button
                                  onClick={() => {
                                    setUnlockTarget(lock);
                                    setUnlockReason("Dispensasi pengerjaan ulang oleh Guru Pengampu");
                                    setAllowResetSubmission(true);
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Buka Kunci SEB</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                  Akses Dibuka
                                </span>
                              )}
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

        {/* Modal: Buka Kunci SEB */}
        {unlockTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-rose-950 flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-rose-600" />
                  <span>Buka Kunci Safe Exam Browser (SEB) Siswa</span>
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
                    Jika dicentang, berkas pengerjaan sebelumnya akan dihapus sehingga siswa dapat memulai pengerjaan ujian baru secara bersih.
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
                    onClick={handleExecuteUnlock}
                    disabled={isUnlocking}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isUnlocking ? "Membuka Kunci..." : "Buka Kunci Sekarang"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Tambah Ujian SEB Mandiri oleh Guru */}
      {isCreateSebModalOpen && (
        <CreateSebExamModal
          onClose={() => setIsCreateSebModalOpen(false)}
          onSuccess={() => {
            setIsCreateSebModalOpen(false);
            showNotification({
              type: 'success',
              title: 'Ujian SEB Baru Berhasil Dibuat',
              message: 'Ujian berbasis Safe Exam Browser berhasil ditambahkan dan siap dikerjakan siswa.'
            });
          }}
        />
      )}

      {zoomedImage && (
        <div onClick={() => setZoomedImage(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-zoom-out">
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
};
