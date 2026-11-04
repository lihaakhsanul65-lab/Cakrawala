import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { Assignment, Question, StudentAnswer, SebViolation } from '../types';
import { useDeviceCamera } from '../utils/useDeviceCamera';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Camera, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  Trash2, 
  Send,
  Flag,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Lock,
  Video,
  VideoOff,
  RefreshCw,
  Key,
  X,
  Eye,
  Minimize2,
  Cloud,
  FolderSync,
  Image as ImageIcon
} from 'lucide-react';
import { DeviceCameraModal } from '../components/DeviceCameraModal';

interface SafeExamRoomViewProps {
  assignmentId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const SafeExamRoomView: React.FC<SafeExamRoomViewProps> = ({ assignmentId, onNavigate }) => {
  const { currentUser } = useAuth();
  const { assignments, submitExam } = useExam();
  const { isGoogleConnected, dedicatedFolder, autoSyncEnabled } = useGoogleWorkspace();

  const assignment = assignments.find(a => a.id === assignmentId);

  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    (assignment?.durationMinutes || 30) * 60
  );

  const [answers, setAnswers] = useState<{ [qId: string]: Partial<StudentAnswer> }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qId: string]: boolean }>({});

  const [violations, setViolations] = useState<SebViolation[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [latestViolationText, setLatestViolationText] = useState('');

  // Device Camera Hook (Hardware connected)
  const deviceCamera = useDeviceCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);
  const proctorVideoRef = useRef<HTMLVideoElement | null>(null);

  // Live proctor camera floating monitor state
  const [isProctorMinimized, setIsProctorMinimized] = useState(false);
  const [isCapturingQuestionPhoto, setIsCapturingQuestionPhoto] = useState(false);
  const [isDedicatedCameraModalOpen, setIsDedicatedCameraModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [justSnappedNotice, setJustSnappedNotice] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // SEB Whitelist ref: bypass false blur/fullscreen violations during camera modal or file dialogs
  const isWhitelistedRef = useRef(false);

  // Lock status
  const [lockStatus, setLockStatus] = useState<{ isLocked: boolean; lockedReason?: string; submittedAt?: string; unlockedBy?: string; unlockedAt?: string } | null>(null);
  const [checkingLock, setCheckingLock] = useState(true);

  // Connect active stream to video ref whenever stream updates
  useEffect(() => {
    if (deviceCamera.stream) {
      if (videoRef.current) videoRef.current.srcObject = deviceCamera.stream;
      if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = deviceCamera.stream;
      if (proctorVideoRef.current) proctorVideoRef.current.srcObject = deviceCamera.stream;
    }
  }, [deviceCamera.stream, isCapturingQuestionPhoto, isExamStarted]);

  // Supervisor On-Site Emergency PIN Modal State
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorError, setSupervisorError] = useState<string | null>(null);
  const [isSupervisorUnlocking, setIsSupervisorUnlocking] = useState(false);
  const [isRefreshingLock, setIsRefreshingLock] = useState(false);

  const checkExamLock = async () => {
    if (!assignment || !currentUser) return;
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/lock-status?studentId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setLockStatus(data);
      }
    } catch {} finally {
      setCheckingLock(false);
      setIsRefreshingLock(false);
    }
  };

  useEffect(() => {
    if (!assignment || !currentUser) return;
    checkExamLock();
    // Live polling every 3.5 seconds so when teacher/admin unlocks from dashboard, student immediately sees unlock!
    const interval = setInterval(checkExamLock, 3500);
    return () => clearInterval(interval);
  }, [assignment, currentUser]);

  const handleSupervisorUnlock = async () => {
    if (!supervisorPin.trim() || !assignment || !currentUser) return;
    setIsSupervisorUnlocking(true);
    setSupervisorError(null);
    try {
      const res = await fetch('/api/seb/verify-supervisor-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentId: currentUser.id,
          pin: supervisorPin.trim(),
          supervisorName: supervisorName.trim() || 'Pengawas Ruangan',
          reason: 'Dispensasi re-entry langsung di ruang ujian'
        })
      });

      if (res.ok) {
        setShowSupervisorModal(false);
        setLockStatus({ isLocked: false });
        setSupervisorPin('');
        setSupervisorError(null);
      } else {
        const err = await res.json();
        setSupervisorError(err.error || 'PIN Pengawas atau Sandi Guru/Admin salah.');
      }
    } catch {
      setSupervisorError('Gagal memverifikasi PIN pengawas.');
    } finally {
      setIsSupervisorUnlocking(false);
    }
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-800">
        <p>Ujian tidak ditemukan.</p>
        <button onClick={() => onNavigate('dashboard')} className="mt-4 px-4 py-2 bg-blue-600 rounded-xl text-xs text-white font-bold cursor-pointer">
          Kembali ke Dasbor
        </button>
      </div>
    );
  }

  const currentQ = assignment.questions[currentQuestionIndex];

  const handleStartExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen bypassed:', err);
    }

    // Automatically ensure camera is connected for proctoring
    if (!deviceCamera.isActive) {
      try {
        await deviceCamera.startCamera();
      } catch (err) {
        console.warn('Proctor camera start on exam begin:', err);
      }
    }

    setIsExamStarted(true);
  };

  useEffect(() => {
    if (!isExamStarted || isCompleted) return;

    const recordViolation = (type: 'tab_switch' | 'fullscreen_exit' | 'blur_event', desc: string) => {
      // Safe Exam Browser Whitelist Check: Ignore if camera modal or file dialog is active
      if (isWhitelistedRef.current) {
        return;
      }

      const newV: SebViolation = {
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type,
        description: desc
      };
      setViolations(prev => {
        const next = [...prev, newV];
        if (next.length >= assignment.maxViolations) {
          handleAutoSubmitDueToViolations();
        }
        return next;
      });
      setLatestViolationText(desc);
      setShowViolationModal(true);
    };

    const handleVisibilityChange = () => {
      if (isWhitelistedRef.current) return;
      if (document.hidden) {
        recordViolation('tab_switch', 'Terdeteksi beralih ke tab peramban lain atau meminimalkan layar.');
      }
    };

    const handleWindowBlur = () => {
      if (isWhitelistedRef.current) return;
      recordViolation('blur_event', 'Fokus jendela ujian hilang (terdeteksi membuka aplikasi lain).');
    };

    const handleFullscreenChange = () => {
      if (isWhitelistedRef.current) return;
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        recordViolation('fullscreen_exit', 'Meninggalkan mode layar penuh (Fullscreen Exit).');
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(timer);
    };
  }, [isExamStarted, isCompleted, assignment]);

  const handleAutoSubmitDueToViolations = () => {
    alert('Batas maksimal pelanggaran (3 kali) telah tercapai. Ujian dikumpulkan secara otomatis demi integritas sistem.');
    handleFinalSubmit();
  };

  const handleOpenPhotoCapture = async () => {
    isWhitelistedRef.current = true;
    setIsCapturingQuestionPhoto(true);
    if (!deviceCamera.isActive) {
      await deviceCamera.startCamera();
    }
  };

  const handleClosePhotoCapture = () => {
    setIsCapturingQuestionPhoto(false);
    setTimeout(() => {
      isWhitelistedRef.current = false;
    }, 1200);
  };

  const handleSnapQuestionPhoto = () => {
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 220);

    const photo = deviceCamera.capturePhoto(videoRef.current);
    if (!photo) return;

    const prevList = answers[currentQ.id]?.imageUrls || [];
    const updatedList = [...prevList, photo];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        questionId: currentQ.id,
        imageUrls: updatedList
      }
    }));

    setJustSnappedNotice(`Foto ke-${updatedList.length} berhasil dijepret & tersimpan di lembar jawaban!`);
    setTimeout(() => {
      setJustSnappedNotice(null);
    }, 4000);
  };

  const handleOpenDedicatedCamera = () => {
    isWhitelistedRef.current = true;
    setIsDedicatedCameraModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    isWhitelistedRef.current = true;
    const files = e.target.files;
    if (!files || files.length === 0) {
      setTimeout(() => {
        isWhitelistedRef.current = false;
      }, 1000);
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setAnswers(prev => {
            const list = prev[currentQ.id]?.imageUrls || [];
            return {
              ...prev,
              [currentQ.id]: {
                ...prev[currentQ.id],
                questionId: currentQ.id,
                imageUrls: [...list, res]
              }
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      isWhitelistedRef.current = false;
    }, 2000);
  };

  const removeImage = (idxToRemove: number) => {
    setAnswers(prev => {
      const list = prev[currentQ.id]?.imageUrls || [];
      return {
        ...prev,
        [currentQ.id]: {
          ...prev[currentQ.id],
          imageUrls: list.filter((_, idx) => idx !== idxToRemove)
        }
      };
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    deviceCamera.stopCamera();

    const formattedAnswers: StudentAnswer[] = assignment.questions.map(q => {
      const ans = answers[q.id];
      return {
        questionId: q.id,
        selectedOptionIndex: ans?.selectedOptionIndex,
        selectedBoolean: ans?.selectedBoolean,
        matchingAnswers: ans?.matchingAnswers,
        answerText: ans?.answerText,
        imageUrls: ans?.imageUrls || []
      };
    });

    await submitExam(
      assignment.id,
      currentUser?.id || 'usr-siswa-01',
      currentUser?.name || 'Arya Pratama',
      formattedAnswers,
      violations
    );

    setIsSubmitting(false);
    setIsCompleted(true);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  // 1. LOBBY (Moodle Quiz Info Page with Hardware Camera Verification)
  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Safe Exam Browser (Moodle Quiz Locked)
              </span>
              <h1 className="text-lg font-bold text-slate-900 mt-1">{assignment.title}</h1>
              <p className="text-xs text-slate-500">{assignment.courseTitle}</p>
            </div>
          </div>

          {/* Lock Status Check */}
          {lockStatus?.isLocked ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3 text-xs text-rose-950">
              <div className="flex items-center gap-2 font-extrabold text-rose-800">
                <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Ujian Ini Telah Terkunci (Aturan 1 Kali Pengerjaan SEB)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Anda telah mengumpulkan ujian ini pada: <strong>{lockStatus.submittedAt || 'Sesi Terakhir'}</strong>.
                Sesuai regulasi integritas Safe Exam Browser, ujian hanya dapat dikerjakan tepat <strong>1 kali</strong> dan langsung dikunci otomatis secara permanen setelah pengumpulan.
              </p>
              <div className="p-3 bg-white rounded-lg border border-rose-200 text-slate-700 space-y-1">
                <div className="font-bold text-[11px] text-slate-900">Prosedur Pembukaan Kunci:</div>
                <div className="text-[11px]">
                  Hubungi Guru Pengampu ({assignment.courseTitle}) atau Administrator untuk membuka dispensasi.
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-rose-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRefreshingLock(true);
                      checkExamLock();
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLock ? 'animate-spin' : ''}`} />
                    <span>Periksa Status Kunci</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSupervisorModal(true);
                      setSupervisorError(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Buka Kunci Pengawas di Tempat</span>
                  </button>
                </div>

                {currentUser?.role !== 'siswa' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentUser) return;
                      await fetch(`/api/assignments/${assignment.id}/unlock`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          studentId: currentUser.id,
                          unlockedBy: currentUser.name,
                          reason: 'Testing pengerjaan oleh Guru/Admin'
                        })
                      });
                      setLockStatus({ isLocked: false });
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Buka Kunci Akun Ini Sekarang
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* HARDWARE CAMERA VERIFICATION CARD */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <span>Pemeriksaan Kamera Perangkat (Hardware Camera Check)</span>
                        {deviceCamera.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            Kamera Aktif & Diizinkan
                          </span>
                        ) : deviceCamera.permissionGranted ? (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Izin Diberikan
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                            Siap Dihubungkan
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-blue-800">
                        Pastikan kamera webcam atau perangkat laptop Anda tersambung dan diizinkan sebelum ujian dimulai.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {deviceCamera.isActive && (
                      <button
                        type="button"
                        onClick={deviceCamera.toggleFacingMode}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs flex items-center gap-1.5 border border-slate-300"
                        title="Beralih antara Kamera Depan dan Belakang"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>{deviceCamera.isBackCamera ? 'Beralih ke Kamera Depan' : 'Beralih ke Kamera Belakang'}</span>
                      </button>
                    )}

                    {deviceCamera.isActive ? (
                      <button
                        type="button"
                        onClick={deviceCamera.stopCamera}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs flex items-center gap-1"
                      >
                        <VideoOff className="w-3.5 h-3.5" />
                        <span>Matikan Kamera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deviceCamera.startCamera()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Uji & Sambungkan Kamera</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Device Selector Dropdown if multiple cameras exist */}
                {deviceCamera.devices.length > 1 && (
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="font-bold text-slate-700">Pilih Perangkat Kamera:</span>
                    <select
                      value={deviceCamera.selectedDeviceId}
                      onChange={(e) => deviceCamera.switchDevice(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      {deviceCamera.devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Live Preview when connected */}
                {deviceCamera.isActive && (
                  <div className="space-y-2 pt-2">
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black aspect-video max-h-56 mx-auto flex items-center justify-center">
                      <video
                        ref={lobbyVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>LIVE: {deviceCamera.activeDeviceLabel} {deviceCamera.resolution && `(${deviceCamera.resolution})`}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-bold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Kamera perangkat terverifikasi normal. Feed akan aktif memantau integritas pengerjaan ujian.</span>
                    </div>
                  </div>
                )}

                {deviceCamera.error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Kendala Kamera:</span> {deviceCamera.error}
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span>Petunjuk & Peraturan Integritas Ujian Moodle:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-slate-600">
                  <li>Mode Ujian Terkunci (Web SEB) akan mengaktifkan layar penuh.</li>
                  <li>Kamera perangkat tersambung memantau sesi ujian secara real-time.</li>
                  <li>Perpindahan tab atau pembukaan aplikasi lain akan memicu peringatan otomatis (maks. 3 kali).</li>
                  <li>Pengerjaan dibatasi <strong>tepat 1 kali</strong> dan langsung terkunci setelah dikumpulkan.</li>
                  <li>Waktu pengerjaan: <strong>{assignment.durationMinutes} Menit</strong>.</li>
                  <li>Jawaban akan dievaluasi langsung oleh AI Gemini dan diverifikasi oleh guru.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Tips Pedagogis AI Scaffold:</span>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Bacalah soal secara saksama. Untuk soal esai atau hitungan, gunakan tombol lampirkan foto kamera langsung untuk mengabadikan tulisan kertas Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                deviceCamera.stopCamera();
                onNavigate('dashboard');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Kembali
            </button>
            {lockStatus?.isLocked ? (
              <button
                onClick={() => onNavigate('student-results')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lihat Hasil & Nilai Resmi Guru</span>
              </button>
            ) : (
              <button
                onClick={handleStartExam}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Mulai Percobaan Ujian (Attempt Quiz Now)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPLETED SUMMARY
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Ujian Telah Terkumpul (Summary of Attempt)</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seluruh jawaban Anda telah tersimpan dan saat ini sedang dianalisis oleh engine koreksi otomatis AI Gemini.
          </p>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-left text-xs text-blue-950 space-y-1">
            <div className="font-bold">Status Penilaian Moodle:</div>
            <div>• Koreksi AI: <strong className="text-emerald-700">Selesai Dianalisis</strong></div>
            <div>• Gerbang Review Guru: <strong className="text-blue-700">Menunggu Verifikasi Guru</strong></div>
            <div>• Pelanggaran SEB: <strong className={violations.length > 0 ? "text-amber-700" : "text-emerald-700"}>{violations.length} Insiden</strong></div>
            <div>• Kamera Device: <strong className="text-emerald-700">Tersambung Selama Sesi</strong></div>
          </div>

          {/* Dual Storage & Dedicated Drive Folder Sync Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Penyimpanan Ganda & Google Drive:</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Tersinkron Otomatis
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Berkas jawaban dan lampiran ujian telah disinkronkan secara aman ke folder khusus Google Drive:
              <strong className="block text-indigo-700 font-mono mt-0.5">
                📁 Cakrawala_LMS_Hasil_Ujian_dan_Tugas
              </strong>
            </p>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  // 3. MOODLE QUIZ ACTIVE ATTEMPT WITH LIVE PROCTOR CAMERA
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      
      {/* SEB Violation Red Alert Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/75 backdrop-blur-xs">
          <div className="bg-white border-2 border-red-500 rounded-2xl p-6 max-w-md text-center space-y-3.5 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-red-950">Peringatan Pelanggaran Safe Exam Browser!</h3>
            <p className="text-xs text-slate-600">{latestViolationText}</p>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              Pelanggaran ke-<strong>{violations.length}</strong> dari batas maksimal 3.
            </div>
            <button
              onClick={() => {
                setShowViolationModal(false);
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Kembali ke Ujian
            </button>
          </div>
        </div>
      )}

      {/* SUPERVISOR ON-SITE EMERGENCY UNLOCK MODAL */}
      {showSupervisorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Buka Kunci Pengawas / Guru di Tempat
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otorisasi pengawas lab atau guru untuk membuka ujian terkunci
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupervisorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div>Peserta: <strong>{currentUser?.name}</strong> ({currentUser?.identifierNumber || '-'})</div>
                <div>Ujian: <strong>{assignment.title}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengawas / Guru Pengampu:</label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Nama Pengawas Ruang Ujian"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN Pengawas atau Kata Sandi Guru / Admin:
                </label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Masukkan PIN (cth: SEB-BUKA-2026 atau sandi guru/admin)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Master PIN SEB: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700 font-bold">SEB-BUKA-2026</code> atau kata sandi pendidik/admin sekolah.
                </p>
              </div>

              {supervisorError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{supervisorError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupervisorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSupervisorUnlock}
                  disabled={isSupervisorUnlocking || !supervisorPin.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSupervisorUnlocking ? 'Memverifikasi...' : 'Buka Kunci Ujian'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING LIVE PROCTOR CAMERA MONITOR */}
      <div className={`fixed bottom-4 right-4 z-40 bg-slate-900 text-white rounded-2xl border-2 border-slate-700 shadow-2xl transition-all overflow-hidden ${
        isProctorMinimized ? 'w-48 h-10' : 'w-64 sm:w-72'
      }`}>
        <div className="p-2.5 bg-slate-800/90 flex items-center justify-between text-xs font-bold border-b border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${deviceCamera.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] truncate max-w-[130px]">
              {deviceCamera.isActive ? 'Kamera Device Aktif' : 'Kamera Terputus'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsProctorMinimized(prev => !prev)}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title={isProctorMinimized ? 'Perbesar' : 'Kecilkan'}
            >
              {isProctorMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isProctorMinimized && (
          <div className="p-2 space-y-1.5">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              {deviceCamera.isActive ? (
                <video
                  ref={proctorVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-3 text-slate-400 space-y-1">
                  <VideoOff className="w-6 h-6 mx-auto text-slate-500" />
                  <div className="text-[10px]">Kamera Belum Aktif</div>
                  <button
                    onClick={() => deviceCamera.startCamera()}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                  >
                    Nyalakan
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span className="truncate max-w-[150px]">{deviceCamera.activeDeviceLabel}</span>
              {deviceCamera.resolution && <span>{deviceCamera.resolution}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900">{assignment.title}</span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Web SEB Locked
          </span>
          {deviceCamera.isActive && (
            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 hidden sm:inline-flex items-center gap-1">
              <Camera className="w-3 h-3 text-blue-600" />
              <span>Kamera Device Tersambung</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Sisa Waktu: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Selesaikan Percobaan (Finish Attempt)</span>
          </button>
        </div>
      </div>

      {/* 2-Column Moodle Quiz Attempt Canvas */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Main Question Box (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col md:flex-row">
            
            {/* Moodle Question Meta-Box (Left gray column) */}
            <div className="p-4 bg-slate-50 border-r border-slate-200 w-full md:w-48 shrink-0 space-y-2 text-xs text-slate-600 font-medium">
              <div className="font-extrabold text-slate-900 text-sm">Soal {currentQuestionIndex + 1}</div>
              <div className="text-[11px] text-slate-500">
                {answers[currentQ.id]?.selectedOptionIndex !== undefined || answers[currentQ.id]?.answerText || answers[currentQ.id]?.imageUrls?.length 
                  ? 'Sudah dijawab' 
                  : 'Belum dijawab'}
              </div>
              <div className="text-[11px] text-slate-500">Poin: {currentQ.points}.00</div>
              
              <button
                type="button"
                onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                className={`pt-2 flex items-center gap-1.5 text-[11px] cursor-pointer ${
                  flaggedQuestions[currentQ.id] ? 'text-red-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQ.id] ? 'Ditandai (Flagged)' : 'Tandai soal'}</span>
              </button>
            </div>

            {/* Moodle Question Body (Right white area) */}
            <div className="p-6 flex-1 space-y-4">
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {currentQ.prompt}
              </div>

              {/* Question Image / Diagram Stimulus (Uploaded by Teacher) */}
              {currentQ.imageUrl && (
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 max-w-xl">
                  <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gambar Stimulus / Soal Berdiagram:</span>
                  </div>
                  <img
                    src={currentQ.imageUrl}
                    alt="Gambar Soal"
                    className="max-h-72 w-full object-contain rounded-lg bg-white border border-slate-100"
                  />
                </div>
              )}

              {/* MCQ Options */}
              {currentQ.type === 'mcq' && currentQ.options && (
                <div className="space-y-2 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id]?.selectedOptionIndex === optIdx;
                    const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <label
                        key={optIdx}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                          isSelected ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-2xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQ.id}`}
                          checked={isSelected}
                          onChange={() => {
                            setAnswers(prev => ({
                              ...prev,
                              [currentQ.id]: {
                                ...prev[currentQ.id],
                                questionId: currentQ.id,
                                selectedOptionIndex: optIdx
                              }
                            }));
                          }}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span><strong className="font-bold">{letter}.</strong> {opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {currentQ.type === 'true_false' && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Pilih Jawaban Anda:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true, label: 'Benar (True)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                      { val: false, label: 'Salah (False)', color: 'border-rose-500 bg-rose-50 text-rose-900' }
                    ].map(item => {
                      const isSelected = answers[currentQ.id]?.selectedBoolean === item.val;
                      return (
                        <button
                          key={String(item.val)}
                          type="button"
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              [currentQ.id]: {
                                ...prev[currentQ.id],
                                questionId: currentQ.id,
                                selectedBoolean: item.val
                              }
                            }));
                          }}
                          className={`p-4 rounded-xl border text-center font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected ? `${item.color} ring-2 ring-blue-500 shadow-xs` : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short Answer & Numeric */}
              {(currentQ.type === 'short' || currentQ.type === 'numeric') && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {currentQ.type === 'numeric' ? 'Jawaban Angka / Hitungan:' : 'Jawaban Singkat:'}
                  </label>
                  <input
                    type={currentQ.type === 'numeric' ? 'number' : 'text'}
                    value={answers[currentQ.id]?.answerText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers(prev => ({
                        ...prev,
                        [currentQ.id]: {
                          ...prev[currentQ.id],
                          questionId: currentQ.id,
                          answerText: val
                        }
                      }));
                    }}
                    placeholder={currentQ.type === 'numeric' ? 'Ketikkan angka jawaban...' : 'Ketikkan jawaban Anda di sini...'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              )}

              {/* Matching Pairs */}
              {currentQ.type === 'matching' && currentQ.matchingPairs && (
                <div className="pt-2 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Jodohkan Setiap Premis di Kolom Kiri dengan Pasangan yang Tepat di Kolom Kanan:
                  </label>
                  <div className="space-y-2.5">
                    {currentQ.matchingPairs.map((pair, pIdx) => {
                      const currentSelection = answers[currentQ.id]?.matchingAnswers?.[pair.id] || answers[currentQ.id]?.matchingAnswers?.[pair.left] || '';
                      // All right-side choices
                      const rightChoices = currentQ.matchingPairs?.map(p => p.right) || [];

                      return (
                        <div key={pair.id || pIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] flex items-center justify-center">
                              {pIdx + 1}
                            </span>
                            <span>{pair.left}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold text-xs">➔</span>
                            <select
                              value={currentSelection}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAnswers(prev => {
                                  const prevMatches = prev[currentQ.id]?.matchingAnswers || {};
                                  return {
                                    ...prev,
                                    [currentQ.id]: {
                                      ...prev[currentQ.id],
                                      questionId: currentQ.id,
                                      matchingAnswers: {
                                        ...prevMatches,
                                        [pair.id]: val,
                                        [pair.left]: val
                                      }
                                    }
                                  };
                                });
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                              <option value="">-- Pilih Pasangan yang Sesuai --</option>
                              {rightChoices.map((rc, rIdx) => (
                                <option key={rIdx} value={rc}>
                                  {rc}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Essay */}
              {currentQ.type === 'essay' && (
                <div className="pt-2 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Teks Esai:</label>
                  <textarea
                    value={answers[currentQ.id]?.answerText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers(prev => ({
                        ...prev,
                        [currentQ.id]: {
                          ...prev[currentQ.id],
                          questionId: currentQ.id,
                          answerText: val
                        }
                      }));
                    }}
                    rows={6}
                    placeholder="Tuliskan uraian lengkap di sini..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                </div>
              )}

              {/* Multi-Photo & Direct Device Camera Attachment Area - Always Available for EVERY Question */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="p-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Lampiran Foto Lembar Jawaban / Coretan (Kamera Terintegrasi Web)</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ambil foto langsung melalui kamera website ini tanpa perlu keluar ujian.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleOpenDedicatedCamera}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Buka pemindai dokumen kamera layar penuh"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Kamera Pemindai Layar Penuh</span>
                      </button>

                      <button
                        type="button"
                        onClick={isCapturingQuestionPhoto ? handleClosePhotoCapture : handleOpenPhotoCapture}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5 ${
                          isCapturingQuestionPhoto ? 'bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isCapturingQuestionPhoto ? 'Tutup Kamera Web' : 'Buka Kamera Web (Jepret Langsung)'}</span>
                      </button>

                      <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pilih Berkas</span>
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Just Snapped Notice Badge */}
                  {justSnappedNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{justSnappedNotice}</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-normal">Otomatis Terlampir</span>
                    </div>
                  )}

                  {/* Active Device Camera Capture Viewfinder */}
                  {isCapturingQuestionPhoto && (
                    <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-black flex flex-col items-center p-3 space-y-2 animate-in fade-in">
                      
                      {/* Shutter flash effect */}
                      {isShutterFlashing && (
                        <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-out fade-out duration-200" />
                      )}

                      {/* Camera Facing Mode & Switcher Bar */}
                      <div className="w-full flex items-center justify-between text-white text-xs px-2 pb-1 flex-wrap gap-2">
                        <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{deviceCamera.isVirtual ? 'PEMINDAI DOKUMEN WEB' : (deviceCamera.isBackCamera ? 'KAMERA BELAKANG' : 'KAMERA DEPAN')}</span>
                          {deviceCamera.resolution && <span>• {deviceCamera.resolution}</span>}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={deviceCamera.toggleFacingMode}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-600 flex items-center gap-1 cursor-pointer transition"
                            title="Beralih Kamera Depan / Belakang"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-400" />
                            <span>{deviceCamera.isBackCamera ? 'Kamera Depan' : 'Kamera Belakang'}</span>
                          </button>

                          {deviceCamera.devices.length > 1 && (
                            <select
                              value={deviceCamera.selectedDeviceId}
                              onChange={(e) => deviceCamera.switchDevice(e.target.value)}
                              className="px-2 py-0.5 bg-slate-800 text-white border border-slate-600 rounded text-xs cursor-pointer"
                            >
                              {deviceCamera.devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="relative w-full max-h-72 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                        <video 
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && deviceCamera.stream && el.srcObject !== deviceCamera.stream) {
                              el.srcObject = deviceCamera.stream;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full max-h-72 object-contain rounded-lg bg-black" 
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-1 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={handleSnapQuestionPhoto}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Ambil Foto (Jepret Lembar Kerja)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClosePhotoCapture}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Selesai Memfoto ({ (answers[currentQ.id]?.imageUrls || []).length } Foto)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attached Photo Gallery */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Foto Lembar Jawaban Terlampir ({ (answers[currentQ.id]?.imageUrls || []).length } Foto):</span>
                      {(answers[currentQ.id]?.imageUrls || []).length > 0 && (
                        <span className="text-[10px] text-blue-600 font-semibold">Klik foto untuk memperbesar (zoom)</span>
                      )}
                    </div>
                    { (answers[currentQ.id]?.imageUrls || []).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(answers[currentQ.id]?.imageUrls || []).map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewPhotoUrl(url)}
                            className="relative rounded-lg overflow-hidden border border-slate-300 h-24 group bg-black shadow-2xs cursor-pointer hover:border-blue-500 transition"
                            title="Klik untuk zoom"
                          >
                            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(idx);
                                }}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow"
                                title="Hapus foto ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Belum ada foto yang dilampirkan untuk soal ini. Klik tombol kamera di atas untuk memfoto.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation within Quiz */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  Halaman Sebelumnya
                </button>

                {currentQuestionIndex < assignment.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(assignment.questions.length - 1, prev + 1))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Halaman Berikutnya
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai & Kumpulkan</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Moodle Classic Right Block Drawer: Quiz Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Navigasi Kuis (Quiz Navigation)
            </h4>

            {/* Grid of Numbered Tiles */}
            <div className="grid grid-cols-4 gap-2">
              {assignment.questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans?.selectedOptionIndex !== undefined || 
                                  (ans?.answerText && ans.answerText.trim() !== '') ||
                                  (ans?.imageUrls && ans.imageUrls.length > 0);
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer relative border ${
                      isCurrent 
                        ? 'border-blue-600 ring-2 ring-blue-400 bg-blue-50 text-blue-950 font-extrabold' 
                        : isAnswered 
                        ? 'bg-slate-200 border-slate-300 text-slate-800' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                    )}
                    {(answers[q.id]?.imageUrls || []).length > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] text-blue-600 font-bold" title="Ada lampiran foto">
                        📷
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full text-center text-xs font-bold text-blue-600 hover:underline py-1 cursor-pointer"
              >
                Selesaikan Ujian (Finish Attempt...)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Full-screen dedicated Document Camera Modal */}
      <DeviceCameraModal
        isOpen={isDedicatedCameraModalOpen}
        onClose={() => {
          setIsDedicatedCameraModalOpen(false);
          setTimeout(() => {
            isWhitelistedRef.current = false;
          }, 1200);
        }}
        title={`Kamera Pemindai Lembar Kerja — Soal #${currentQuestionIndex + 1}`}
        onPhotoCaptured={(dataUrl) => {
          setAnswers(prev => {
            const list = prev[currentQ.id]?.imageUrls || [];
            return {
              ...prev,
              [currentQ.id]: {
                ...prev[currentQ.id],
                questionId: currentQ.id,
                imageUrls: [...list, dataUrl]
              }
            };
          });
          setJustSnappedNotice('Foto lembar kerja berhasil dilampirkan!');
          setTimeout(() => setJustSnappedNotice(null), 3500);
        }}
      />

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)} 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between p-3 bg-slate-950 text-white text-xs border-b border-slate-800">
              <span className="font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Pratinjau Foto Lembar Jawaban Siswa</span>
              </span>
              <button 
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-black">
              <img src={previewPhotoUrl} alt="Pratinjau Lembar Pengerjaan" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
