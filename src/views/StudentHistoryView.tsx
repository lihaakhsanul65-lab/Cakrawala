import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { useExam } from '../context/ExamContext';
import { useHomeroom } from '../context/HomeroomContext';
import { 
  History, 
  ArrowLeft, 
  User, 
  BookOpen, 
  CheckCircle2, 
  ShieldAlert, 
  Award, 
  Clock, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface StudentHistoryViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({ onNavigate }) => {
  const { users } = useAuth();
  const { courses } = useCourses();
  const { submissions, assignments } = useExam();
  const { reportCards } = useHomeroom();

  const students = users.filter(u => u.role === 'siswa');
  const [selectedStudentId, setSelectedStudentId] = useState(
    students.length > 0 ? students[0].id : ''
  );

  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Student specific data
  const enrolledCourses = courses.filter(c => c.enrolledStudentIds.includes(selectedStudentId));
  const studentSubmissions = submissions.filter(s => s.studentId === selectedStudentId);
  const studentReport = reportCards.find(r => r.studentId === selectedStudentId);
  const totalViolations = studentSubmissions.reduce((acc, s) => acc + s.sebViolations.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Profil Peserta Didik & Log Aktivitas Moodle</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Activity Log
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Rekam Jejak Belajar, Ujian & Integritas SEB Siswa
              </h1>
            </div>
          </div>

          {/* Student Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-bold">Pilih Siswa:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.kelasBimbingan || 'Kelas XII'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeStudent && (
          <div className="space-y-6">
            
            {/* Student Profile Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
              <div className="flex items-center gap-4">
                <img 
                  src={activeStudent.avatar} 
                  alt={activeStudent.name} 
                  className="w-16 h-16 rounded-full object-cover bg-slate-100 ring-2 ring-blue-500/30"
                />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{activeStudent.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>NISN: <strong className="text-slate-700">{activeStudent.identifierNumber || '-'}</strong></span>
                    <span>•</span>
                    <span>Kelas: <strong className="text-blue-700">{activeStudent.kelasBimbingan || '-'}</strong></span>
                    <span>•</span>
                    <span>Email: <strong className="text-slate-700">{activeStudent.email}</strong></span>
                  </p>
                </div>
              </div>

              {/* Quick Summary Pill Badges */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Kursus Diikuti</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-0.5">{enrolledCourses.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Ujian Dikerjakan</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{studentSubmissions.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Pelanggaran SEB</div>
                  <div className={`text-xl font-extrabold mt-0.5 ${totalViolations > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {totalViolations}
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolled Courses & History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Courses Enrolled */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Mata Pelajaran yang Diikuti</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">{enrolledCourses.length} Kelas</span>
                </div>

                <div className="space-y-3">
                  {enrolledCourses.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{c.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{c.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Pengampu: {c.teacherName}</span>
                        <span className="text-blue-700 font-bold">{c.sections.length} Minggu Materi</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submissions & Exam Records */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Riwayat Hasil Ujian & Koreksi AI</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">{studentSubmissions.length} Ujian</span>
                </div>

                <div className="space-y-3">
                  {studentSubmissions.map((sub) => {
                    const asg = assignments.find(a => a.id === sub.assignmentId);

                    return (
                      <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                            {asg?.title || 'Ujian Blok 1'}
                          </span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Nilai: {sub.totalTeacherScore ?? sub.totalAiScore}/100
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Waktu: {sub.submittedAt}</span>
                          <span className={sub.sebViolations.length > 0 ? "text-amber-600 font-bold" : "text-emerald-600"}>
                            {sub.sebViolations.length} Pelanggaran SEB
                          </span>
                        </div>
                        {sub.teacherOverallFeedback && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                            Catatan Guru: "{sub.teacherOverallFeedback}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
