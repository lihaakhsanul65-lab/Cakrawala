import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMediaAjar } from '../context/MediaAjarContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { MediaAjarItem, MediaAjarType } from '../types';
import { 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  ExternalLink, 
  Plus, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Play,
  Pause,
  Maximize2,
  FolderOpen
} from 'lucide-react';

interface MediaAjarViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MediaAjarView: React.FC<MediaAjarViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { mediaItems, createMediaItem, updateMediaItem, deleteMediaItem, uploadFileToServer } = useMediaAjar();
  const { showNotification } = useNotification();
  const { t, language } = useLanguage();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Preview State
  const [previewItem, setPreviewItem] = useState<MediaAjarItem | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaAjarItem | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemType, setItemType] = useState<MediaAjarType>('video');
  const [itemUrl, setItemUrl] = useState('');
  const [itemFileName, setItemFileName] = useState('');
  const [itemFileSize, setItemFileSize] = useState('');
  const [itemTargetClass, setItemTargetClass] = useState('12-MIPA-1');
  const [itemStatus, setItemStatus] = useState<'draft' | 'published'>('published');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacherOrAdmin = currentUser?.role === 'guru' || currentUser?.role === 'admin';

  // Filter items
  const displayItems = mediaItems.filter(item => {
    // Student can only see published items for their class
    if (currentUser?.role === 'siswa') {
      if (item.status !== 'published') return false;
      const studentClass = currentUser.kelasBimbingan || '12-MIPA-1';
      if (item.targetClass !== 'Semua' && item.targetClass !== studentClass) return false;
    }

    const matchType = filterType === 'all' || item.type === filterType;
    const matchClass = filterClass === 'Semua' || item.targetClass === 'Semua' || item.targetClass === filterClass;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchClass && matchSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await uploadFileToServer(file.name, base64Data, file.type);
        setIsUploading(false);

        if (res.success && res.url) {
          setItemUrl(res.url);
          setItemFileName(file.name);
          setItemFileSize(res.fileSize || `${(file.size / 1024).toFixed(1)} KB`);
          showNotification({
            type: 'success',
            title: 'Berkas Berhasil Diunggah',
            message: `Berkas "${file.name}" tersimpan di server Cakrawala LMS.`
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Unggah Gagal',
            message: res.message || 'Gagal menyimpan berkas.'
          });
        }
      } catch {
        setIsUploading(false);
        showNotification({
          type: 'error',
          title: 'Kesalahan Sistem',
          message: 'Terjadi kesalahan saat memproses berkas.'
        });
      }
    };

    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemDesc('');
    setItemType('video');
    setItemUrl('');
    setItemFileName('');
    setItemFileSize('');
    setItemTargetClass(currentUser?.kelasBimbingan || '12-MIPA-1');
    setItemStatus('published');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MediaAjarItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemDesc(item.description);
    setItemType(item.type);
    setItemUrl(item.fileUrl);
    setItemFileName(item.fileName || '');
    setItemFileSize(item.fileSize || '');
    setItemTargetClass(item.targetClass);
    setItemStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemUrl.trim()) {
      showNotification({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Mohon isi judul dan tautan / berkas media ajar.'
      });
      return;
    }

    setIsSubmitting(true);
    if (editingItem) {
      const res = await updateMediaItem(editingItem.id, {
        title: itemTitle.trim(),
        description: itemDesc.trim(),
        type: itemType,
        fileUrl: itemUrl.trim(),
        fileName: itemFileName || undefined,
        fileSize: itemFileSize || undefined,
        targetClass: itemTargetClass,
        status: itemStatus
      });
      setIsSubmitting(false);
      setIsModalOpen(false);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Media Ajar Diperbarui',
          message: `Media "${itemTitle}" berhasil diperbarui.`
        });
      }
    } else {
      const res = await createMediaItem({
        title: itemTitle.trim(),
        description: itemDesc.trim(),
        courseId: 'crs-mat-12',
        courseTitle: 'Matematika Peminatan Kelas XII',
        targetClass: itemTargetClass,
        type: itemType,
        fileUrl: itemUrl.trim(),
        fileName: itemFileName || undefined,
        fileSize: itemFileSize || undefined,
        status: itemStatus,
        teacherId: currentUser?.id || 'usr-guru-01',
        teacherName: currentUser?.name || 'Drs. Bambang Suryono, M.Pd'
      });
      setIsSubmitting(false);
      setIsModalOpen(false);
      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Media Ajar Ditambahkan',
          message: `Media baru "${itemTitle}" berhasil dipublikasikan untuk kelas ${itemTargetClass}.`
        });
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus media ajar "${title}"?`)) return;
    const res = await deleteMediaItem(id);
    if (res.success) {
      showNotification({
        type: 'info',
        title: 'Media Dihapus',
        message: `Media "${title}" telah dihapus.`
      });
      if (previewItem?.id === id) setPreviewItem(null);
    }
  };

  const getTypeIcon = (type: MediaAjarType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-rose-600" />;
      case 'audio': return <Music className="w-4 h-4 text-purple-600" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'link':
      default: return <ExternalLink className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition cursor-pointer">
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Media Ajar Digital & Sumber Belajar</span>
        </div>

        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Moodle Course Media Repository
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Video • Audio • PDF • Gambar
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Perpustakaan Media Ajar & Dokumen Pembelajaran
              </h1>
            </div>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah / Tambah Media Ajar</span>
            </button>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600">Tipe Format:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'video', label: 'Video MP4' },
              { id: 'audio', label: 'Audio MP3' },
              { id: 'pdf', label: 'Dokumen PDF' },
              { id: 'image', label: 'Gambar' },
              { id: 'link', label: 'Tautan' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition ${
                  filterType === t.id 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="Semua">Semua Rombel</option>
              <option value="12-MIPA-1">12-MIPA-1</option>
              <option value="12-MIPA-2">12-MIPA-2</option>
              <option value="12-IPS-1">12-IPS-1</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi / judul..."
              className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Media Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p>Tidak ada media ajar yang cocok dengan filter ini.</p>
              {isTeacherOrAdmin && (
                <button
                  onClick={openAddModal}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  + Tambah media ajar sekarang
                </button>
              )}
            </div>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Media Preview Thumbnail / Player Box */}
                <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  {item.type === 'video' && (
                    <video
                      src={item.fileUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.type === 'audio' && (
                    <div className="p-4 w-full text-center space-y-2 bg-gradient-to-br from-purple-900 to-indigo-900">
                      <Music className="w-10 h-10 mx-auto text-purple-300" />
                      <audio src={item.fileUrl} controls className="w-full mt-2 h-8" />
                    </div>
                  )}
                  {item.type === 'image' && (
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setPreviewItem(item)}
                    />
                  )}
                  {item.type === 'pdf' && (
                    <div className="p-4 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-slate-900 text-white space-y-2">
                      <FileText className="w-10 h-10 text-red-400" />
                      <span className="text-xs font-bold text-red-200">Dokumen PDF Resmi</span>
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Buka / Unduh PDF</span>
                      </a>
                    </div>
                  )}
                  {item.type === 'link' && (
                    <div className="p-4 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-slate-900 text-white space-y-2">
                      <ExternalLink className="w-10 h-10 text-blue-400" />
                      <span className="text-xs font-bold text-blue-200">Tautan Pembelajaran Eksternal</span>
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Kunjungi Situs</span>
                      </a>
                    </div>
                  )}

                  {/* Format pill badge at top left */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                    {getTypeIcon(item.type)}
                    <span className="uppercase">{item.type}</span>
                  </div>

                  {/* Status badge at top right for teachers */}
                  {isTeacherOrAdmin && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {item.status === 'published' ? 'Dipublikasikan' : 'Draf'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Kelas: <strong className="text-slate-700">{item.targetClass}</strong></span>
                    {item.fileSize && <span>Ukuran: {item.fileSize}</span>}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Oleh: {item.teacherName.split(',')[0]}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewItem(item)}
                      title="Pratinjau Layar Penuh"
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 cursor-pointer shadow-2xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {isTeacherOrAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Media"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Hapus Media"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* Fullscreen Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(previewItem.type)}
                <h3 className="font-bold text-sm truncate max-w-xl">{previewItem.title}</h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950 flex items-center justify-center">
              {previewItem.type === 'video' && (
                <video src={previewItem.fileUrl} controls autoPlay className="max-h-[70vh] w-auto rounded-lg" />
              )}
              {previewItem.type === 'audio' && (
                <div className="p-8 text-center space-y-4 bg-slate-900 rounded-2xl max-w-md w-full">
                  <Music className="w-16 h-16 mx-auto text-purple-400" />
                  <audio src={previewItem.fileUrl} controls autoPlay className="w-full" />
                </div>
              )}
              {previewItem.type === 'image' && (
                <img src={previewItem.fileUrl} alt={previewItem.title} className="max-h-[75vh] w-auto object-contain rounded-lg" />
              )}
              {previewItem.type === 'pdf' && (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center text-white space-y-4">
                  <FileText className="w-16 h-16 text-red-500" />
                  <p className="text-sm font-semibold">Pratinjau Dokumen PDF Digital</p>
                  <iframe src={previewItem.fileUrl} className="w-full h-full rounded-lg border border-slate-800" title={previewItem.title} />
                </div>
              )}
              {previewItem.type === 'link' && (
                <div className="p-8 text-center space-y-4 text-white max-w-md">
                  <ExternalLink className="w-16 h-16 mx-auto text-blue-400" />
                  <p className="text-sm">{previewItem.description}</p>
                  <a
                    href={previewItem.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Buka Halaman Eksternal ↗
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">{previewItem.description}</span>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Media Ajar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>{editingItem ? 'Edit Media Ajar' : 'Unggah & Tambah Media Ajar Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Media Ajar:</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Contoh: Modul PDF Kalkulus Diferensial SMA"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat:</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Penjelasan isi materi, petunjuk bagi siswa..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Media:</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as MediaAjarType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="video">Video Pembelajaran (MP4)</option>
                    <option value="pdf">Dokumen PDF Langsung</option>
                    <option value="audio">Audio / Podcast (MP3)</option>
                    <option value="image">Gambar / Infografis</option>
                    <option value="link">Tautan Eksternal / Web</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Rombel:</label>
                  <select
                    value={itemTargetClass}
                    onChange={(e) => setItemTargetClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Semua">Semua Kelas</option>
                    <option value="12-MIPA-1">12-MIPA-1</option>
                    <option value="12-MIPA-2">12-MIPA-2</option>
                    <option value="12-IPS-1">12-IPS-1</option>
                  </select>
                </div>
              </div>

              {/* Direct File Upload Picker Area */}
              <div className="p-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Pilih Berkas Langsung dari Perangkat (PDF / Media):</span>
                  </span>
                  {isUploading && (
                    <span className="text-[10px] text-blue-600 font-bold animate-pulse">Mengunggah ke server...</span>
                  )}
                </div>

                <input
                  type="file"
                  accept={
                    itemType === 'pdf' ? '.pdf,application/pdf' :
                    itemType === 'video' ? 'video/mp4,video/*' :
                    itemType === 'audio' ? 'audio/mp3,audio/*' :
                    itemType === 'image' ? 'image/*' : '*'
                  }
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />

                {itemFileName && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Berkas aktif: {itemFileName} ({itemFileSize})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Masukkan Tautan / URL Sumber Media:</label>
                <input
                  type="text"
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                  placeholder="https://... atau /uploads/..."
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Publikasi:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="status"
                      checked={itemStatus === 'published'}
                      onChange={() => setItemStatus('published')}
                      className="text-blue-600"
                    />
                    <span>Langsung Terbitkan (Siswa dapat melihat)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="status"
                      checked={itemStatus === 'draft'}
                      onChange={() => setItemStatus('draft')}
                      className="text-blue-600"
                    />
                    <span>Simpan Sebagai Draf (Hanya Guru)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Publikasikan Media')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
