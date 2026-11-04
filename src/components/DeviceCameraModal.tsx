import React, { useRef, useState, useEffect } from 'react';
import { useDeviceCamera } from '../utils/useDeviceCamera';
import { 
  Camera, 
  Video, 
  VideoOff, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Upload,
  Sparkles,
  Maximize2,
  ScanLine
} from 'lucide-react';

interface DeviceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onPhotoCaptured?: (dataUrl: string) => void;
}

export const DeviceCameraModal: React.FC<DeviceCameraModalProps> = ({
  isOpen,
  onClose,
  title = 'Kamera Terintegrasi Web (Kamera Depan & Belakang)',
  onPhotoCaptured
}) => {
  const camera = useDeviceCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [lastSnapped, setLastSnapped] = useState<string | null>(null);
  const [justSnappedAnimation, setJustSnappedAnimation] = useState(false);

  // Auto connect video stream to element on modal open
  useEffect(() => {
    if (isOpen) {
      camera.startCamera();
    } else {
      camera.stopCamera();
    }
  }, [isOpen]);

  // Ensure video element gets stream attached whenever stream or facingMode changes
  useEffect(() => {
    if (camera.stream && videoRef.current) {
      videoRef.current.srcObject = camera.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [camera.stream, camera.facingMode, camera.isActive]);

  if (!isOpen) return null;

  const handleCapture = () => {
    const photo = camera.capturePhoto(videoRef.current);
    if (photo) {
      setJustSnappedAnimation(true);
      setTimeout(() => setJustSnappedAnimation(false), 300);
      setCapturedPhotos(prev => [photo, ...prev]);
      setLastSnapped(photo);
      if (onPhotoCaptured) {
        onPhotoCaptured(photo);
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setCapturedPhotos(prev => [res, ...prev]);
          setLastSnapped(res);
          if (onPhotoCaptured) {
            onPhotoCaptured(res);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClose = () => {
    camera.stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {camera.isVirtual ? 'Kamera Pemindai Dokumen Aktif' : 'Kamera Perangkat Aktif'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tersambung langsung ke peramban web • Tidak perlu keluar aplikasi untuk memfoto jawaban
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-slate-950 text-white">
          <div className={`relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner transition ${
            justSnappedAnimation ? 'ring-4 ring-emerald-400 scale-[0.99]' : ''
          }`}>
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && camera.stream && el.srcObject !== camera.stream) {
                  el.srcObject = camera.stream;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Live Indicator Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{camera.isVirtual ? 'PEMINDAI DOKUMEN WEB' : (camera.isBackCamera ? 'KAMERA BELAKANG' : 'KAMERA DEPAN')}</span>
                {camera.resolution && <span>• {camera.resolution}</span>}
              </span>
            </div>

            {/* Quick Switch Button Overlay on Top Right */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={camera.toggleFacingMode}
                className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-xs border border-white/20 flex items-center gap-1.5 shadow-lg transition cursor-pointer active:scale-95"
                title="Beralih antara Kamera Depan dan Belakang"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {camera.isBackCamera ? 'Ke Kamera Depan' : 'Ke Kamera Belakang'}
                </span>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Front / Back Mode Toggle */}
              <button
                type="button"
                onClick={camera.toggleFacingMode}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>{camera.isBackCamera ? 'Kamera Depan' : 'Kamera Belakang'}</span>
              </button>

              {/* Hardware Device Dropdown if multiple */}
              {camera.devices.length > 1 && (
                <select
                  value={camera.selectedDeviceId}
                  onChange={(e) => camera.switchDevice(e.target.value)}
                  className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {camera.devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Alternative file upload right inside camera modal */}
              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Pilih Foto dari Galeri</span>
                <input type="file" accept="image/*" multiple onChange={handleManualUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2">
              {/* Snap Button */}
              <button
                type="button"
                onClick={handleCapture}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto (Jepret)</span>
              </button>

              {/* Power Toggle */}
              <button
                type="button"
                onClick={camera.isActive ? camera.stopCamera : () => camera.startCamera()}
                className="p-2.5 rounded-xl text-xs font-bold transition cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
                title={camera.isActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              >
                {camera.isActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Captured Photos Gallery */}
          {capturedPhotos.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-white">Hasil Jepretan ({capturedPhotos.length} Foto):</span>
                <button
                  onClick={() => setCapturedPhotos([])}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {capturedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video group bg-black">
                    <img src={photo} alt={`Tangkapan ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setCapturedPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-[9px] px-1.5 py-0.2 rounded text-white font-mono">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Foto tersimpan otomatis ke lembar jawaban soal yang sedang Anda kerjakan.</span>
          </div>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs"
          >
            Selesai Memfoto
          </button>
        </div>

      </div>
    </div>
  );
};
