import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHomeroom } from '../context/HomeroomContext';
import { ReportCard, StudentSubjectGrade } from '../types';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Award, 
  UserCheck, 
  Printer, 
  Download, 
  CheckCircle2, 
  Edit3, 
  ShieldCheck, 
  Sparkles,
  X,
  FileText
} from 'lucide-react';

interface WaliKelasRaporViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const WaliKelasRaporView: React.FC<WaliKelasRaporViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { reportCards, updateReportCard } = useHomeroom();

  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [editingReport, setEditingReport] = useState<ReportCard | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState<'Naik Kelas' | 'Lulus' | 'Dalam Pembinaan'>('Naik Kelas');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activeClass = currentUser?.kelasBimbingan || '12-MIPA-1';
  const filteredReports = reportCards.filter(r => r.kelas === activeClass || true);

  const classAverage = (
    filteredReports.reduce((acc, r) => acc + r.averageScore, 0) / (filteredReports.length || 1)
  ).toFixed(1);

  const handleOpenEdit = (rc: ReportCard) => {
    setEditingReport(rc);
    setNotesInput(rc.homeroomNotes);
    setStatusInput(rc.statusKenaikan || 'Naik Kelas');
    setSaveMessage(null);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    setIsSaving(true);

    await updateReportCard(editingReport.id, notesInput, statusInput);

    setIsSaving(false);
    setSaveMessage('Catatan rapor dan status berhasil diperbarui!');
    setTimeout(() => {
      setEditingReport(null);
      setSaveMessage(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Moodle Classic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Rekapitulasi Buku Nilai & Rapor Wali Kelas</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Gradebook Ledger
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Semester Ganjil 2026/2027
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Rekapitulasi Nilai Rapor Kelas {activeClass}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Cetak Rekap Kelas</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase">Kelas Bimbingan</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeClass}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Wali: {currentUser?.name || 'Drs. Bambang Suryono'}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase">Total Siswa Bimbingan</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{filteredReports.length} Siswa</div>
            <p className="text-[11px] text-slate-500 mt-0.5">100% Mengikuti Pembelajaran</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase">Rata-Rata Nilai Kelas</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{classAverage} / 100</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Di atas KKM Institusi (75)</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase">Kepatuhan Integritas SEB</span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">98.2%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Tervalidasi Sensor Ujian SEB</p>
          </div>
        </div>

        {/* Report Cards Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Lembar Rekapitulasi Rapor Siswa</h3>
              <p className="text-xs text-slate-500">Daftar perolehan nilai gabungan mata pelajaran dan catatan resmi</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Siswa & NISN</th>
                  <th className="p-4">Matematika</th>
                  <th className="p-4">B. Indonesia</th>
                  <th className="p-4">Fisika</th>
                  <th className="p-4">Kimia</th>
                  <th className="p-4 text-center">Rata-Rata</th>
                  <th className="p-4">Status & Catatan Wali</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((rc) => {
                  const matGrade = rc.grades.find(g => g.courseTitle.includes('Matematika'));
                  const binGrade = rc.grades.find(g => g.courseTitle.includes('Bahasa'));
                  const fisGrade = rc.grades.find(g => g.courseTitle.includes('Fisika'));
                  const kimGrade = rc.grades.find(g => g.courseTitle.includes('Kimia'));

                  return (
                    <tr key={rc.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-xs">{rc.studentName}</div>
                        <div className="text-[10px] text-slate-400">NISN: {rc.nisn}</div>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-900">{matGrade?.score ?? '-'}</span>
                        <span className="text-[10px] text-blue-600 ml-1.5 font-bold">({matGrade?.letterGrade})</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-900">{binGrade?.score ?? '-'}</span>
                        <span className="text-[10px] text-blue-600 ml-1.5 font-bold">({binGrade?.letterGrade})</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-900">{fisGrade?.score ?? '-'}</span>
                        <span className="text-[10px] text-blue-600 ml-1.5 font-bold">({fisGrade?.letterGrade})</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-900">{kimGrade?.score ?? '-'}</span>
                        <span className="text-[10px] text-blue-600 ml-1.5 font-bold">({kimGrade?.letterGrade})</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                          {rc.averageScore}
                        </span>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="text-[10px] text-emerald-700 font-bold mb-0.5">
                          {rc.statusKenaikan || 'Naik Kelas'}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          "{rc.homeroomNotes || 'Belum ada catatan'}"
                        </p>
                      </td>

                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(rc)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition cursor-pointer"
                        >
                          Catatan
                        </button>
                        <button
                          onClick={() => setSelectedReport(rc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          Lembar Rapor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: EDIT HOMEROOM NOTES */}
        {editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Catatan Wali Kelas: {editingReport.studentName}</h3>
                <button onClick={() => setEditingReport(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {saveMessage}
                </div>
              )}

              <form onSubmit={handleSaveNotes} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kenaikan / Kelulusan:</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Naik Kelas">Naik Kelas (Memenuhi Syarat)</option>
                    <option value="Lulus">Lulus (Purna Belajar)</option>
                    <option value="Dalam Pembinaan">Dalam Pembinaan Khusus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan & Saran Perkembangan Akademik Siswa:</label>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan evaluasi perkembangan sikap, kedisiplinan, dan capaian akademik siswa..."
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingReport(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Catatan Rapor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PRINT / PREVIEW OFFICIAL REPORT CARD */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
              
              {/* Header Rapor Sekolah */}
              <div className="text-center border-b border-slate-200 pb-4 relative">
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Kementerian Pendidikan Dasar dan Menengah</div>
                <h2 className="text-lg font-extrabold text-slate-900 uppercase mt-0.5">Laporan Hasil Capaian Belajar Peserta Didik (Rapor)</h2>
                <div className="text-xs text-slate-500">SMA Cakrawala Nusantara • Tahun Ajaran {selectedReport.academicYear}</div>
              </div>

              {/* Student Bio Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>Nama Siswa: <strong className="text-slate-900">{selectedReport.studentName}</strong></div>
                <div>Kelas: <strong className="text-slate-900">{selectedReport.kelas}</strong></div>
                <div>NISN: <strong className="text-slate-900">{selectedReport.nisn}</strong></div>
                <div>Wali Kelas: <strong className="text-slate-900">{selectedReport.waliKelasName}</strong></div>
              </div>

              {/* Grades Table */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Mata Pelajaran</th>
                    <th className="p-3 border-b border-slate-200 text-center">KKM</th>
                    <th className="p-3 border-b border-slate-200 text-center">Nilai Akhir</th>
                    <th className="p-3 border-b border-slate-200 text-center">Predikat</th>
                    <th className="p-3 border-b border-slate-200 text-center">Integritas SEB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReport.grades.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-900 font-bold">{g.courseTitle}</td>
                      <td className="p-3 text-center text-slate-500">{g.kkm}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{g.score}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{g.letterGrade}</td>
                      <td className="p-3 text-center text-slate-600 font-medium">{g.examIntegrityScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Homeroom Notes & Status */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
                <div className="font-bold text-blue-900">Catatan Wali Kelas:</div>
                <p className="text-slate-700 leading-relaxed italic">
                  "{selectedReport.homeroomNotes}"
                </p>
                <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs">
                  <span>Keputusan Kenaikan: <strong className="text-emerald-700">{selectedReport.statusKenaikan || 'Naik Kelas'}</strong></span>
                  <span>Rata-rata: <strong className="text-slate-900">{selectedReport.averageScore}</strong></span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Rapor</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
