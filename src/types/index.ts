export type UserRole = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  identifierNumber?: string; // NIP untuk guru/admin, NISN untuk siswa
  isWaliKelas?: boolean;     // Khusus guru yang juga wali kelas
  kelasBimbingan?: string;   // Misal "12-MIPA-1" jika wali kelas
  secondaryEmail?: string; // Email alternatif / email sekolah
  phone?: string;
  institution?: string;
  status?: 'active' | 'inactive';
  googleId?: string;
  createdAt: string;
  password?: string;         // Kredensial kata sandi otentik
  lastPasswordReset?: string;
}

export type SupportedLanguage = 'id' | 'en';

export interface CourseResource {
  id: string;
  sectionId: string;
  title: string;
  type: 'text' | 'pdf' | 'link' | 'video';
  content: string; // Description or URL or body
  fileUrl?: string;
  completedByStudentIds?: string[];
  createdAt: string;
}

export interface WeeklySection {
  id: string;
  courseId: string;
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  title: string;
  description?: string;
  resources: CourseResource[];
}

export interface CourseIntroMaterial {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  updatedAt: string;
  authorName: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  teacherId: string;
  teacherName: string;
  targetClass: string; // misal "12-MIPA" atau "Semua"
  enrollmentKey?: string; // Jika kosong = pendaftaran terbuka
  bannerImage: string;
  enrolledStudentIds: string[];
  sections: WeeklySection[];
  introMaterials?: CourseIntroMaterial[];
  createdAt: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short' | 'numeric' | 'essay' | 'matching' | 'image';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  imageUrl?: string; // Lampiran foto stimulus / diagram / soal bergambar oleh guru
  options?: string[]; // Khusus MCQ
  correctOptionIndex?: number; // Khusus MCQ
  correctBoolean?: boolean; // Khusus True/False
  matchingPairs?: MatchingPair[]; // Khusus Menjodohkan
  expectedAnswer?: string; // Kunci jawaban rujukan untuk AI
  rubricCriteria?: string; // Panduan rubrik untuk AI
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  deadline: string;
  durationMinutes: number;
  isSebLocked: boolean; // Safe Exam Browser mode
  maxViolations: number;
  status?: 'published' | 'draft';
  questions: Question[];
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  answerText?: string;
  selectedOptionIndex?: number;
  selectedBoolean?: boolean;
  matchingAnswers?: Record<string, string>;
  imageUrls?: string[];
  aiScore?: number;
  aiFeedback?: string;
  teacherScore?: number;
  teacherFeedback?: string;
}

export interface SebViolation {
  timestamp: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'blur_event';
  description: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: StudentAnswer[];
  sebViolations: SebViolation[];
  status: 'ai_graded_waiting_approval' | 'published';
  totalAiScore: number;
  totalTeacherScore?: number;
  aiOverallFeedback: string;
  teacherOverallFeedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StudentSubjectGrade {
  courseId: string;
  courseTitle: string;
  score: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  kkm: number;
  teacherName: string;
  attendancePercent: number;
  examIntegrityScore: number; // 100 - (violations * 10)
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  kelas: string;
  semester: 'Ganjil' | 'Genap';
  academicYear: string;
  waliKelasName: string;
  grades: StudentSubjectGrade[];
  averageScore: number;
  homeroomNotes: string;
  statusKenaikan?: 'Naik Kelas' | 'Lulus' | 'Dalam Pembinaan';
  updatedAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'seb_security' | 'ai_grading' | 'enrollment' | 'backup';
  details: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

// Moodle-Style Forum Discussion Types
export interface ForumPost {
  id: string;
  topicId: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface ForumTopic {
  id: string;
  courseId: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorRole: UserRole;
  createdAt: string;
  posts: ForumPost[];
  isPinned?: boolean;
}

// AI Learning Assistant & Pedagogical Scaffolding Types
export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: 'general' | 'scaffold_hint' | 'course_builder' | 'quiz_generator';
  suggestedPrompts?: string[];
}

export interface ScaffoldHintStep {
  level: 1 | 2 | 3;
  title: string;
  hint: string;
}

export interface ScaffoldCourseWeek {
  weekNumber: number;
  title: string;
  description: string;
  objectives: string[];
  resources: Array<{
    title: string;
    type: 'text' | 'pdf' | 'link' | 'video';
    content: string;
  }>;
  suggestedTask?: {
    title: string;
    type: 'quiz' | 'essay' | 'discussion';
    description: string;
  };
}

// ======================== NEW ENHANCEMENT TYPES ========================

// 1. Academic Calendar & Agenda
export type CalendarCategory = 'tugas' | 'kuis' | 'ujian' | 'pertemuan' | 'akademik';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  category: CalendarCategory;
  targetClass: string; // misal "12-MIPA-1" atau "Semua"
  courseId?: string;
  courseTitle?: string;
  creatorId: string;
  creatorName: string;
  creatorRole: UserRole;
  createdAt: string;
}

// 2. Media Ajar (Teaching Media Library)
export type MediaAjarType = 'video' | 'audio' | 'image' | 'pdf' | 'link' | 'interactive';

export interface MediaAjarItem {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  targetClass: string; // misal "12-MIPA-1" atau "Semua"
  type: MediaAjarType;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  order: number;
  status: 'draft' | 'published';
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

// 3. Direct Quiz Management & Taking
export type DirectQuestionType = 'mcq' | 'true_false' | 'short' | 'numeric' | 'essay' | 'matching' | 'image';

export interface DirectQuizQuestion {
  id: string;
  type: DirectQuestionType;
  prompt: string;
  points: number;
  options?: string[]; // Khusus MCQ
  correctOptionIndex?: number; // Khusus MCQ (0-3)
  correctBoolean?: boolean; // Khusus true_false
  matchingPairs?: MatchingPair[]; // Khusus matching
  expectedAnswer?: string; // Khusus short / numeric / essay
  rubricCriteria?: string;
}

export interface DirectQuiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  targetClass: string;
  durationMinutes: number;
  status: 'draft' | 'published';
  questions: DirectQuizQuestion[];
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export interface DirectQuizAnswer {
  questionId: string;
  prompt?: string;
  type?: DirectQuestionType;
  maxPoints?: number;
  selectedOptionIndex?: number;
  selectedBoolean?: boolean;
  matchingAnswers?: Record<string, string>;
  textAnswer?: string;
  numericAnswer?: number;
  imageUrls?: string[];
  isAutoGraded?: boolean;
  aiScore?: number;
  aiFeedback?: string;
  teacherScore?: number;
  earnedPoints?: number;
  teacherNotes?: string;
}

export interface DirectQuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  answers: DirectQuizAnswer[];
  totalAiScore?: number;
  totalTeacherScore?: number;
  totalScore: number;
  maxScore: number;
  aiOverallFeedback?: string;
  teacherFeedback?: string;
  teacherOverallFeedback?: string;
  status: 'submitted' | 'ai_graded_waiting_approval' | 'reviewed' | 'published';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  duration?: number; // in ms, default 4000
}

// 5. Digital Attendance (Presensi Digital)
export interface DigitalAttendance {
  id: string;
  courseId: string;
  sectionId: string;
  studentId: string;
  studentName: string;
  studentNis?: string;
  timestamp: string;
  date: string;
  status: 'hadir' | 'izin' | 'sakit' | 'terlambat';
  notes?: string;
  deviceInfo?: string;
}

// 6. One-Time SEB Exam Lock & Unlock Interface
export interface ExamLockStatus {
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  studentClass?: string;
  assignmentTitle?: string;
  isLocked: boolean;
  submissionId?: string;
  lockedReason: string;
  submittedAt?: string;
  unlockedBy?: string;
  unlockedAt?: string;
  violationsCount?: number;
}

// 7. Global Centralized Notification Engine
export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  targetType: 'all' | 'class' | 'user';
  targetClass?: string;
  targetUserId?: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  readBy?: string[];
  link?: string;
}

// 8. Custom JSON-based Google Payload Auth & Session
export interface GoogleAuthPayload {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  deviceId: string;
  deviceName?: string;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  deviceId: string;
  deviceName?: string;
  lastActive: string;
  ipAddress?: string;
}

