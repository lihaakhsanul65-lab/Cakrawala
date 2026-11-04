import React, { useState } from 'react';
import { 
  Layers, 
  X, 
  Server, 
  Database, 
  Monitor, 
  FileCode, 
  CheckCircle2, 
  Calendar, 
  Key, 
  GraduationCap, 
  UserCheck, 
  FileText,
  Video,
  Download,
  Sparkles,
  Bot
} from 'lucide-react';

interface WireframeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WireframeModal: React.FC<WireframeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'wireframe' | 'architecture' | 'api'>('wireframe');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Blueprint Specification
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  AI Scaffolding Engine
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Blueprint Arsitektur & Wireframe Cakrawala LMS</h3>
              <p className="text-xs text-slate-500">Format Kursus Mingguan, Sistem Enrolment, Safe Exam Browser, Forum Moodle, dan Asisten AI Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('wireframe')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'wireframe' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Wireframe Visual UI/UX Moodle</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'architecture' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Arsitektur Full-Stack & Database</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'api' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Spesifikasi API Endpoint & AI</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-600">
          {activeTab === 'wireframe' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Struktur Wireframe Halaman Kursus (Format Mingguan Moodle Klasik & Modern)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Wireframe Mock Column 1: Header & Info */}
                  <div className="border border-slate-200 p-3 rounded-xl bg-white space-y-2 shadow-xs">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">1. Silabus & Forum (Moodle Sections)</div>
                    <div className="h-14 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[10px] text-blue-800 text-center p-2 font-bold">
                      Banner Kursus, Turn Editing On, Forum Diskusi & AI Scaffolding
                    </div>
                    <div className="flex gap-1 text-[10px]">
                      <div className="flex-1 bg-blue-100 p-1.5 rounded text-center text-blue-800 font-bold">Silabus Mingguan</div>
                      <div className="flex-1 bg-slate-100 p-1.5 rounded text-center text-slate-600 font-medium">Forum & Nilai</div>
                    </div>
                  </div>

                  {/* Wireframe Mock Column 2: Web SEB & Kamera */}
                  <div className="border border-slate-200 p-3 rounded-xl bg-white space-y-2 shadow-xs">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">2. Web SEB & Kamera (Safe Exam)</div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                        <div className="font-bold text-emerald-800 flex items-center justify-between">
                          <span>Fullscreen Lock</span>
                          <span className="text-blue-700">Sensor Anti-Curang</span>
                        </div>
                        <div className="text-slate-600 mt-1 pl-2 border-l-2 border-emerald-300 space-y-0.5">
                          <div>• Deteksi Pindah Tab (Blur event)</div>
                          <div>• Live Kamera Tulisan Tangan & Berkas</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wireframe Mock Column 3: AI Review & Rapor */}
                  <div className="border border-slate-200 p-3 rounded-xl bg-white space-y-2 shadow-xs">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">3. Review AI & Rapor Wali Kelas</div>
                    <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[10px] space-y-1">
                      <div className="font-bold text-blue-900">Gerbang Otoritas Pendidik</div>
                      <div className="text-slate-600">Gemini Evaluator ➔ Verifikasi Guru ➔ Rilis Nilai Resmi.</div>
                    </div>
                    <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-[10px] space-y-1">
                      <div className="font-bold text-indigo-900">Rekap Rapor Wali Kelas</div>
                      <div className="text-slate-600">Cetak Lembar Rapor + Cadangan Google Drive (.json).</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-[11px]">
                <div className="text-blue-700 font-bold">// Arsitektur Full-Stack Berbasis Moodle & AI Scaffolding</div>
                <div>Frontend: React 19 SPA + CourseContext + Weekly Format Renderer</div>
                <div>Backend Server: Express.js mounted with Vite middleware on port 3000</div>
                <div>AI Integration: Google GenAI SDK (gemini-3.8-flash) + Pedagogical Scaffolder</div>
                <div>Data Persistence: In-Memory Database (Server) + LocalStorage (Client) Synchronized</div>
                <div className="text-emerald-700 font-bold">// Skema Relasi Kursus Moodle:</div>
                <div className="pl-4 text-slate-600">
                  Course (id, code, title, teacherId, enrollmentKey, targetClass)<br />
                  &nbsp;├── WeeklySections [weekNumber, startDate, endDate, title]<br />
                  &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── Resources [type: 'text'|'pdf'|'link'|'video', content, completedByStudentIds]<br />
                  &nbsp;└── ForumTopics [title, authorName, isPinned, replies [message, isAiGenerated]]
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-emerald-700 font-bold">GET /api/courses</span>
                <span className="text-slate-600 text-[10px]">Mengambil katalog kursus (filter by teacherId / studentId)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-blue-700 font-bold">POST /api/courses</span>
                <span className="text-slate-600 text-[10px]">Membuat kursus baru (Admin & Guru)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-indigo-700 font-bold">POST /api/ai/assistant</span>
                <span className="text-slate-600 text-[10px]">Tanya Jawab Pedagogis Asisten AI Gemini</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-blue-600 font-bold">POST /api/ai/scaffold-course</span>
                <span className="text-slate-600 text-[10px]">Generator Silabus & Modul Scaffolding Otomatis AI</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-purple-700 font-bold">POST /api/ai/generate-quiz</span>
                <span className="text-slate-600 text-[10px]">Generator Kuis & Rubrik Evaluasi AI</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
