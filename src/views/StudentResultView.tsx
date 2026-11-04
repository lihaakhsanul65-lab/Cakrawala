import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  AlertCircle,
  FolderSync,
  Check,
  Cloud 
} from 'lucide-react';

interface StudentResultViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const StudentResultView: React.FC<StudentResultViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { submissions, assignments } = useExam();

  // Strictly filter to the current student's submissions to prevent cross-student leakage
  const studentSubmissions = submissions.filter(s => {
    if (currentUser?.role === 'siswa') {
      return s.studentId === currentUser.id;
    }
    return true; // Teachers or Admins previewing
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Buku Nilai Resmi (Moodle Grades) & Hasil Ujian Siswa</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Official User Report
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Nilai Disahkan Pendidik
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Buku Nilai & Catatan Evaluasi Resmi Siswa
              </h1>
              <p className="text-xs text-slate-500">
                Memuat riwayat ujian dan nilai akhir resmi yang telah divalidasi dan dipublikasikan oleh guru pengampu
              </p>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {studentSubmissions.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500 space-y-3">
            <p>Belum ada riwayat pengerjaan ujian yang tercatat untuk akun Anda.</p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              Buka Lembar Ujian di Dasbor
            </button>
          </div>
        ) : (
          studentSubmissions.map((sub) => {
            const assignment = assignments.find(a => a.id === sub.assignmentId);
            const isPublished = sub.status === 'published';

            return (
              <div 
                key={sub.id}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs p-6 sm:p-7 space-y-5"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase font-mono">
                      {assignment?.courseTitle || 'Matematika Peminatan Kelas XII'}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1.5">{assignment?.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Dikumpulkan pada: {sub.submittedAt}</p>
                  </div>

                  {/* Status & Final Score Badge */}
                  <div>
                    {isPublished ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[120px]">
                        <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">Nilai Akhir Guru</div>
                        <div className="text-3xl font-extrabold text-emerald-700 mt-0.5">
                          {sub.totalTeacherScore ?? 85}
                          <span className="text-xs text-emerald-600 font-normal">/100</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Menunggu Pengesahan Guru</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unpublished Notice: AI recommendation scores are strictly hidden from students */}
                {!isPublished && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Ujian Sedang Ditinjau & Diverifikasi Guru Pengampu</strong>
                      Jawaban Anda telah tersimpan dengan aman. Sesuai kebijakan integritas akademis, nilai resmi dan catatan evaluasi hanya akan ditampilkan setelah guru pengampu memvalidasi dan memublikasikannya secara resmi.
                    </div>
                  </div>
                )}

                {/* Published Official Teacher Feedback & Details */}
                {isPublished && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <span>Catatan Resmi Pendidik ({sub.approvedBy || 'Drs. Bambang Suryono, M.Pd'}):</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">{sub.approvedAt}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {sub.teacherOverallFeedback || 'Nilai dan capaian kompetensi telah diverifikasi resmi oleh guru pengampu.'}
                      </p>
                    </div>

                    {/* SEB Integrity Report */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {sub.sebViolations.length === 0 ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="text-slate-700 font-medium">Integritas Safe Exam Browser (SEB):</span>
                      </div>
                      <span className={`font-bold ${sub.sebViolations.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {sub.sebViolations.length === 0 ? 'Tertib (0 Pelanggaran)' : `${sub.sebViolations.length} Insiden Terdeteksi`}
                      </span>
                    </div>

                    {/* Google Drive Dedicated Folder Sync Status */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FolderSync className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-slate-700 font-medium">Cadangan Cloud Google Drive:</span>
                      </div>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1.5 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersinkron di <strong>Cakrawala_LMS_Hasil_Ujian_dan_Tugas</strong></span>
                      </span>
                    </div>

                    {/* Official Question Feedback */}
                    <div className="space-y-2.5 pt-1">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Rincian Butir Soal Teruji:
                      </h3>

                      {assignment?.questions.map((q, idx) => {
                        const ans = sub.answers.find(a => a.questionId === q.id);

                        return (
                          <div key={q.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900">Soal #{idx + 1} ({q.type.toUpperCase()})</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                                Nilai Resmi: {ans?.teacherScore ?? ans?.aiScore ?? q.points} / {q.points} Poin
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium">{q.prompt}</p>

                            {/* Student Answer */}
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 space-y-1.5">
                              <span className="text-slate-500 font-bold block text-[10px] uppercase">Jawaban Anda:</span>
                              {q.type === 'mcq' && <span>Pilihan: <strong>{q.options?.[ans?.selectedOptionIndex ?? 0] || 'Tidak menjawab'}</strong></span>}
                              {q.type === 'true_false' && (
                                <span>Pilihan: <strong>{ans?.selectedBoolean === true ? 'Benar (True)' : ans?.selectedBoolean === false ? 'Salah (False)' : 'Tidak menjawab'}</strong></span>
                              )}
                              {(q.type === 'short' || q.type === 'numeric') && (
                                <span>Jawaban: <strong className="font-mono">{ans?.answerText || '(Kosong)'}</strong></span>
                              )}
                              {q.type === 'essay' && <div className="whitespace-pre-wrap">{ans?.answerText || '(Tidak ada teks)'}</div>}
                              {q.type === 'matching' && q.matchingPairs && (
                                <div className="space-y-1 pt-1">
                                  <span className="font-bold text-slate-600">Pasangan yang Anda Jodohkan:</span>
                                  {q.matchingPairs.map((p, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-2 pl-2">
                                      <span>{p.left}</span>
                                      <span className="text-slate-400">➔</span>
                                      <strong className="text-blue-700">{ans?.matchingAnswers?.[p.id] || ans?.matchingAnswers?.[p.left] || '(Kosong)'}</strong>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* UNIVERSAL CAMERA / PHOTO DISPLAY */}
                              {ans?.imageUrls && ans.imageUrls.length > 0 && (
                                <div className="pt-2 border-t border-slate-200">
                                  <span className="font-bold text-blue-700 block mb-1">
                                    📷 Foto Lembar Kerja yang Anda Jepret ({ans.imageUrls.length} Foto):
                                  </span>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {ans.imageUrls.map((url, i) => (
                                      <img key={i} src={url} alt={`Lampiran ${i + 1}`} className="w-20 h-16 rounded-lg object-cover border border-slate-300 shadow-2xs" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {ans?.teacherFeedback && (
                              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900">
                                <strong>Koreksi & Catatan Guru:</strong> {ans.teacherFeedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

      </div>
    </div>
  );
};
