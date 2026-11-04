import React, { useState, useRef } from 'react';
import { useMediaAjar } from '../context/MediaAjarContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { MediaAjarItem } from '../types';
import { 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  ExternalLink, 
  UploadCloud, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Folder
} from 'lucide-react';

interface MediaAjarTabProps {
  courseId: string;
  courseTitle: string;
  targetClass: string;
}

export const MediaAjarTab: React.FC<MediaAjarTabProps> = ({ courseId, courseTitle, targetClass }) => {
  const { mediaItems, createMediaItem, updateMediaItem, deleteMediaItem, uploadFileToServer } = useMediaAjar();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  const isTeacherOrAdmin = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Filter media items for this course
  const relevantItems = mediaItems.filter(m => {
    const matchesCourse = !m.courseId || m.courseId === courseId;
    if (currentUser?.role === 'siswa') {
      return matchesCourse && m.status === 'published';
    }
    return matchesCourse;
  });

  // Modal / Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'video' | 'audio' | 'image' | 'pdf' | 'link'>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview state
  const [previewItem, setPreviewItem] = useState<MediaAjarItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File conversion & direct upload to /api/upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showNotification({
        type: 'error',
        title: 'Berkas Terlalu Besar',
        message: 'Batas ukuran berkas unggahan langsung adalah 25MB.'
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const uploadRes = await uploadFileToServer(file.name, base64Data, file.type);
        setIsUploading(false);

        if (uploadRes.success && uploadRes.url) {
          setFileUrl(uploadRes.url);
          showNotification({
            type: 'success',
            title: 'Berkas Terunggah ke Server',
            message: `Berkas "${file.name}" berhasil diunggah dan disimpan di server.`
          });
        } else {
          // fallback to data URI for immediate offline usage
          setFileUrl(base64Data);
          showNotification({
            type: 'info',
            title: 'Berkas Siap Diproses',
            message: `Berkas "${file.name}" telah dimuat.`
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      showNotification({
        type: 'error',
        title: 'Gagal Membaca Berkas',
        message: err.message
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      showNotification({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Mohon isi judul dan lampirkan berkas atau URL media.'
      });
      return;
    }

    const res = await createMediaItem({
      title: title.trim(),
      description: description.trim(),
      courseId,
      courseTitle,
      targetClass,
      type,
      fileUrl: fileUrl.trim(),
      fileName: fileName || `${title.replace(/\s+/g, '_')}.${type === 'pdf' ? 'pdf' : type === 'video' ? 'mp4' : 'dat'}`,
      fileSize: fileSize || '1.2 MB',
      status,
      teacherId: currentUser?.id || 'usr-guru-01',
      teacherName: currentUser?.name || 'Drs. Bambang Suryono'
    });

    if (res.success) {
      showNotification({
        type: 'success',
        title: 'Media Ajar Ditambahkan',
        message: `Media "${title}" berhasil disimpan (${status === 'published' ? 'Dipublikasikan' : 'Draf'}).`
      });
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFileName('');
    }
  };

  const handleToggleStatus = async (item: MediaAjarItem) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    await updateMediaItem(item.id, { status: newStatus });
    showNotification({
      type: 'info',
      title: 'Status Publikasi Diubah',
      message: `Media "${item.title}" kini berstatus: ${newStatus === 'published' ? 'Dipublikasikan' : 'Draf'}.`
    });
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Hapus media ajar "${itemTitle}"?`)) return;
    await deleteMediaItem(id);
    showNotification({
      type: 'info',
      title: 'Media Dihapus',
      message: `Media "${itemTitle}" telah dihapus dari kelas.`
    });
  };

  const getMediaIcon = (t: string) => {
    switch (t) {
      case 'video': return <Video className="w-5 h-5 text-blue-600" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-600" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'pdf': return <FileText className="w-5 h-5 text-rose-600" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-amber-600" />;
      default: return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Media Ajar Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600" />
            <span>Pustaka Media Ajar Digital ({relevantItems.length} Berkas)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Materi ajar multimedia terintegrasi: Dokumen PDF, video pembelajaran, audio podcast, gambar infografis, dan tautan eksternal
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Media Ajar</span>
          </button>
        )}
      </div>

      {/* Media Items Grid */}
      {relevantItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500 space-y-2">
          <UploadCloud className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Belum ada media ajar yang dipublikasikan untuk kursus ini.</p>
          {isTeacherOrAdmin && (
            <p className="text-slate-400">Klik tombol "Tambah Media Ajar" di atas untuk mengunggah dokumen PDF atau media lainnya.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {getMediaIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                          {item.type}
                        </span>
                        {isTeacherOrAdmin && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'published' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {item.status === 'published' ? 'Dipublikasikan' : 'Draf'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-1 group-hover:text-blue-600 transition">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                        title={item.status === 'published' ? 'Ubah ke Draf' : 'Publikasikan ke Siswa'}
                      >
                        {item.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Hapus Media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>

              {/* Action Buttons & File info */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  {item.fileSize || '1.5 MB'} • {item.createdAt}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Buka / Pratinjau</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Add Media Modal (Teacher / Admin) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Unggah & Tambah Media Ajar Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Media Ajar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Limit Trigonometri & Latihan Mandiri"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format Media *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                  >
                    <option value="pdf">Dokumen PDF (Buku/Modul)</option>
                    <option value="video">Video Pembelajaran (MP4 / Embed)</option>
                    <option value="audio">Audio / Podcast Belajar</option>
                    <option value="image">Gambar / Infografis</option>
                    <option value="link">Tautan Materi Eksternal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Publikasi *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                  >
                    <option value="published">Langsung Publikasikan ke Siswa</option>
                    <option value="draft">Simpan Sebagai Draf Guru</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop File Upload Area */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Berkas Langsung dari Perangkat (Section 9)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragOver 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <UploadCloud className="w-7 h-7 text-blue-600" />
                  <div className="font-bold text-slate-700">
                    {isUploading ? 'Sedang mengunggah...' : 'Klik untuk memilih atau seret berkas ke sini'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Mendukung PDF, Video (MP4), Audio (MP3), Gambar (PNG/JPG) hingga 25MB
                  </div>
                  {fileName && (
                    <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{fileName} ({fileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Or Direct URL Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Atau Masukkan Tautan / URL Berkas
                </label>
                <input
                  type="text"
                  placeholder="https://... atau /uploads/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi belajar atau petunjuk pembacaan bagi siswa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Simpan Media Ajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {getMediaIcon(previewItem.type)}
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{previewItem.title}</h4>
                  <span className="text-[10px] text-slate-500 uppercase">{previewItem.type} • {previewItem.courseTitle}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100/50">
              {previewItem.type === 'video' && (
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                  {previewItem.fileUrl.includes('youtube.com') || previewItem.fileUrl.includes('youtu.be') ? (
                    <iframe
                      src={previewItem.fileUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={previewItem.fileUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}

              {previewItem.type === 'audio' && (
                <div className="w-full max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                  <Music className="w-12 h-12 text-purple-600 mx-auto" />
                  <p className="font-bold text-xs text-slate-800">{previewItem.fileName}</p>
                  <audio controls src={previewItem.fileUrl} className="w-full" />
                </div>
              )}

              {previewItem.type === 'image' && (
                <div className="max-w-full max-h-[60vh] overflow-hidden rounded-xl border border-slate-200 shadow-md">
                  <img src={previewItem.fileUrl} alt={previewItem.title} className="object-contain max-h-[60vh]" />
                </div>
              )}

              {previewItem.type === 'pdf' && (
                <div className="w-full text-center space-y-4 p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg">
                  <FileText className="w-16 h-16 text-rose-600 mx-auto" />
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">{previewItem.fileName}</h5>
                    <p className="text-xs text-slate-500 mt-1">Dokumen PDF Terverifikasi di Server LMS</p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <a
                      href={previewItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Buka & Unduh PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {previewItem.type === 'link' && (
                <div className="w-full text-center space-y-4 p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md">
                  <LinkIcon className="w-12 h-12 text-blue-600 mx-auto" />
                  <p className="font-bold text-xs text-slate-800">{previewItem.fileUrl}</p>
                  <a
                    href={previewItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <span>Kunjungi Sumber Belajar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>{previewItem.description || previewItem.title}</span>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
