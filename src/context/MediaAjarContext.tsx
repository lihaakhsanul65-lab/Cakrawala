import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MediaAjarItem } from '../types';
import { INITIAL_MEDIA_AJAR } from '../data/mockData';
import { safeSetItem } from '../utils/safeStorage';

interface MediaAjarContextType {
  mediaItems: MediaAjarItem[];
  loading: boolean;
  fetchMediaItems: (filters?: { targetClass?: string; courseId?: string; status?: string }) => Promise<void>;
  createMediaItem: (data: Omit<MediaAjarItem, 'id' | 'createdAt' | 'order'>) => Promise<{ success: boolean; item?: MediaAjarItem; message?: string }>;
  updateMediaItem: (id: string, data: Partial<MediaAjarItem>) => Promise<{ success: boolean; item?: MediaAjarItem; message?: string }>;
  deleteMediaItem: (id: string) => Promise<{ success: boolean; message?: string }>;
  uploadFileToServer: (fileName: string, fileData: string, fileType?: string) => Promise<{ success: boolean; url?: string; fileName?: string; fileSize?: string; message?: string }>;
}

const MediaAjarContext = createContext<MediaAjarContextType | undefined>(undefined);

export const MediaAjarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mediaItems, setMediaItems] = useState<MediaAjarItem[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_media_ajar');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MEDIA_AJAR;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    safeSetItem('cakrawala_media_ajar', JSON.stringify(mediaItems));
  }, [mediaItems]);

  const fetchMediaItems = useCallback(async (filters?: { targetClass?: string; courseId?: string; status?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.targetClass && filters.targetClass !== 'Semua') params.append('targetClass', filters.targetClass);
      if (filters?.courseId) params.append('courseId', filters.courseId);
      if (filters?.status) params.append('status', filters.status);

      const res = await fetch(`/api/media-ajar?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMediaItems(data);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetchMediaItems fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaItems();
  }, [fetchMediaItems]);

  const uploadFileToServer = async (fileName: string, fileData: string, fileType?: string) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileData, fileType })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          url: data.url,
          fileName: data.originalName,
          fileSize: data.fileSize
        };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Gagal mengunggah berkas.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Koneksi unggah gagal: ' + err.message };
    }
  };

  const createMediaItem = async (data: Omit<MediaAjarItem, 'id' | 'createdAt' | 'order'>) => {
    try {
      const res = await fetch('/api/media-ajar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: MediaAjarItem = await res.json();
        setMediaItems(prev => [...prev, created]);
        return { success: true, item: created };
      }
    } catch {
      // offline fallback
    }

    const fallback: MediaAjarItem = {
      ...data,
      id: `media-${Date.now()}`,
      order: mediaItems.length + 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setMediaItems(prev => [...prev, fallback]);
    return { success: true, item: fallback };
  };

  const updateMediaItem = async (id: string, data: Partial<MediaAjarItem>) => {
    try {
      const res = await fetch(`/api/media-ajar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated: MediaAjarItem = await res.json();
        setMediaItems(prev => prev.map(m => m.id === id ? updated : m));
        return { success: true, item: updated };
      }
    } catch {
      // offline fallback
    }

    setMediaItems(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    const found = mediaItems.find(m => m.id === id);
    return { success: true, item: found ? { ...found, ...data } : undefined };
  };

  const deleteMediaItem = async (id: string) => {
    try {
      const res = await fetch(`/api/media-ajar/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMediaItems(prev => prev.filter(m => m.id !== id));
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    setMediaItems(prev => prev.filter(m => m.id !== id));
    return { success: true };
  };

  return (
    <MediaAjarContext.Provider value={{
      mediaItems,
      loading,
      fetchMediaItems,
      createMediaItem,
      updateMediaItem,
      deleteMediaItem,
      uploadFileToServer
    }}>
      {children}
    </MediaAjarContext.Provider>
  );
};

export const useMediaAjar = () => {
  const context = useContext(MediaAjarContext);
  if (!context) {
    throw new Error('useMediaAjar must be used within a MediaAjarProvider');
  }
  return context;
};
