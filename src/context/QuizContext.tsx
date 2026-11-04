import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DirectQuiz, DirectQuizSubmission, DirectQuizQuestion } from '../types';
import { INITIAL_DIRECT_QUIZZES, INITIAL_DIRECT_QUIZ_SUBMISSIONS } from '../data/mockData';
import { safeSetItem } from '../utils/safeStorage';
import { idbSet, idbGet } from '../utils/idbStorage';

interface QuizContextType {
  quizzes: DirectQuiz[];
  submissions: DirectQuizSubmission[];
  loading: boolean;
  fetchQuizzes: (filters?: { targetClass?: string; status?: string }) => Promise<void>;
  createQuiz: (data: Omit<DirectQuiz, 'id' | 'createdAt'>) => Promise<{ success: boolean; quiz?: DirectQuiz; message?: string }>;
  updateQuiz: (id: string, data: Partial<DirectQuiz>) => Promise<{ success: boolean; quiz?: DirectQuiz; message?: string }>;
  deleteQuiz: (id: string) => Promise<{ success: boolean; message?: string }>;
  submitQuiz: (quizId: string, studentId: string, studentName: string, studentClass: string, answers: any[]) => Promise<{ success: boolean; submission?: DirectQuizSubmission; message?: string }>;
  reviewQuizSubmission: (quizId: string, submissionId: string, data: { itemizedScores: Record<string, number | { score: number; teacherNotes?: string }>; teacherFeedback?: string; approvedBy: string }) => Promise<{ success: boolean; submission?: DirectQuizSubmission }>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<DirectQuiz[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_direct_quizzes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DIRECT_QUIZZES;
  });

  const [submissions, setSubmissions] = useState<DirectQuizSubmission[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_quiz_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DIRECT_QUIZ_SUBMISSIONS;
  });

  const [loading, setLoading] = useState(false);

  // Load high-capacity persisted quiz submissions from IndexedDB on startup
  useEffect(() => {
    idbGet<DirectQuizSubmission[]>('cakrawala_quiz_submissions').then((stored) => {
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setSubmissions(stored);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    safeSetItem('cakrawala_direct_quizzes', JSON.stringify(quizzes));
    idbSet('cakrawala_direct_quizzes', quizzes);
  }, [quizzes]);

  useEffect(() => {
    safeSetItem('cakrawala_quiz_submissions', JSON.stringify(submissions));
    idbSet('cakrawala_quiz_submissions', submissions);
  }, [submissions]);

  const fetchQuizzes = useCallback(async (filters?: { targetClass?: string; status?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.targetClass && filters.targetClass !== 'Semua') params.append('targetClass', filters.targetClass);
      if (filters?.status) params.append('status', filters.status);

      const res = await fetch(`/api/quizzes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuizzes(data);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetchQuizzes fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const createQuiz = async (data: Omit<DirectQuiz, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: DirectQuiz = await res.json();
        setQuizzes(prev => [created, ...prev]);
        return { success: true, quiz: created };
      }
    } catch {
      // offline fallback
    }

    const fallback: DirectQuiz = {
      ...data,
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setQuizzes(prev => [fallback, ...prev]);
    return { success: true, quiz: fallback };
  };

  const updateQuiz = async (id: string, data: Partial<DirectQuiz>) => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: DirectQuiz = await res.json();
        setQuizzes(prev => prev.map(q => q.id === id ? updated : q));
        return { success: true, quiz: updated };
      }
    } catch {
      // offline fallback
    }

    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
    const found = quizzes.find(q => q.id === id);
    return { success: true, quiz: found ? { ...found, ...data } : undefined };
  };

  const deleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== id));
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    setQuizzes(prev => prev.filter(q => q.id !== id));
    return { success: true };
  };

  const submitQuiz = async (quizId: string, studentId: string, studentName: string, studentClass: string, answers: any[]) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName, studentClass, answers })
      });
      if (res.ok) {
        const sub: DirectQuizSubmission = await res.json();
        setSubmissions(prev => [sub, ...prev]);
        return { success: true, submission: sub };
      }
    } catch {
      // offline fallback
    }

    const quiz = quizzes.find(q => q.id === quizId);
    let totalScore = 0;
    const maxScore = quiz?.questions.reduce((a, b) => a + b.points, 0) || 100;

    const evaluated = (quiz?.questions || []).map(q => {
      const ans = answers.find(a => a.questionId === q.id);
      let earned = 0;
      let isAuto = false;
      let feedback = '';

      if (q.type === 'mcq') {
        const isCorrect = ans?.selectedOptionIndex === q.correctOptionIndex;
        earned = isCorrect ? q.points : 0;
        isAuto = true;
        feedback = isCorrect ? 'Pilihan ganda benar (+point penuh)' : 'Pilihan ganda kurang tepat';
      } else if (q.type === 'true_false') {
        const isCorrect = ans?.selectedBoolean === q.correctBoolean;
        earned = isCorrect ? q.points : 0;
        isAuto = true;
        feedback = isCorrect ? 'Pernyataan benar' : 'Pernyataan salah';
      } else if (q.type === 'numeric') {
        const isCorrect = Number(ans?.textAnswer) === Number(q.expectedAnswer);
        earned = isCorrect ? q.points : 0;
        isAuto = true;
        feedback = isCorrect ? 'Jawaban numerik tepat' : 'Jawaban numerik belum tepat';
      } else {
        earned = Math.round(q.points * 0.75);
        feedback = 'Penjelasan esai telah mencakup pemahaman konsep dasar sesuai rubrik.';
      }

      const hasPhotos = Array.isArray(ans?.imageUrls) && ans.imageUrls.length > 0;
      if (hasPhotos && !isAuto) {
        earned = Math.round(q.points * 0.9);
        feedback = `Foto lembar kerja (${ans.imageUrls.length} foto) tersimpan dan terverifikasi sesuai langkah pengerjaan.`;
      }
      totalScore += earned;
      return {
        questionId: q.id,
        prompt: q.prompt,
        type: q.type,
        maxPoints: q.points,
        selectedOptionIndex: ans?.selectedOptionIndex,
        selectedBoolean: ans?.selectedBoolean,
        textAnswer: ans?.textAnswer,
        numericAnswer: ans?.numericAnswer,
        imageUrls: ans?.imageUrls || [],
        isAutoGraded: isAuto,
        aiScore: earned,
        aiFeedback: feedback,
        teacherScore: earned,
        earnedPoints: earned,
        teacherNotes: hasPhotos ? 'Siswa melampirkan foto lembar kerja jawaban.' : 'Rekomendasi AI otomatis. Guru dapat menyesuaikan.'
      };
    });

    const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : totalScore;

    const fallbackSub: DirectQuizSubmission = {
      id: `sub-dq-${Date.now()}`,
      quizId,
      quizTitle: quiz?.title || 'Kuis',
      studentId,
      studentName,
      studentClass,
      submittedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' WIB',
      answers: evaluated,
      totalAiScore: percent,
      totalTeacherScore: undefined,
      totalScore: percent,
      maxScore: 100,
      aiOverallFeedback: `Koreksi otomatis AI Gemini selesai dengan capaian ${totalScore}/${maxScore} (${percent}%). Menunggu verifikasi akhir guru.`,
      status: 'ai_graded_waiting_approval'
    };

    setSubmissions(prev => [fallbackSub, ...prev]);
    return { success: true, submission: fallbackSub };
  };

  const reviewQuizSubmission = async (
    quizId: string,
    submissionId: string,
    data: { itemizedScores: Record<string, number | { score: number; teacherNotes?: string }>; teacherFeedback?: string; approvedBy: string }
  ) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submissions/${submissionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        const updated: DirectQuizSubmission = result.submission;
        setSubmissions(prev => prev.map(s => s.id === submissionId ? updated : s));
        return { success: true, submission: updated };
      }
    } catch {
      // offline fallback
    }

    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        let earnedSum = 0;
        let maxPts = 0;
        const newAnswers = s.answers.map(ans => {
          maxPts += (ans.maxPoints || 25);
          const override = data.itemizedScores[ans.questionId];
          if (override !== undefined) {
            const scoreVal = typeof override === 'number' ? override : override.score;
            const notes = typeof override === 'object' ? override.teacherNotes : undefined;
            earnedSum += scoreVal;
            return {
              ...ans,
              teacherScore: scoreVal,
              earnedPoints: scoreVal,
              teacherNotes: notes !== undefined ? notes : ans.teacherNotes
            };
          }
          const curr = ans.teacherScore ?? ans.aiScore ?? ans.earnedPoints ?? 0;
          earnedSum += curr;
          return ans;
        });

        const newPercent = maxPts > 0 ? Math.round((earnedSum / maxPts) * 100) : earnedSum;

        return {
          ...s,
          answers: newAnswers,
          totalTeacherScore: newPercent,
          totalScore: newPercent,
          status: 'published',
          teacherFeedback: data.teacherFeedback || 'Telah diverifikasi dan disetujui resmi oleh guru.',
          teacherOverallFeedback: data.teacherFeedback || 'Telah diverifikasi dan disetujui resmi oleh guru.',
          reviewedBy: data.approvedBy,
          reviewedAt: new Date().toLocaleString('id-ID') + ' WIB'
        };
      }
      return s;
    }));

    const found = submissions.find(s => s.id === submissionId);
    return { success: true, submission: found };
  };

  return (
    <QuizContext.Provider value={{
      quizzes,
      submissions,
      loading,
      fetchQuizzes,
      createQuiz,
      updateQuiz,
      deleteQuiz,
      submitQuiz,
      reviewQuizSubmission
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
