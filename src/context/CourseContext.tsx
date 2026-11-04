import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course, WeeklySection, CourseResource, ForumTopic, ForumPost, CourseIntroMaterial, DigitalAttendance } from '../types';
import { INITIAL_COURSES, INITIAL_FORUMS } from '../data/mockData';
import { safeSetItem } from '../utils/safeStorage';

interface CourseContextType {
  courses: Course[];
  loading: boolean;
  forums: ForumTopic[];
  fetchCourses: () => Promise<void>;
  createCourse: (data: Partial<Course>) => Promise<{ success: boolean; course?: Course; error?: string }>;
  enrollInCourse: (courseId: string, studentId: string, key?: string) => Promise<{ success: boolean; message?: string }>;
  unenrollFromCourse: (courseId: string, studentId: string) => Promise<{ success: boolean; message?: string }>;
  addWeeklySection: (courseId: string, data: { title: string; description?: string; startDate: string; endDate: string }) => Promise<{ success: boolean; section?: WeeklySection; error?: string }>;
  addMaterialToSection: (courseId: string, data: { sectionId: string; title: string; type: 'text' | 'pdf' | 'link' | 'video'; content: string; fileUrl?: string }) => Promise<{ success: boolean; resource?: CourseResource; error?: string }>;
  toggleMaterialCompleted: (courseId: string, resourceId: string, studentId: string) => Promise<void>;
  addIntroMaterial: (courseId: string, data: { title: string; content?: string; fileUrl?: string; fileName?: string; authorName: string; authorRole?: string }) => Promise<{ success: boolean; material?: CourseIntroMaterial }>;
  deleteIntroMaterial: (courseId: string, matId: string) => Promise<{ success: boolean }>;
  recordAttendance: (courseId: string, data: { sectionId: string; studentId: string; studentName: string; studentNis?: string; status?: 'hadir' | 'izin' | 'sakit' | 'terlambat'; notes?: string; deviceInfo?: string }) => Promise<{ success: boolean; message?: string; attendance?: DigitalAttendance }>;
  fetchAttendance: (courseId: string, sectionId?: string) => Promise<DigitalAttendance[]>;
  fetchGradebook: (courseId: string, studentId?: string, role?: string) => Promise<any>;
  fetchForums: (courseId: string) => Promise<ForumTopic[]>;
  createForumTopic: (courseId: string, title: string, content: string, creator: { id: string; name: string; role: any }) => Promise<ForumTopic | null>;
  addForumPost: (courseId: string, topicId: string, content: string, author: { id: string; name: string; role: any; avatar?: string }) => Promise<ForumPost | null>;
  requestAiForumReply: (courseId: string, topicId: string) => Promise<ForumPost | null>;
  applyAiScaffoldToCourse: (courseId: string, scaffoldedWeeks: any[]) => Promise<boolean>;
}


const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_courses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_COURSES;
  });

  const [loading, setLoading] = useState(false);

  // Sync to local storage safely
  useEffect(() => {
    safeSetItem('cakrawala_courses', JSON.stringify(courses));
  }, [courses]);

  // Initial fetch from backend API
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetchCourses fallback to local state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const createCourse = async (data: Partial<Course>) => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created: Course = await res.json();
        setCourses(prev => [created, ...prev]);
        return { success: true, course: created };
      }
    } catch {
      // Offline fallback
    }

    const fallbackCourse: Course = {
      id: `crs-${Date.now()}`,
      code: data.code || 'CRS-NEW',
      title: data.title || 'Kursus Baru',
      category: data.category || 'MIPA',
      description: data.description || '',
      teacherId: data.teacherId || 'usr-guru-01',
      teacherName: data.teacherName || 'Drs. Bambang Suryono, M.Pd',
      targetClass: data.targetClass || 'Semua',
      enrollmentKey: data.enrollmentKey || '',
      bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      enrolledStudentIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      sections: [
        {
          id: `sec-${Date.now()}-w1`,
          courseId: `crs-${Date.now()}`,
          weekNumber: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          title: 'Minggu 1: Silabus & Kontrak Pembelajaran',
          description: 'Pengantar perkuliahan minggu ke-1.',
          resources: []
        }
      ]
    };

    setCourses(prev => [fallbackCourse, ...prev]);
    return { success: true, course: fallbackCourse };
  };

  const enrollInCourse = async (courseId: string, studentId: string, key?: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: 'Kursus tidak ditemukan' };

    // Check enrollment key
    if (course.enrollmentKey && course.enrollmentKey.trim() !== '') {
      if (!key || key.trim() !== course.enrollmentKey.trim()) {
        return {
          success: false,
          message: 'Kunci pendaftaran (Enrollment Key) salah! Hubungi guru pengampu.'
        };
      }
    }

    try {
      await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, enrollmentKey: key })
      });
    } catch {
      // offline
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId && !c.enrolledStudentIds.includes(studentId)) {
        return { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId] };
      }
      return c;
    }));

    return { success: true, message: 'Selamat! Anda telah resmi terdaftar di kursus ini.' };
  };

  const unenrollFromCourse = async (courseId: string, studentId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/unenroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
    } catch {
      // offline
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, enrolledStudentIds: c.enrolledStudentIds.filter(id => id !== studentId) };
      }
      return c;
    }));

    return { success: true, message: 'Pendaftaran kursus berhasil dibatalkan.' };
  };

  const addWeeklySection = async (
    courseId: string,
    data: { title: string; description?: string; startDate: string; endDate: string }
  ) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const sec: WeeklySection = await res.json();
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            return { ...c, sections: [...c.sections, sec] };
          }
          return c;
        }));
        return { success: true, section: sec };
      }
    } catch {
      // fallback
    }

    const targetCourse = courses.find(c => c.id === courseId);
    const nextWeek = (targetCourse?.sections.length || 0) + 1;
    const fallbackSec: WeeklySection = {
      id: `sec-${Date.now()}-w${nextWeek}`,
      courseId,
      weekNumber: nextWeek,
      startDate: data.startDate,
      endDate: data.endDate,
      title: data.title,
      description: data.description,
      resources: []
    };

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, sections: [...c.sections, fallbackSec] };
      }
      return c;
    }));

    return { success: true, section: fallbackSec };
  };

  const addMaterialToSection = async (
    courseId: string,
    data: { sectionId: string; title: string; type: 'text' | 'pdf' | 'link' | 'video'; content: string; fileUrl?: string }
  ) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const resData: CourseResource = await res.json();
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            return {
              ...c,
              sections: c.sections.map(s => {
                if (s.id === data.sectionId) {
                  return { ...s, resources: [...s.resources, resData] };
                }
                return s;
              })
            };
          }
          return c;
        }));
        return { success: true, resource: resData };
      }
    } catch {
      // fallback
    }

    const fallbackRes: CourseResource = {
      id: `res-${Date.now()}`,
      sectionId: data.sectionId,
      title: data.title,
      type: data.type,
      content: data.content,
      fileUrl: data.fileUrl,
      completedByStudentIds: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          sections: c.sections.map(s => {
            if (s.id === data.sectionId) {
              return { ...s, resources: [...s.resources, fallbackRes] };
            }
            return s;
          })
        };
      }
      return c;
    }));

    return { success: true, resource: fallbackRes };
  };

  const toggleMaterialCompleted = async (courseId: string, resourceId: string, studentId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/materials/${resourceId}/toggle-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
    } catch {
      // fallback
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          sections: c.sections.map(s => ({
            ...s,
            resources: s.resources.map(r => {
              if (r.id === resourceId) {
                const list = r.completedByStudentIds || [];
                const nextList = list.includes(studentId)
                  ? list.filter(id => id !== studentId)
                  : [...list, studentId];
                return { ...r, completedByStudentIds: nextList };
              }
              return r;
            })
          }))
        };
      }
      return c;
    }));
  };

  // Moodle Course Forum State & Methods
  const [forums, setForums] = useState<ForumTopic[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_forums');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_FORUMS;
  });

  useEffect(() => {
    safeSetItem('cakrawala_forums', JSON.stringify(forums));
  }, [forums]);

  const fetchForums = async (courseId: string): Promise<ForumTopic[]> => {
    try {
      const res = await fetch(`/api/courses/${courseId}/forums`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setForums(prev => {
            const others = prev.filter(f => f.courseId !== courseId);
            return [...others, ...data];
          });
          return data;
        }
      }
    } catch {
      // offline
    }
    return forums.filter(f => f.courseId === courseId);
  };

  const createForumTopic = async (
    courseId: string, 
    title: string, 
    content: string, 
    creator: { id: string; name: string; role: any }
  ): Promise<ForumTopic | null> => {
    try {
      const res = await fetch(`/api/courses/${courseId}/forums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          initialContent: content,
          creatorId: creator.id,
          creatorName: creator.name,
          creatorRole: creator.role
        })
      });
      if (res.ok) {
        const created: ForumTopic = await res.json();
        setForums(prev => [created, ...prev]);
        return created;
      }
    } catch {
      // offline
    }

    const fallbackTopic: ForumTopic = {
      id: `topic-${Date.now()}`,
      courseId,
      title,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorRole: creator.role,
      createdAt: new Date().toLocaleDateString('id-ID'),
      posts: [
        {
          id: `post-${Date.now()}`,
          topicId: `topic-${Date.now()}`,
          courseId,
          authorId: creator.id,
          authorName: creator.name,
          authorRole: creator.role,
          content,
          createdAt: new Date().toLocaleDateString('id-ID')
        }
      ]
    };
    setForums(prev => [fallbackTopic, ...prev]);
    return fallbackTopic;
  };

  const addForumPost = async (
    courseId: string, 
    topicId: string, 
    content: string, 
    author: { id: string; name: string; role: any; avatar?: string }
  ): Promise<ForumPost | null> => {
    try {
      const res = await fetch(`/api/courses/${courseId}/forums/${topicId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorId: author.id,
          authorName: author.name,
          authorRole: author.role,
          authorAvatar: author.avatar
        })
      });
      if (res.ok) {
        const createdPost: ForumPost = await res.json();
        setForums(prev => prev.map(t => {
          if (t.id === topicId) {
            return { ...t, posts: [...t.posts, createdPost] };
          }
          return t;
        }));
        return createdPost;
      }
    } catch {
      // offline
    }

    const fallbackPost: ForumPost = {
      id: `post-${Date.now()}`,
      topicId,
      courseId,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorAvatar: author.avatar,
      content,
      createdAt: new Date().toLocaleDateString('id-ID')
    };

    setForums(prev => prev.map(t => {
      if (t.id === topicId) {
        return { ...t, posts: [...t.posts, fallbackPost] };
      }
      return t;
    }));
    return fallbackPost;
  };

  const requestAiForumReply = async (courseId: string, topicId: string): Promise<ForumPost | null> => {
    try {
      const res = await fetch(`/api/courses/${courseId}/forums/${topicId}/ai-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const aiPost: ForumPost = await res.json();
        setForums(prev => prev.map(t => {
          if (t.id === topicId) {
            return { ...t, posts: [...t.posts, aiPost] };
          }
          return t;
        }));
        return aiPost;
      }
    } catch {
      // offline fallback
    }

    const fallbackAiPost: ForumPost = {
      id: `post-ai-${Date.now()}`,
      topicId,
      courseId,
      authorId: 'ai-asisten-cakrawala',
      authorName: 'Cakrawala AI Tutor (Scaffold)',
      authorRole: 'admin',
      authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
      content: '💡 **Pedagogical AI Insight:** Pertanyaan yang sangat baik! Kunci pemahaman di sini adalah memeriksa kembali syarat kontinuitas dan melakukan faktorisasi aljabar bertahap sebelum substitusi nilai batas.',
      createdAt: new Date().toLocaleDateString('id-ID'),
      isAiGenerated: true
    };

    setForums(prev => prev.map(t => {
      if (t.id === topicId) {
        return { ...t, posts: [...t.posts, fallbackAiPost] };
      }
      return t;
    }));
    return fallbackAiPost;
  };

  const applyAiScaffoldToCourse = async (courseId: string, scaffoldedWeeks: any[]): Promise<boolean> => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(scaffoldedWeeks)) return false;

    const newSections: WeeklySection[] = scaffoldedWeeks.map((sw, idx) => {
      const weekNum = course.sections.length + idx + 1;
      return {
        id: `sec-${Date.now()}-ai-w${weekNum}`,
        courseId,
        weekNumber: weekNum,
        startDate: new Date(Date.now() + idx * 7 * 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0],
        title: sw.title || `Minggu ${weekNum}: Pengayaan AI Scaffold`,
        description: sw.description || '',
        resources: Array.isArray(sw.resources) ? sw.resources.map((r: any, rIdx: number) => ({
          id: `res-ai-${Date.now()}-${weekNum}-${rIdx}`,
          sectionId: `sec-${Date.now()}-ai-w${weekNum}`,
          title: r.title || 'Materi Belajar',
          type: r.type || 'text',
          content: r.content || '',
          completedByStudentIds: [],
          createdAt: new Date().toISOString().split('T')[0]
        })) : []
      };
    });

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          sections: [...c.sections, ...newSections]
        };
      }
      return c;
    }));

    return true;
  };

  const addIntroMaterial = async (
    courseId: string,
    data: { title: string; content?: string; fileUrl?: string; fileName?: string; authorName: string; authorRole?: string }
  ) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/intro-material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        const newMat: CourseIntroMaterial = result.material;
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            const list = c.introMaterials || [];
            return { ...c, introMaterials: [newMat, ...list] };
          }
          return c;
        }));
        return { success: true, material: newMat };
      }
    } catch {
      // offline fallback
    }

    const fallbackMat: CourseIntroMaterial = {
      id: `intro-${Date.now()}`,
      title: data.title,
      content: data.content || '',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      updatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' WIB',
      authorName: data.authorName
    };

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const list = c.introMaterials || [];
        return { ...c, introMaterials: [fallbackMat, ...list] };
      }
      return c;
    }));

    return { success: true, material: fallbackMat };
  };

  const deleteIntroMaterial = async (courseId: string, matId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/intro-material/${matId}`, {
        method: 'DELETE'
      });
    } catch {
      // offline
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId && c.introMaterials) {
        return { ...c, introMaterials: c.introMaterials.filter(m => m.id !== matId) };
      }
      return c;
    }));

    return { success: true };
  };

  const recordAttendance = async (
    courseId: string,
    data: { sectionId: string; studentId: string; studentName: string; studentNis?: string; status?: 'hadir' | 'izin' | 'sakit' | 'terlambat'; notes?: string; deviceInfo?: string }
  ) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, message: result.message, attendance: result.attendance };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Gagal mencatatkan presensi.' };
      }
    } catch {
      const fallbackAtt: DigitalAttendance = {
        id: `att-${Date.now()}`,
        courseId,
        sectionId: data.sectionId,
        studentId: data.studentId,
        studentName: data.studentName,
        studentNis: data.studentNis,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        status: data.status || 'hadir',
        notes: data.notes || '',
        deviceInfo: data.deviceInfo || 'Browser Terverifikasi'
      };
      return { success: true, message: 'Presensi tersimpan.', attendance: fallbackAtt };
    }
  };

  const fetchAttendance = async (courseId: string, sectionId?: string): Promise<DigitalAttendance[]> => {
    try {
      const params = new URLSearchParams();
      if (sectionId) params.append('sectionId', sectionId);
      const res = await fetch(`/api/courses/${courseId}/attendance?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return [];
  };

  const fetchGradebook = async (courseId: string, studentId?: string, role?: string) => {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (role) params.append('role', role);
      const res = await fetch(`/api/courses/${courseId}/gradebook?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return null;
  };

  return (
    <CourseContext.Provider value={{
      courses,
      loading,
      forums,
      fetchCourses,
      createCourse,
      enrollInCourse,
      unenrollFromCourse,
      addWeeklySection,
      addMaterialToSection,
      toggleMaterialCompleted,
      addIntroMaterial,
      deleteIntroMaterial,
      recordAttendance,
      fetchAttendance,
      fetchGradebook,
      fetchForums,
      createForumTopic,
      addForumPost,
      requestAiForumReply,
      applyAiScaffoldToCourse
    }}>
      {children}
    </CourseContext.Provider>
  );
};


export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourses must be used within CourseProvider');
  return context;
};

export const useCourse = useCourses;
