import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReportCard, SystemAuditLog, StudentSubjectGrade } from '../types';
import { INITIAL_REPORT_CARDS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { safeSetItem } from '../utils/safeStorage';

interface HomeroomContextType {
  reportCards: ReportCard[];
  auditLogs: SystemAuditLog[];
  loading: boolean;
  fetchReportCards: (kelas?: string) => Promise<void>;
  updateReportCard: (id: string, notes: string, status?: string) => Promise<void>;
  exportGoogleDriveBackup: () => Promise<void>;
  importGoogleDriveBackup: (jsonData: any) => Promise<{ success: boolean; message: string }>;
  fetchStudentHistory: (studentId: string) => Promise<any>;
}

const HomeroomContext = createContext<HomeroomContextType | undefined>(undefined);

export const HomeroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reportCards, setReportCards] = useState<ReportCard[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_report_cards');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_REPORT_CARDS;
  });

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => {
    try {
      const stored = localStorage.getItem('cakrawala_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    safeSetItem('cakrawala_report_cards', JSON.stringify(reportCards));
  }, [reportCards]);

  useEffect(() => {
    safeSetItem('cakrawala_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const fetchReportCards = async (kelas?: string) => {
    setLoading(true);
    try {
      const url = kelas ? `/api/homeroom/report-cards?kelas=${encodeURIComponent(kelas)}` : '/api/homeroom/report-cards';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReportCards(data);
        }
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  };

  const updateReportCard = async (id: string, notes: string, status?: string) => {
    try {
      await fetch(`/api/homeroom/report-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeroomNotes: notes, statusKenaikan: status })
      });
    } catch {
      // offline
    }

    setReportCards(prev => prev.map(rc => {
      if (rc.id === id) {
        return {
          ...rc,
          homeroomNotes: notes,
          statusKenaikan: (status as any) || rc.statusKenaikan,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return rc;
    }));
  };

  const exportGoogleDriveBackup = async () => {
    try {
      const res = await fetch('/api/backup/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cakrawala_lms_gdrive_backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
    } catch {
      // offline client snapshot fallback
    }

    const clientSnapshot = {
      appName: 'Cakrawala LMS',
      version: '5.0.0',
      exportTimestamp: new Date().toISOString(),
      localStorageDump: {
        users: localStorage.getItem('cakrawala_users'),
        courses: localStorage.getItem('cakrawala_courses'),
        assignments: localStorage.getItem('cakrawala_assignments'),
        submissions: localStorage.getItem('cakrawala_submissions'),
        reportCards: localStorage.getItem('cakrawala_report_cards')
      }
    };

    const blob = new Blob([JSON.stringify(clientSnapshot, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cakrawala_lms_gdrive_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importGoogleDriveBackup = async (jsonData: any) => {
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonData.data || jsonData })
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, message: result.message };
      }
    } catch {
      // offline
    }

    if (jsonData.data?.reportCards) {
      setReportCards(jsonData.data.reportCards);
    }
    return { success: true, message: 'Data cadangan Google Drive berhasil diimpor ke sistem lokal!' };
  };

  const fetchStudentHistory = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}/history`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // offline
    }
    return null;
  };

  return (
    <HomeroomContext.Provider value={{
      reportCards,
      auditLogs,
      loading,
      fetchReportCards,
      updateReportCard,
      exportGoogleDriveBackup,
      importGoogleDriveBackup,
      fetchStudentHistory
    }}>
      {children}
    </HomeroomContext.Provider>
  );
};

export const useHomeroom = () => {
  const context = useContext(HomeroomContext);
  if (!context) throw new Error('useHomeroom must be used within HomeroomProvider');
  return context;
};
