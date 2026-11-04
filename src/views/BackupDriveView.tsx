import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHomeroom } from '../context/HomeroomContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { useNotification } from '../context/NotificationContext';
import { useExam } from '../context/ExamContext';
import { 
  HardDrive, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Archive, 
  Cloud, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  FolderSync, 
  Database, 
  Check, 
  X,
  Lock,
  Cpu,
  Search,
  Folder,
  FileCheck,
  FileText,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  CheckCheck
} from 'lucide-react';

interface BackupDriveViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BackupDriveView: React.FC<BackupDriveViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { exportGoogleDriveBackup, importGoogleDriveBackup, auditLogs } = useHomeroom();
  const { 
    isGoogleConnected, 
    googleUser, 
    isConnecting, 
    connectGoogle, 
    disconnectGoogle,
    driveBackups,
    isLoadingDrive,
    refreshDriveBackups,
    uploadToDrive,
    restoreFromDrive,
    deleteFromDrive,
    dedicatedFolder,
    folderFiles,
    isSyncingTwoWay,
    lastSyncTime,
    autoSyncEnabled,
    setAutoSyncEnabled,
    refreshFolderFiles,
    initDedicatedFolder
  } = useGoogleWorkspace();
  const { syncTwoWayWithDrive, submissions, assignments } = useExam();
  const { showNotification } = useNotification();

  const [importNotice, setImportNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [syncNotice, setSyncNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isExportingLocal, setIsExportingLocal] = useState(false);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [isExportingDual, setIsExportingDual] = useState(false);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [folderTypeFilter, setFolderTypeFilter] = useState<'all' | 'exam_submission' | 'assignment'>('all');

  // Helper to construct complete LMS snapshot payload
  const createCompleteSnapshot = () => {
    return {
      appName: 'Cakrawala LMS',
      version: '5.2.0',
      exportTimestamp: new Date().toISOString(),
      backupType: 'DUAL_STORAGE_OFFICIAL_SNAPSHOT',
      exportedBy: {
        id: currentUser?.id,
        name: currentUser?.name,
        role: currentUser?.role,
        email: currentUser?.email
      },
      data: {
        users: localStorage.getItem('cakrawala_users') ? JSON.parse(localStorage.getItem('cakrawala_users')!) : undefined,
        courses: localStorage.getItem('cakrawala_courses') ? JSON.parse(localStorage.getItem('cakrawala_courses')!) : undefined,
        assignments: localStorage.getItem('cakrawala_assignments') ? JSON.parse(localStorage.getItem('cakrawala_assignments')!) : undefined,
        submissions: localStorage.getItem('cakrawala_submissions') ? JSON.parse(localStorage.getItem('cakrawala_submissions')!) : undefined,
        reportCards: localStorage.getItem('cakrawala_report_cards') ? JSON.parse(localStorage.getItem('cakrawala_report_cards')!) : undefined,
        calendarEvents: localStorage.getItem('cakrawala_calendar_events') ? JSON.parse(localStorage.getItem('cakrawala_calendar_events')!) : undefined
      }
    };
  };

  // 1. Export only to Local Computer
  const handleExportLocal = async () => {
    setIsExportingLocal(true);
    try {
      await exportGoogleDriveBackup();
      showNotification({
        type: 'success',
        title: 'Cadangan Komputer Berhasil',
        message: 'Berkas cadangan (.json) telah diunduh ke folder Downloads komputer Anda.'
      });
    } catch {
      showNotification({
        type: 'error',
        title: 'Gagal Mengunduh',
        message: 'Terjadi kendala saat mengekspor data ke komputer.'
      });
    } finally {
      setIsExportingLocal(false);
    }
  };

  // 2. Export only to Google Drive Cloud
  const handleExportDrive = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    setIsExportingDrive(true);
    try {
      const snapshot = createCompleteSnapshot();
      const fileName = `cakrawala_lms_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const res = await uploadToDrive(fileName, snapshot, 'Pencadangan cloud basis data Cakrawala LMS');
      
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Tersimpan di Google Drive',
          message: `Berkas "${fileName}" berhasil disimpan langsung di Google Drive Anda.`
        });
        await refreshDriveBackups();
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Menyimpan ke Drive',
          message: res.error || 'Terjadi kesalahan saat mengunggah ke Google Drive.'
        });
      }
    } finally {
      setIsExportingDrive(false);
    }
  };

  // 3. Dual Storage: Save to both Local Computer AND Google Drive simultaneously
  const handleExportDualStorage = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    setIsExportingDual(true);
    try {
      const snapshot = createCompleteSnapshot();
      const fileName = `cakrawala_dual_backup_${Date.now()}.json`;

      // 1. Download to local computer
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 2. Upload to Google Drive Cloud
      const driveRes = await uploadToDrive(
        fileName, 
        snapshot, 
        'Pencadangan Dual Storage Simultan (Komputer + Google Drive)'
      );

      if (driveRes.success) {
        showNotification({
          type: 'success',
          title: 'Pencadangan Dual Storage Sukses!',
          message: `Arsip telah disimpan ganda: 1 salinan diunduh ke Komputer dan 1 salinan diunggah ke Google Drive (${googleUser?.email}).`
        });
        await refreshDriveBackups();
      } else {
        showNotification({
          type: 'warning',
          title: 'Sebagian Selesai',
          message: 'Berkas berhasil diunduh ke komputer lokal, namun unggahan Google Drive mengalami kendala.'
        });
      }
    } catch (err: any) {
      showNotification({
        type: 'error',
        title: 'Gagal Dual Storage',
        message: err.message || 'Terjadi kendala saat pencadangan ganda.'
      });
    } finally {
      setIsExportingDual(false);
    }
  };

  // Restore from Local Computer File (.json)
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const res = await importGoogleDriveBackup(parsed);
        setImportNotice(res);
        showNotification({
          type: res.success ? 'success' : 'error',
          title: res.success ? 'Pemulihan Berhasil' : 'Pemulihan Gagal',
          message: res.message
        });
      } catch {
        setImportNotice({
          success: false,
          message: 'Format berkas tidak valid. Pastikan Anda mengunggah file cadangan resmi Cakrawala LMS (.json).'
        });
      }
    };
    reader.readAsText(file);
  };

  // Restore directly from Google Drive Cloud file
  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin memulihkan database dari berkas Google Drive "${fileName}"? Data lokal saat ini akan diselaraskan dengan cadangan ini.`
    );
    if (!confirmed) return;

    setRestoringFileId(fileId);
    try {
      const res = await restoreFromDrive(fileId);
      if (res.success && res.data) {
        const importRes = await importGoogleDriveBackup(res.data);
        setImportNotice(importRes);
        showNotification({
          type: importRes.success ? 'success' : 'error',
          title: importRes.success ? 'Pemulihan dari Drive Berhasil' : 'Gagal Memulihkan',
          message: importRes.message
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Membaca Berkas Drive',
          message: res.error || 'Tidak dapat mengunduh data cadangan dari Google Drive.'
        });
      }
    } finally {
      setRestoringFileId(null);
    }
  };

  // Delete from Google Drive with explicit confirmation modal (Rule constraint)
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    const { id, name } = fileToDelete;
    const res = await deleteFromDrive(id, name);
    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Berkas Dihapus',
        message: `Berkas "${name}" berhasil dihapus dari Google Drive.`
      });
    } else {
      showNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: res.error || 'Terjadi kesalahan saat menghapus berkas dari Google Drive.'
      });
    }
    setFileToDelete(null);
  };

  const handleTriggerTwoWaySync = async () => {
    if (!isGoogleConnected) {
      const connected = await connectGoogle();
      if (!connected) return;
    }

    setSyncNotice(null);
    try {
      const result = await syncTwoWayWithDrive();
      if (result.success) {
        setSyncNotice({
          success: true,
          message: `Sinkronisasi Dua Arah Berhasil! ${result.pushedCount} berkas diunggah/diperbarui ke Google Drive, dan ${result.pulledCount} berkas baru disinkronkan ke sistem lokal.`
        });
        showNotification({
          type: 'success',
          title: 'Sinkronisasi Dua Arah Berhasil',
          message: `Folder "${dedicatedFolder?.name || 'Cakrawala_LMS_Hasil_Ujian_dan_Tugas'}" telah diselaraskan.`
        });
      } else {
        setSyncNotice({
          success: false,
          message: result.error || 'Terjadi kendala saat melakukan sinkronisasi dua arah.'
        });
        showNotification({
          type: 'error',
          title: 'Gagal Sinkronisasi Dua Arah',
          message: result.error || 'Terjadi kesalahan jaringan atau izin Google Drive.'
        });
      }
    } catch (err: any) {
      setSyncNotice({
        success: false,
        message: err.message || 'Terjadi kesalahan sistem.'
      });
    }
  };

  const filteredFolderFiles = folderFiles.filter(file => {
    const matchesSearch = folderSearchQuery.trim() === '' || 
      file.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
      (file.studentName && file.studentName.toLowerCase().includes(folderSearchQuery.toLowerCase())) ||
      (file.title && file.title.toLowerCase().includes(folderSearchQuery.toLowerCase()));

    const matchesType = folderTypeFilter === 'all' ? true : file.type === folderTypeFilter;
    return matchesSearch && matchesType;
  });

  const submissionFilesCount = folderFiles.filter(f => f.type === 'exam_submission').length;
  const assignmentFilesCount = folderFiles.filter(f => f.type === 'assignment').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Administrasi Situs / Dual Storage & Cadangan Google Drive</span>
        </div>

        {/* Header with Dual Storage Badge */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Dual Storage Architecture
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Komputer + Google Drive
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Pusat Penyimpanan Ganda & Cadangan Google Drive
              </h1>
              <p className="text-xs text-slate-500">
                Penyimpanan ganda terintegrasi: arsipkan salinan basis data secara simultan ke komputer lokal dan Google Drive institusi
              </p>
            </div>
          </div>

          {/* Google Account Connection Status Widget */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {isGoogleConnected && googleUser ? (
              <div className="flex items-center gap-2.5">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google'} className="w-8 h-8 rounded-full border border-blue-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {googleUser.email?.[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                <div className="text-left text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <span>{googleUser.displayName || 'Akun Google'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{googleUser.email}</div>
                </div>
                <button
                  onClick={disconnectGoogle}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer transition ml-1"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectGoogle()}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Google Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dual Storage Overview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FolderSync className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Mode Dual Storage Aktif</div>
              <div className="text-sm font-extrabold">Data Tersimpan Ganda: Komputer Fisik & Google Cloud Drive</div>
              <div className="text-[11px] text-blue-100 opacity-90">
                Mencegah kehilangan data saat format komputer atau laptop mati saat ujian berlangsung.
              </div>
            </div>
          </div>

          <button
            onClick={handleExportDualStorage}
            disabled={isExportingDual}
            className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition shrink-0 disabled:opacity-60"
          >
            <FolderSync className={`w-4 h-4 ${isExportingDual ? 'animate-spin' : ''}`} />
            <span>{isExportingDual ? 'Mencadangkan Ganda...' : 'Pencadangan Dual Storage Sekaligus'}</span>
          </button>
        </div>

        {/* Notice alert */}
        {importNotice && (
          <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            importNotice.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {importNotice.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="font-bold">{importNotice.message}</span>
          </div>
        )}

        {/* Two-Way Auto-Sync Notice */}
        {syncNotice && (
          <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            syncNotice.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {syncNotice.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{syncNotice.message}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dedicated Two-Way Google Drive Auto-Sync Hub */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-xs overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FolderSync className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                    Sinkronisasi Otomatis Dua Arah
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono flex items-center gap-1">
                    <Folder className="w-3 h-3 text-amber-500" />
                    Cakrawala_LMS_Hasil_Ujian_dan_Tugas
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Folder Khusus Google Drive: Hasil Ujian & Tugas Siswa
                </h2>
                <p className="text-xs text-slate-500">
                  Penyimpanan cloud otomatis dua arah (LMS &harr; Google Drive) untuk lembar jawaban, nilai review guru, dan bank tugas/soal.
                </p>
              </div>
            </div>

            {/* Quick Actions / Toggles */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
              {/* Auto Sync Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Auto-Sync</div>
                  <div className="text-[11px] font-extrabold text-slate-800">
                    {autoSyncEnabled ? 'Aktif Real-time' : 'Nonaktif'}
                  </div>
                </div>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    autoSyncEnabled ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={autoSyncEnabled ? 'Nonaktifkan auto-sync' : 'Aktifkan auto-sync'}
                >
                  {autoSyncEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>

              {/* Direct Link to Google Drive Folder */}
              {dedicatedFolder?.webViewLink && (
                <a
                  href={dedicatedFolder.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition"
                >
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>Buka di Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}

              {/* Manual Two-Way Sync Button */}
              <button
                onClick={handleTriggerTwoWaySync}
                disabled={isSyncingTwoWay}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <FolderSync className={`w-4 h-4 ${isSyncingTwoWay ? 'animate-spin' : ''}`} />
                <span>{isSyncingTwoWay ? 'Menyelaraskan...' : 'Sinkronkan Dua Arah Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Sync Stats Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-100 text-xs">
            <div className="p-4 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hasil Ujian Siswa</div>
              <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>{submissions.length}</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({submissionFilesCount} di Drive)
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCheck className="w-3 h-3" />
                <span>Format: .json terstruktur</span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bank Tugas & Ujian</div>
              <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>{assignments.length}</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({assignmentFilesCount} di Drive)
                </span>
              </div>
              <div className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Soal & Kunci Jawaban</span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terakhir Disinkronkan</div>
              <div className="text-xs font-extrabold text-slate-800 truncate mt-1">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Siap Sinkron'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString('id-ID') : 'Belum pernah'}
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Integrasi</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="font-extrabold text-slate-800 text-xs">
                  {isGoogleConnected ? 'Google Drive Aktif' : 'Perlu Login Google'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {googleUser?.email || 'Klik hubungkan untuk mulai'}
              </div>
            </div>
          </div>

          {/* Folder Explorer Table */}
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
                <button
                  onClick={() => setFolderTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    folderTypeFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({folderFiles.length})
                </button>
                <button
                  onClick={() => setFolderTypeFilter('exam_submission')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    folderTypeFilter === 'exam_submission'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hasil Ujian Siswa ({submissionFilesCount})
                </button>
                <button
                  onClick={() => setFolderTypeFilter('assignment')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    folderTypeFilter === 'assignment'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tugas & Soal ({assignmentFilesCount})
                </button>
              </div>

              {/* Search Box and Refresh */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={folderSearchQuery}
                    onChange={(e) => setFolderSearchQuery(e.target.value)}
                    placeholder="Cari siswa atau tugas..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
                  />
                </div>

                <button
                  onClick={() => refreshFolderFiles()}
                  disabled={isSyncingTwoWay}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Segarkan daftar berkas Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTwoWay ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Table or Empty State */}
            {!isGoogleConnected ? (
              <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Google Drive Belum Terhubung
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Hubungkan akun Google Drive untuk melihat dan mengelola sinkronisasi dua arah berkas hasil ujian dan tugas.
                </p>
                <button
                  onClick={() => connectGoogle()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                >
                  Hubungkan Google Drive
                </button>
              </div>
            ) : filteredFolderFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">
                  {folderFiles.length === 0
                    ? 'Folder khusus belum memiliki berkas tersinkron'
                    : 'Tidak ada berkas yang cocok dengan pencarian'}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {folderFiles.length === 0
                    ? 'Klik "Sinkronkan Dua Arah Sekarang" untuk mengunggah pengerjaan ujian dan bank tugas lokal ke Google Drive secara otomatis.'
                    : 'Coba ubah kata kunci pencarian atau tab kategori di atas.'}
                </p>
                {folderFiles.length === 0 && (
                  <button
                    onClick={handleTriggerTwoWaySync}
                    disabled={isSyncingTwoWay}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                  >
                    Sinkronkan Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {filteredFolderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        file.type === 'exam_submission' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}>
                        {file.type === 'exam_submission' ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900">{file.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            file.type === 'exam_submission'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {file.type === 'exam_submission' ? 'Hasil Ujian Siswa' : 'Tugas / Soal'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          {file.studentName && <span>Siswa: <strong>{file.studentName}</strong></span>}
                          {file.title && <span>Ujian: {file.title}</span>}
                          {file.modifiedTime && <span>Diperbarui: {new Date(file.modifiedTime).toLocaleString('id-ID')}</span>}
                          {file.size && <span>{(Number(file.size) / 1024).toFixed(1)} KB</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Tersinkron Dua Arah
                      </span>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Buka berkas di Google Drive"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Cards Grid: Dual Storage Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Local Computer Storage */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  Storage 1: Komputer
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Simpan ke Komputer Lokal (.json)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unduh berkas JSON terenkripsi ke hard drive komputer Anda untuk arsip lokal offline atau backup manual.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportLocal}
                disabled={isExportingLocal}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingLocal ? 'Mengunduh...' : 'Unduh ke Komputer'}</span>
              </button>

              <label className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer text-center border border-slate-200">
                <Upload className="w-3.5 h-3.5" />
                <span>Pulihkan dari File Komputer</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleLocalFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Card 2: Google Drive Cloud Storage */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                  Storage 2: Google Drive
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Simpan ke Google Drive Cloud</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unggah langsung snapshot seluruh basis data LMS ke Google Drive sekolah tanpa unduh-unggah manual.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportDrive}
                disabled={isExportingDrive}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isExportingDrive ? 'Mengunggah ke Drive...' : 'Unggah Langsung ke Drive'}</span>
              </button>

              <button
                onClick={() => {
                  if (!isGoogleConnected) {
                    connectGoogle();
                  } else {
                    refreshDriveBackups();
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-blue-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>{isGoogleConnected ? 'Muat Ulang Berkas Drive' : 'Masuk Google Terlebih Dahulu'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Dual Storage Simultan */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-blue-50/50 border-2 border-indigo-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                <FolderSync className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase">
                  Rekomendasi
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                  1-Click Dual Sync
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Pencadangan Dual Storage Otomatis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Satu klik untuk mengamankan data secara redundant di hard drive komputer fisik Anda dan cloud Google Drive resmi.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExportDualStorage}
                disabled={isExportingDual}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Layers className={`w-4 h-4 ${isExportingDual ? 'animate-spin' : ''}`} />
                <span>{isExportingDual ? 'Menyimpan Ganda...' : 'Eksekusi Dual Storage'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Live Google Drive Cloud Explorer */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>Daftar Cadangan di Google Drive Anda</span>
                  {isGoogleConnected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {driveBackups.length} Berkas Tersedia
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGoogleConnected 
                    ? `Terhubung ke Google Drive: ${googleUser?.email}` 
                    : 'Hubungkan akun Google Drive untuk melihat dan memulihkan cadangan cloud.'}
                </p>
              </div>
            </div>

            {isGoogleConnected && (
              <button
                onClick={refreshDriveBackups}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            )}
          </div>

          {!isGoogleConnected ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">Google Drive Belum Terhubung</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Masuk dengan akun Google untuk mengaktifkan sinkronisasi dual storage dan memulihkan data cadangan langsung dari Google Drive.
              </p>
              <button
                onClick={() => connectGoogle()}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {isConnecting ? 'Menghubungkan...' : 'Hubungkan Google Drive Sekarang'}
              </button>
            </div>
          ) : isLoadingDrive ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memindai berkas cadangan di Google Drive...</span>
            </div>
          ) : driveBackups.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Belum ada berkas cadangan Cakrawala LMS di Google Drive Anda.
              </p>
              <button
                onClick={handleExportDrive}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Buat cadangan pertama ke Google Drive sekarang &rarr;
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {driveBackups.map((file) => (
                <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{file.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Google Drive JSON
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Dibuat: {file.createdTime ? new Date(file.createdTime).toLocaleString('id-ID') : '-'}</span>
                      {file.size && <span>Ukuran: {(Number(file.size) / 1024).toFixed(1)} KB</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                        title="Buka di Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleRestoreFromDrive(file.id, file.name)}
                      disabled={restoringFileId === file.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{restoringFileId === file.id ? 'Memulihkan...' : 'Pulihkan Data Ini'}</span>
                    </button>

                    <button
                      onClick={() => setFileToDelete({ id: file.id, name: file.name })}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus dari Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal for Google Workspace Destructive Operation */}
        {fileToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Berkas dari Google Drive?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus berkas cadangan <strong className="text-slate-900 font-mono">"{fileToDelete.name}"</strong> secara permanen dari akun Google Drive Anda?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteFile}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Konfirmasi Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Audit Logs */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Audit Log Aktivitas Dual Storage & Keamanan</h3>
              <p className="text-xs text-slate-500">Pencatatan aktivitas pencadangan komputer, Google Drive, dan SEB</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                      {log.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-700 text-[11px]">{log.actorName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
