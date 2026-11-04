import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { useExam } from '../context/ExamContext';
import { useNotification } from '../context/NotificationContext';
import { Question, QuestionType, Assignment } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  Brain, 
  Clock, 
  AlertTriangle, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  Camera, 
  Layers,
  Calendar,
  Lock,
  Upload,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';

interface CreateSebExamModalProps {
  initialCourseId?: string;
  onClose: () => void;
  onSuccess?: (newExam: Assignment) => void;
}

export const CreateSebExamModal: React.FC<CreateSebExamModalProps> = ({
  initialCourseId,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { courses } = useCourses();
  const { createAssignment } = useExam();
  const { showNotification } = useNotification();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || (courses.length > 0 ? courses[0].id : 'crs-mat-12')
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(
    'Ujian terstandarisasi dengan mode Safe Exam Browser (Web SEB). Dilarang berpindah tab atau keluar dari mode layar penuh.'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [isSebLocked, setIsSebLocked] = useState<boolean>(true);
  const [maxViolations, setMaxViolations] = useState<number>(3);

  // Questions List
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q-${Date.now()}-1`,
      type: 'mcq',
      prompt: 'Berapakah nilai limit dari lim x->0 (sin 4x / 2x)?',
      points: 25,
      options: ['1', '2', '4', '8'],
      correctOptionIndex: 1,
      expectedAnswer: 'Gunakan teorema limit dasar lim x->0 (sin ax / bx) = a / b = 4 / 2 = 2.',
      rubricCriteria: 'Pemilihan opsi yang tepat.'
    },
    {
      id: `q-${Date.now()}-2`,
      type: 'essay',
      prompt: 'Buktikan dan jabarkan langkah penurunan rumus limit lim x->0 (1 - cos 2x) / (x sin x) = 2 menggunakan identitas sudut ganda!',
      points: 25,
      expectedAnswer: '1 - cos 2x = 2 sin^2 x. Substitusi ke limit: lim x->0 [2 sin x sin x / (x sin x)] = lim x->0 [2 sin x / x] = 2(1) = 2.',
      rubricCriteria: 'Kelengkapan penurunan identitas sudut ganda dan ketepatan perhitungan aljabar.'
    },
    {
      id: `q-${Date.now()}-3`,
      type: 'short',
      prompt: 'Jika y = sin(3x), berapakah turunan pertama dy/dx saat x = 0?',
      points: 25,
      expectedAnswer: '3',
      rubricCriteria: 'dy/dx = 3 cos(3x). Saat x=0, 3 cos(0) = 3(1) = 3.'
    },
    {
      id: `q-${Date.now()}-4`,
      type: 'image',
      prompt: 'Tuliskan langkah lengkap pembuktian kecekungan kurva f(x) = sin 2x pada lembar kertas jawaban, lalu foto langsung menggunakan kamera perangkat Anda!',
      points: 25,
      expectedAnswer: 'Foto lembar kerja menunjukkan turunan pertama f\'(x)=2 cos 2x dan turunan kedua f\'\'(x)=-4 sin 2x dengan uji interval titik belok.',
      rubricCriteria: 'Keterbacaan tulisan tangan foto lembar kerja dan kebenaran analisis turunan kedua.'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generator state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Add Question with unlimited flexibility and all supported question types
  const handleAddQuestion = (type: QuestionType = 'mcq') => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      type,
      prompt: '',
      points: 20,
      options: type === 'mcq' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined,
      correctOptionIndex: type === 'mcq' ? 0 : undefined,
      correctBoolean: type === 'true_false' ? true : undefined,
      matchingPairs: type === 'matching' ? [
        { id: `pair-${Date.now()}-1`, left: 'Konsep A', right: 'Definisi A' },
        { id: `pair-${Date.now()}-2`, left: 'Konsep B', right: 'Definisi B' },
        { id: `pair-${Date.now()}-3`, left: 'Konsep C', right: 'Definisi C' }
      ] : undefined,
      expectedAnswer: '',
      rubricCriteria: 'Rubrik penilaian standar AI & guru'
    };
    setQuestions(prev => [...prev, newQ]);
  };

  // Adjust total question count directly without limit
  const handleSetQuestionCount = (targetCount: number) => {
    const target = Math.max(1, targetCount);
    setQuestions(prev => {
      if (target > prev.length) {
        const added: Question[] = [];
        for (let i = prev.length; i < target; i++) {
          added.push({
            id: `q-${Date.now()}-${i + 1}`,
            type: 'mcq',
            prompt: '',
            points: 10,
            options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
            correctOptionIndex: 0,
            expectedAnswer: '',
            rubricCriteria: 'Rubrik penilaian standar AI & guru'
          });
        }
        return [...prev, ...added];
      } else if (target < prev.length) {
        return prev.slice(0, target);
      }
      return prev;
    });
  };

  const handleBatchAddQuestions = (countToAdd: number, type: QuestionType = 'mcq') => {
    const added: Question[] = [];
    for (let i = 0; i < countToAdd; i++) {
      added.push({
        id: `q-${Date.now()}-${questions.length + i + 1}`,
        type,
        prompt: '',
        points: 10,
        options: type === 'mcq' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined,
        correctOptionIndex: type === 'mcq' ? 0 : undefined,
        correctBoolean: type === 'true_false' ? true : undefined,
        matchingPairs: type === 'matching' ? [
          { id: `pair-${Date.now()}-1`, left: 'Konsep 1', right: 'Pasangan 1' },
          { id: `pair-${Date.now()}-2`, left: 'Konsep 2', right: 'Pasangan 2' }
        ] : undefined,
        expectedAnswer: '',
        rubricCriteria: 'Rubrik penilaian standar AI & guru'
      });
    }
    setQuestions(prev => [...prev, ...added]);
    showNotification({
      type: 'success',
      title: 'Butir Soal Ditambahkan',
      message: `Berhasil menambahkan ${countToAdd} butir soal baru (total: ${questions.length + countToAdd} soal).`
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      showNotification({
        type: 'warning',
        title: 'Minimal 1 Soal',
        message: 'Ujian wajib memiliki sekurang-kurangnya 1 butir pertanyaan.'
      });
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== index) return q;
      const updated = { ...q, ...updates };
      // If type changed, initialize appropriate fields
      if (updates.type && updates.type !== q.type) {
        if (updates.type === 'mcq' && !updated.options) {
          updated.options = ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
          updated.correctOptionIndex = 0;
        } else if (updates.type === 'true_false' && updated.correctBoolean === undefined) {
          updated.correctBoolean = true;
        } else if (updates.type === 'matching' && (!updated.matchingPairs || updated.matchingPairs.length === 0)) {
          updated.matchingPairs = [
            { id: `pair-${Date.now()}-1`, left: 'Pernyataan 1', right: 'Pasangan 1' },
            { id: `pair-${Date.now()}-2`, left: 'Pernyataan 2', right: 'Pasangan 2' }
          ];
        }
      }
      return updated;
    }));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex || !q.options) return q;
      const newOpts = [...q.options];
      newOpts[optIndex] = text;
      return { ...q, options: newOpts };
    }));
  };

  const handleAddOptionToMcq = (qIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const curOpts = q.options || ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
      const nextLetter = String.fromCharCode(65 + curOpts.length);
      return { ...q, options: [...curOpts, `Opsi ${nextLetter}`] };
    }));
  };

  const handleRemoveOptionFromMcq = (qIndex: number, optIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex || !q.options || q.options.length <= 2) return q;
      const newOpts = q.options.filter((_, idx) => idx !== optIndex);
      const newCorrect = (q.correctOptionIndex ?? 0) >= newOpts.length ? 0 : q.correctOptionIndex;
      return { ...q, options: newOpts, correctOptionIndex: newCorrect };
    }));
  };

  const handleAddMatchingPair = (qIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const curPairs = q.matchingPairs || [];
      const newPair = {
        id: `pair-${Date.now()}-${curPairs.length + 1}`,
        left: `Premis ${curPairs.length + 1}`,
        right: `Pasangan ${curPairs.length + 1}`
      };
      return { ...q, matchingPairs: [...curPairs, newPair] };
    }));
  };

  const handleUpdateMatchingPair = (qIndex: number, pairIndex: number, field: 'left' | 'right', val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex || !q.matchingPairs) return q;
      const newPairs = [...q.matchingPairs];
      newPairs[pairIndex] = { ...newPairs[pairIndex], [field]: val };
      return { ...q, matchingPairs: newPairs };
    }));
  };

  const handleRemoveMatchingPair = (qIndex: number, pairIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex || !q.matchingPairs || q.matchingPairs.length <= 1) return q;
      return { ...q, matchingPairs: q.matchingPairs.filter((_, idx) => idx !== pairIndex) };
    }));
  };

  // AI Question Generator for Teachers
  const handleGenerateQuestionsWithAi = async () => {
    const topicToUse = aiTopic.trim() || selectedCourse?.title || 'Kalkulus Terapan SMA';
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          count: 3,
          difficulty: 'Sedang'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          const formatted: Question[] = data.questions.map((item: any, idx: number) => ({
            id: `q-ai-${Date.now()}-${idx}`,
            type: item.type === 'mcq' ? 'mcq' : item.type === 'short' ? 'short' : 'essay',
            prompt: item.prompt || item.question || 'Soal ujian',
            points: Number(item.points) || 25,
            options: item.options || (item.type === 'mcq' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined),
            correctOptionIndex: item.correctOptionIndex ?? 0,
            expectedAnswer: item.expectedAnswer || item.explanation || 'Kunci rujukan materi',
            rubricCriteria: item.rubricCriteria || 'Analisis konsep sesuai materi web'
          }));

          setQuestions(formatted);
          if (!title) {
            setTitle(`Ujian SEB: ${topicToUse}`);
          }
          showNotification({
            type: 'success',
            title: 'Soal Berhasil Digenerate AI',
            message: `Berhasil membuat ${formatted.length} butir soal ujian dari topik "${topicToUse}".`
          });
          setShowAiPrompt(false);
          return;
        }
      }
      throw new Error('Gagal dari server');
    } catch {
      showNotification({
        type: 'info',
        title: 'Generator Soal Siap',
        message: 'Gunakan template butir soal di bawah untuk menyusun soal ujian Anda.'
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Save New SEB Exam
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showNotification({
        type: 'error',
        title: 'Judul Wajib Diisi',
        message: 'Silakan isi judul ujian SEB terlebih dahulu.'
      });
      return;
    }

    if (questions.some(q => !q.prompt.trim())) {
      showNotification({
        type: 'error',
        title: 'Teks Soal Belum Lengkap',
        message: 'Mohon pastikan semua butir soal memiliki teks pertanyaan yang valid.'
      });
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<Assignment> = {
      courseId: selectedCourseId,
      courseTitle: selectedCourse?.title || 'Mata Pelajaran SMA',
      title: title.trim(),
      description: description.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      deadline,
      isSebLocked,
      maxViolations: Number(maxViolations) || 3,
      questions
    };

    const res = await createAssignment(payload);
    setIsSubmitting(false);

    if (res.success && res.assignment) {
      showNotification({
        type: 'success',
        title: 'Ujian SEB Berhasil Diterbitkan!',
        message: `Ujian "${title}" kini aktif dan dapat diakses siswa di portal Ujian SEB.`
      });
      if (onSuccess) onSuccess(res.assignment);
      onClose();
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Membuat Ujian',
        message: 'Terjadi kendala saat menyimpan ujian ke server.'
      });
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight">Tambah Ujian Baru (Mode SEB)</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                  Mandiri Guru
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Buat dan publikasikan jadwal ujian Safe Exam Browser kapan saja tanpa koordinasi admin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          
          {/* Main Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Utama Ujian</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Pendidik: <strong className="text-slate-800">{currentUser?.name || 'Guru'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mata Pelajaran / Kursus</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.code}) - {c.targetClass}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Ujian SEB</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ujian Blok 2: Limit Trigonometri & Kalkulus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Petunjuk & Tata Tertib Pengerjaan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan petunjuk pengerjaan ujian..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Durasi Ujian (Menit)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Batas Waktu (Deadline)</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* SEB Lockdown Settings */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-emerald-50/40 transition">
                <input
                  type="checkbox"
                  checked={isSebLocked}
                  onChange={(e) => setIsSebLocked(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mode Lockdown Layar Penuh (SEB)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Kunci tab, cegah alt-tab, dan aktifkan sensor integritas.</div>
                </div>
              </label>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Toleransi Pelanggaran Tab/Blur (Max Violations)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* AI Question Drafting Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                  Bantuan AI Generator Soal Ujian
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">Gemini 3.8</span>
                </span>
                <p className="text-[11px] text-blue-800">
                  Buat draf butir soal ujian secara otomatis berdasarkan topik atau materi kursus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showAiPrompt ? (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Ketik topik soal..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs text-slate-800 w-full sm:w-48 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateQuestionsWithAi}
                    disabled={isAiGenerating}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? 'Membuat...' : 'Buat'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAiPrompt(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAiPrompt(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Draf Soal dengan AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Question List Builder (Unlimited Questions & All Question Types) */}
          <div className="space-y-4">
            
            {/* Header Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      Daftar Butir Soal Ujian ({questions.length} Butir)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Total Bobot: {totalPoints} Poin
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Bebas / Tanpa Batas Maksimal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Guru bebas menentukan jumlah soal ujian berapapun tanpa batasan sistem.
                  </p>
                </div>

                {/* Quick Count Setter */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-600">Tambah Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleBatchAddQuestions(1, 'mcq')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +1 Soal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchAddQuestions(5, 'mcq')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +5 Soal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchAddQuestions(10, 'mcq')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +10 Soal
                  </button>
                </div>
              </div>

              {/* Type Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-bold">Pilih Tipe Soal:</span>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('mcq')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>🔘 Pilihan Ganda</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>⚖️ Benar / Salah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('short')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>✏️ Isian Singkat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('numeric')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>🔢 Hitungan (Numerik)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('essay')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>📝 Esai Analitis</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('matching')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <span>🔗 Menjodohkan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('image')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  <Camera className="w-3 h-3" />
                  <span>📷 Lembar Kerja Foto</span>
                </button>
              </div>

              {/* Informative Banner */}
              <div className="p-2.5 rounded-xl bg-blue-100/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                <Camera className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Integrasi Kamera Web Terbuka:</strong> Pada SEMUA tipe soal di atas, siswa tetap dapat menjepret foto lembar kerja / coretan kertas mereka menggunakan kamera web terintegrasi. Seluruh foto yang dikirimkan siswa akan otomatis tampil lengkap di meja penilaian guru.
                </p>
              </div>
            </div>

            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 relative group hover:border-emerald-300 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>

                    {/* Dynamic Question Type Switcher */}
                    <select
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(idx, { type: e.target.value as QuestionType })}
                      className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="mcq">🔘 Pilihan Ganda (MCQ)</option>
                      <option value="true_false">⚖️ Benar / Salah (True/False)</option>
                      <option value="short">✏️ Isian Singkat</option>
                      <option value="numeric">🔢 Hitungan (Numerik)</option>
                      <option value="essay">📝 Esai Analitis (AI)</option>
                      <option value="matching">🔗 Menjodohkan Pasangan</option>
                      <option value="image">📷 Lembar Kerja Foto</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Poin:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(idx, { points: Number(e.target.value) })}
                        className="w-14 p-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus butir soal ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Text */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Teks Pertanyaan / Soal</label>
                  <textarea
                    rows={2}
                    required
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(idx, { prompt: e.target.value })}
                    placeholder={`Tuliskan pertanyaan nomor ${idx + 1}...`}
                    className="w-full p-2.5 bg-slate-50/60 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Question Image (Stimulus / Diagram / Foto Soal) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lampirkan Foto Soal / Stimulus / Diagram (Opsional):</span>
                    </span>
                    {q.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { imageUrl: undefined })}
                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Gambar</span>
                      </button>
                    )}
                  </div>

                  {q.imageUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white">
                        <img src={q.imageUrl} alt="Stimulus" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="font-bold text-emerald-700 block">✓ Gambar Soal Berhasil Dilampirkan</span>
                        <span>Siswa akan dapat melihat foto stimulus ini saat ujian.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unggah Foto Soal / Diagram</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            const file = files[0];
                            if (!file.type.startsWith('image/')) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                handleUpdateQuestion(idx, { imageUrl: reader.result });
                                showNotification({
                                  type: 'info',
                                  title: 'Gambar Soal Terpasang',
                                  message: `Foto soal nomor ${idx + 1} berhasil dilampirkan.`
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">Format PNG, JPG, JPEG</span>
                    </div>
                  )}
                </div>

                {/* Question Type: MCQ */}
                {q.type === 'mcq' && q.options && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-600">
                        Pilihan Jawaban & Tandai Kunci Jawaban Benar:
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddOptionToMcq(idx)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        + Tambah Opsi Pilihan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                          <input
                            type="radio"
                            name={`mcq-${q.id}`}
                            checked={q.correctOptionIndex === oIdx}
                            onChange={() => handleUpdateQuestion(idx, { correctOptionIndex: oIdx })}
                            className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="font-bold text-slate-500 text-[11px] w-4">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                            placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 p-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                          />
                          {q.options && q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromMcq(idx, oIdx)}
                              className="text-slate-400 hover:text-rose-500 p-0.5"
                              title="Hapus opsi ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Type: TRUE / FALSE */}
                {q.type === 'true_false' && (
                  <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-950">
                      Pilih Kunci Jawaban yang Benar:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className={`flex-1 p-2.5 rounded-xl border cursor-pointer font-bold text-xs flex items-center justify-between transition ${
                        q.correctBoolean === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-700'
                      }`}>
                        <span>Benar (True)</span>
                        <input
                          type="radio"
                          name={`tf-${q.id}`}
                          checked={q.correctBoolean === true}
                          onChange={() => handleUpdateQuestion(idx, { correctBoolean: true })}
                          className="hidden"
                        />
                        {q.correctBoolean === true && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </label>
                      <label className={`flex-1 p-2.5 rounded-xl border cursor-pointer font-bold text-xs flex items-center justify-between transition ${
                        q.correctBoolean === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 text-slate-700'
                      }`}>
                        <span>Salah (False)</span>
                        <input
                          type="radio"
                          name={`tf-${q.id}`}
                          checked={q.correctBoolean === false}
                          onChange={() => handleUpdateQuestion(idx, { correctBoolean: false })}
                          className="hidden"
                        />
                        {q.correctBoolean === false && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </label>
                    </div>
                  </div>
                )}

                {/* Question Type: MATCHING PAIRS */}
                {q.type === 'matching' && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-amber-950">
                        Pasangan Menjodohkan (Premis Kiri ➔ Pasangan Kanan yang Tepat):
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddMatchingPair(idx)}
                        className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        + Tambah Pasangan Baru
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(q.matchingPairs || []).map((pair, pIdx) => (
                        <div key={pair.id || pIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-800 w-5 text-center">#{pIdx + 1}</span>
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => handleUpdateMatchingPair(idx, pIdx, 'left', e.target.value)}
                            placeholder="Premis / Soal Kiri (cth: Limit sin x / x saat x->0)"
                            className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <span className="text-slate-400 font-bold">➔</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => handleUpdateMatchingPair(idx, pIdx, 'right', e.target.value)}
                            placeholder="Pasangan Kanan (cth: 1)"
                            className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          {(q.matchingPairs || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMatchingPair(idx, pIdx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Hapus pasangan ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Essay / Short / Numeric / Image Expected Answer & Rubric Criteria */}
                {(q.type === 'essay' || q.type === 'short' || q.type === 'numeric' || q.type === 'image') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Kunci Jawaban Rujukan {q.type === 'numeric' ? '(Angka Pasti)' : '(Untuk Koreksi AI & Guru)'}
                      </label>
                      <input
                        type="text"
                        value={q.expectedAnswer || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { expectedAnswer: e.target.value })}
                        placeholder={q.type === 'numeric' ? 'Contoh: 16 atau 3.14' : 'Contoh: Jawaban akhir atau formula inti...'}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Rubrik Penilaian AI Gemini & Pendidik
                      </label>
                      <input
                        type="text"
                        value={q.rubricCriteria || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { rubricCriteria: e.target.value })}
                        placeholder="Contoh: Kelengkapan pembuktian langkah aljabar dan ketepatan kalkulasi..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Menerbitkan Ujian...' : 'Publikasikan Ujian SEB Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
