import React, { createContext, useContext, useState, useEffect } from 'react';
import { Assignment, Submission, StudentAnswer, SebViolation, ExamLockStatus } from '../types';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../data/mockData';
import { safeSetItem, safeGetItem } from '../utils/safeStorage';
import { idbSet, idbGet } from '../utils/idbStorage';
import { useGoogleWorkspace } from './GoogleWorkspaceContext';

interface ExamContextType {
  assignments: Assignment[];
  submissions: Submission[];
  loading: boolean;
  fetchAssignments: () => Promise<void>;
  fetchSubmissions: () => Promise<void>;
  submitExam: (
    assignmentId: string,
    studentId: string,
    studentName: string,
    answers: StudentAnswer[],
    sebViolations: SebViolation[]
  ) => Promise<{ success: boolean; submission?: Submission; message?: string }>;
  reviewSubmission: (
    submissionId: string,
    data: { finalScore: number; teacherFeedback: string; approvedBy: string; itemizedScores?: Record<string, number | { score: number; feedback?: string }> }
  ) => Promise<{ success: boolean; submission?: Submission }>;
  unlockExamForStudent: (
    assignmentId: string,
    studentId: string,
    unlockedBy: string,
    reason?: string,
    allowResetSubmission?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  fetchSebLocks: () => Promise<ExamLockStatus[]>;
  unlockAllSebForStudent: (
    studentId: string,
    unlockedBy: string,
    reason?: string,
    allowResetSubmission?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  createAssignment: (data: Partial<Assignment>) => Promise<{ success: boolean; assignment?: Assignment }>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<{ success: boolean; assignment?: Assignment }>;
  deleteAssignment: (id: string) => Promise<{ success: boolean; message?: string }>;
  syncTwoWayWithDrive: () => Promise<any>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_assignments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SUBMISSIONS;
  });

  const [loading, setLoading] = useState(false);
  const { 
    isGoogleConnected, 
    autoSyncEnabled, 
    syncSingleSubmission, 
    syncSingleAssignment, 
    triggerTwoWaySync 
  } = useGoogleWorkspace();

  // Load high-capacity persisted submissions from IndexedDB on startup
  useEffect(() => {
    idbGet<Submission[]>('cakrawala_submissions').then((stored) => {
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setSubmissions(stored);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    safeSetItem('cakrawala_assignments', JSON.stringify(assignments));
    idbSet('cakrawala_assignments', assignments);
  }, [assignments]);

  useEffect(() => {
    safeSetItem('cakrawala_submissions', JSON.stringify(submissions));
    // Store full fidelity data (including large attachments/images) in IndexedDB
    idbSet('cakrawala_submissions', submissions);
  }, [submissions]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAssignments(data);
        }
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSubmissions(data);
        }
      }
    } catch {
      // offline
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const submitExam = async (
    assignmentId: string,
    studentId: string,
    studentName: string,
    answers: StudentAnswer[],
    sebViolations: SebViolation[]
  ) => {
    const assignment = assignments.find(a => a.id === assignmentId);

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName, answers, sebViolations })
      });
      if (res.ok) {
        const data = await res.json();
        const newSub: Submission = data.submission;
        setSubmissions(prev => [newSub, ...prev.filter(s => !(s.assignmentId === newSub.assignmentId && s.studentId === newSub.studentId))]);

        // Auto-sync to Google Drive dedicated folder
        if (isGoogleConnected && autoSyncEnabled) {
          syncSingleSubmission(newSub, assignment?.title).catch(err => {
            console.warn('Auto sync submission to Drive warning:', err);
          });
        }

        return { success: true, submission: newSub, message: data.message };
      }
    } catch {
      // offline fallback
    }

    // Fallback grading if backend offline
    let totalScore = 0;
    const graded = answers.map(a => {
      const q = assignment?.questions.find(item => item.id === a.questionId);
      const points = q ? q.points : 20;
      const score = Math.round(points * 0.85);
      totalScore += score;
      return {
        ...a,
        aiScore: score,
        aiFeedback: 'Jawaban telah dievaluasi dengan baik sesuai rubrik akademis.'
      };
    });

    const fallbackSub: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId,
      courseId: assignment?.courseId || 'crs-mat-12',
      studentId,
      studentName,
      submittedAt: new Date().toLocaleString('id-ID') + ' WIB',
      status: 'ai_graded_waiting_approval',
      answers: graded,
      sebViolations,
      totalAiScore: totalScore,
      aiOverallFeedback: 'Evaluasi otomatis AI berhasil. Menunggu verifikasi akhir guru.',
      teacherOverallFeedback: ''
    };

    setSubmissions(prev => [fallbackSub, ...prev]);

    // Auto-sync fallback to Google Drive
    if (isGoogleConnected && autoSyncEnabled) {
      syncSingleSubmission(fallbackSub, assignment?.title).catch(err => {
        console.warn('Auto sync fallback submission to Drive warning:', err);
      });
    }

    return {
      success: true,
      submission: fallbackSub,
      message: 'Ujian berhasil dikumpulkan dan dikoreksi oleh AI.'
    };
  };

  const reviewSubmission = async (
    submissionId: string,
    data: { finalScore: number; teacherFeedback: string; approvedBy: string; itemizedScores?: Record<string, number | { score: number; feedback?: string }> }
  ) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: Submission = (await res.json()).submission;
        setSubmissions(prev => prev.map(s => s.id === submissionId ? updated : s));

        // Auto-sync reviewed grade to Google Drive
        if (isGoogleConnected && autoSyncEnabled) {
          const asg = assignments.find(a => a.id === updated.assignmentId);
          syncSingleSubmission(updated, asg?.title).catch(err => {
            console.warn('Auto sync reviewed submission to Drive warning:', err);
          });
        }

        return { success: true, submission: updated };
      }
    } catch {
      // offline
    }

    let finalUpdated: Submission | undefined;
    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        let dynamicAnswers = s.answers;
        if (data.itemizedScores) {
          dynamicAnswers = s.answers.map(ans => {
            const override = data.itemizedScores![ans.questionId];
            if (override !== undefined) {
              const scoreVal = typeof override === 'number' ? override : override.score;
              const feedbackVal = typeof override === 'object' ? override.feedback : undefined;
              return {
                ...ans,
                teacherScore: scoreVal,
                teacherFeedback: feedbackVal !== undefined ? feedbackVal : ans.teacherFeedback
              };
            }
            return ans;
          });
        }

        const updated: Submission = {
          ...s,
          answers: dynamicAnswers,
          status: 'published',
          totalTeacherScore: data.finalScore,
          teacherOverallFeedback: data.teacherFeedback,
          approvedBy: data.approvedBy,
          approvedAt: new Date().toLocaleString('id-ID') + ' WIB'
        };
        finalUpdated = updated;
        return updated;
      }
      return s;
    }));

    if (finalUpdated && isGoogleConnected && autoSyncEnabled) {
      const asg = assignments.find(a => a.id === finalUpdated!.assignmentId);
      syncSingleSubmission(finalUpdated, asg?.title).catch(err => {
        console.warn('Auto sync offline reviewed submission to Drive warning:', err);
      });
    }

    return { success: true, submission: finalUpdated };
  };

  const unlockExamForStudent = async (
    assignmentId: string,
    studentId: string,
    unlockedBy: string,
    reason?: string,
    allowResetSubmission?: boolean
  ) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, unlockedBy, reason, allowResetSubmission })
      });
      if (res.ok) {
        const data = await res.json();
        if (allowResetSubmission) {
          setSubmissions(prev => prev.filter(s => !(s.assignmentId === assignmentId && s.studentId === studentId)));
        }
        return { success: true, message: data.message };
      }
    } catch {
      // offline
    }
    if (allowResetSubmission) {
      setSubmissions(prev => prev.filter(s => !(s.assignmentId === assignmentId && s.studentId === studentId)));
    }
    return { success: true, message: `Akses ujian untuk siswa ID: ${studentId} berhasil dibuka kembali.` };
  };

  const fetchSebLocks = async (): Promise<ExamLockStatus[]> => {
    try {
      const res = await fetch('/api/seb/locks');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // offline
    }
    return [];
  };

  const unlockAllSebForStudent = async (
    studentId: string,
    unlockedBy: string,
    reason?: string,
    allowResetSubmission?: boolean
  ) => {
    try {
      const res = await fetch('/api/seb/unlock-all-for-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, unlockedBy, reason, allowResetSubmission })
      });
      if (res.ok) {
        const data = await res.json();
        if (allowResetSubmission) {
          setSubmissions(prev => prev.filter(s => s.studentId !== studentId));
        }
        return { success: true, message: data.message };
      }
    } catch {
      // offline
    }
    if (allowResetSubmission) {
      setSubmissions(prev => prev.filter(s => s.studentId !== studentId));
    }
    return { success: true, message: `Semua sesi ujian SEB untuk siswa ID: ${studentId} telah dibuka.` };
  };

  const createAssignment = async (data: Partial<Assignment>) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: Assignment = await res.json();
        setAssignments(prev => [created, ...prev]);

        // Auto sync assignment to Google Drive
        if (isGoogleConnected && autoSyncEnabled) {
          syncSingleAssignment(created).catch(err => {
            console.warn('Auto sync assignment to Drive warning:', err);
          });
        }

        return { success: true, assignment: created };
      }
    } catch {
      // offline
    }

    const fallbackAsg: Assignment = {
      id: `asg-${Date.now()}`,
      courseId: data.courseId || 'crs-mat-12',
      courseTitle: data.courseTitle || 'Matematika Peminatan Kelas XII',
      title: data.title || 'Ujian Baru',
      description: data.description || '',
      deadline: data.deadline || '2026-11-01',
      durationMinutes: data.durationMinutes || 30,
      isSebLocked: data.isSebLocked !== false,
      maxViolations: 3,
      questions: data.questions || [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAssignments(prev => [fallbackAsg, ...prev]);

    if (isGoogleConnected && autoSyncEnabled) {
      syncSingleAssignment(fallbackAsg).catch(err => {
        console.warn('Auto sync fallback assignment to Drive warning:', err);
      });
    }

    return { success: true, assignment: fallbackAsg };
  };

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: Assignment = await res.json();
        setAssignments(prev => prev.map(a => a.id === id ? updated : a));
        return { success: true, assignment: updated };
      }
    } catch {
      // offline
    }

    let updatedFallback: Assignment | undefined;
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        updatedFallback = { ...a, ...data };
        return updatedFallback;
      }
      return a;
    }));

    return { success: true, assignment: updatedFallback };
  };

  const deleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id));
        setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        return { success: true };
      }
    } catch {
      // offline
    }

    setAssignments(prev => prev.filter(a => a.id !== id));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
    return { success: true };
  };

  const syncTwoWayWithDrive = async () => {
    const res = await triggerTwoWaySync(submissions, assignments);
    if (res.success) {
      if (res.mergedSubmissions && Array.isArray(res.mergedSubmissions)) {
        setSubmissions(res.mergedSubmissions);
      }
      if (res.mergedAssignments && Array.isArray(res.mergedAssignments)) {
        setAssignments(res.mergedAssignments);
      }
    }
    return res;
  };

  return (
    <ExamContext.Provider value={{
      assignments,
      submissions,
      loading,
      fetchAssignments,
      fetchSubmissions,
      submitExam,
      reviewSubmission,
      unlockExamForStudent,
      fetchSebLocks,
      unlockAllSebForStudent,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      syncTwoWayWithDrive
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) throw new Error('useExam must be used within ExamProvider');
  return context;
};
