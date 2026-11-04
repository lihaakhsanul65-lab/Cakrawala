import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initGoogleAuth, 
  signInWithGoogle, 
  signOutGoogle, 
  uploadBackupToGoogleDrive, 
  listGoogleDriveBackups, 
  downloadGoogleDriveBackup, 
  deleteGoogleDriveFile, 
  listGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  syncBatchToGoogleCalendar,
  createGoogleSheet,
  appendGoogleSheetValues,
  getGoogleSheetValues,
  sendGmailMessage,
  listRecentGmailMessages,
  createGoogleDoc,
  getGoogleDocContent,
  createGoogleForm,
  getGoogleForm,
  getGoogleFormResponses,
  createGoogleMeetSpace,
  getOrCreateDedicatedFolder,
  listFilesInDedicatedFolder,
  syncExamSubmissionToDrive,
  syncAssignmentToDrive,
  executeTwoWayDriveSync,
  DEDICATED_DRIVE_FOLDER_NAME,
  GoogleDriveFile,
  GoogleCalendarEvent,
  GoogleCalendarEventInput,
  GoogleDocData,
  GoogleSheetData,
  GoogleFormData,
  GoogleMeetData,
  GoogleSlideData,
  PickedGoogleFile,
  createGoogleSlidePresentation,
  getGoogleSlidePresentation,
  openGooglePicker,
  DedicatedFolderInfo,
  SyncedDriveFileMeta
} from '../services/googleWorkspace';

interface GoogleWorkspaceContextType {
  isGoogleConnected: boolean;
  googleUser: User | null;
  isConnecting: boolean;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  
  // Google Drive
  driveBackups: GoogleDriveFile[];
  isLoadingDrive: boolean;
  refreshDriveBackups: () => Promise<void>;
  uploadToDrive: (fileName: string, data: any, description?: string) => Promise<{ success: boolean; file?: GoogleDriveFile; error?: string }>;
  restoreFromDrive: (fileId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteFromDrive: (fileId: string, fileName: string) => Promise<{ success: boolean; error?: string }>;

  // Dedicated Folder & Two-Way Sync (Hasil Ujian & Tugas Siswa)
  dedicatedFolder: DedicatedFolderInfo | null;
  folderFiles: SyncedDriveFileMeta[];
  isSyncingTwoWay: boolean;
  lastSyncTime: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  initDedicatedFolder: () => Promise<DedicatedFolderInfo | null>;
  refreshFolderFiles: () => Promise<void>;
  syncSingleSubmission: (submission: any, assignmentTitle?: string) => Promise<boolean>;
  syncSingleAssignment: (assignment: any) => Promise<boolean>;
  triggerTwoWaySync: (localSubmissions: any[], localAssignments: any[]) => Promise<{
    success: boolean;
    pushedCount: number;
    pulledCount: number;
    mergedSubmissions: any[];
    mergedAssignments: any[];
    error?: string;
  }>;

  // Google Calendar
  calendarEvents: GoogleCalendarEvent[];
  isLoadingCalendar: boolean;
  refreshCalendarEvents: () => Promise<void>;
  addToCalendar: (eventData: GoogleCalendarEventInput) => Promise<{ success: boolean; event?: GoogleCalendarEvent; error?: string }>;
  syncLmsEventsToCalendar: (events: any[]) => Promise<{ success: boolean; syncedCount: number; error?: string }>;

  // Google Sheets
  createSheet: (title: string, initialRows?: string[][]) => Promise<{ success: boolean; spreadsheet?: GoogleSheetData; error?: string }>;
  appendSheet: (spreadsheetId: string, range: string, values: string[][]) => Promise<{ success: boolean; error?: string }>;
  readSheet: (spreadsheetId: string, range: string) => Promise<{ success: boolean; values?: string[][]; error?: string }>;

  // Gmail
  sendEmail: (to: string, subject: string, bodyText: string) => Promise<{ success: boolean; id?: string; error?: string }>;
  getRecentEmails: () => Promise<{ success: boolean; messages: any[]; error?: string }>;

  // Google Docs
  createDoc: (title: string, content?: string) => Promise<{ success: boolean; document?: GoogleDocData; error?: string }>;
  getDocContent: (documentId: string) => Promise<{ success: boolean; title?: string; bodyText?: string; error?: string }>;

  // Google Forms
  createForm: (title: string, description?: string, questions?: Array<{ title: string; options?: string[] }>) => Promise<{ success: boolean; form?: GoogleFormData; error?: string }>;
  getFormDetails: (formId: string) => Promise<{ success: boolean; form?: any; error?: string }>;
  getFormAnswers: (formId: string) => Promise<{ success: boolean; responses?: any[]; error?: string }>;

  // Google Meet
  createMeetRoom: () => Promise<{ success: boolean; meet?: GoogleMeetData; error?: string }>;

  // Google Slides
  createSlidePresentation: (title: string, slides?: Array<{ title: string; subtitle?: string; bulletPoints?: string[] }>) => Promise<{ success: boolean; presentation?: GoogleSlideData; error?: string }>;
  getSlidePresentation: (presentationId: string) => Promise<{ success: boolean; presentation?: any; error?: string }>;

  // Google Picker
  pickFileWithGooglePicker: (options?: { viewType?: 'all' | 'docs' | 'sheets' | 'slides' | 'forms' }) => Promise<{ success: boolean; file?: PickedGoogleFile; error?: string }>;
}

const GoogleWorkspaceContext = createContext<GoogleWorkspaceContextType | undefined>(undefined);

export const GoogleWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [driveBackups, setDriveBackups] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Dedicated Folder & Two-Way Sync State
  const [dedicatedFolder, setDedicatedFolder] = useState<DedicatedFolderInfo | null>(null);
  const [folderFiles, setFolderFiles] = useState<SyncedDriveFileMeta[]>([]);
  const [isSyncingTwoWay, setIsSyncingTwoWay] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('cakrawala_last_gdrive_sync');
  });
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => {
    const val = localStorage.getItem('cakrawala_autosync_gdrive');
    return val !== null ? val === 'true' : true; // Default auto sync enabled
  });

  const setAutoSyncEnabled = (enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    localStorage.setItem('cakrawala_autosync_gdrive', String(enabled));
  };

  // Initialize Auth Listener on mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
        setDriveBackups([]);
        setCalendarEvents([]);
        setDedicatedFolder(null);
        setFolderFiles([]);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const refreshDriveBackups = useCallback(async () => {
    if (!googleUser) return;
    setIsLoadingDrive(true);
    try {
      const res = await listGoogleDriveBackups();
      if (res.success) {
        setDriveBackups(res.files);
      }
    } finally {
      setIsLoadingDrive(false);
    }
  }, [googleUser]);

  const refreshCalendarEvents = useCallback(async () => {
    if (!googleUser) return;
    setIsLoadingCalendar(true);
    try {
      const res = await listGoogleCalendarEvents();
      if (res.success) {
        setCalendarEvents(res.events);
      }
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [googleUser]);

  // Initialize Dedicated Folder
  const initDedicatedFolder = useCallback(async (): Promise<DedicatedFolderInfo | null> => {
    if (!googleUser) return null;
    try {
      const res = await getOrCreateDedicatedFolder();
      if (res.success && res.folder) {
        setDedicatedFolder(res.folder);
        // Load files inside dedicated folder
        const listRes = await listFilesInDedicatedFolder(res.folder.id);
        if (listRes.success) {
          setFolderFiles(listRes.files);
        }
        return res.folder;
      }
    } catch (err) {
      console.warn('initDedicatedFolder warning:', err);
    }
    return null;
  }, [googleUser]);

  const refreshFolderFiles = useCallback(async () => {
    let targetFolder = dedicatedFolder;
    if (!targetFolder) {
      targetFolder = await initDedicatedFolder();
    }
    if (targetFolder) {
      const listRes = await listFilesInDedicatedFolder(targetFolder.id);
      if (listRes.success) {
        setFolderFiles(listRes.files);
      }
    }
  }, [dedicatedFolder, initDedicatedFolder]);

  // Load resources whenever Google user is connected
  useEffect(() => {
    if (googleUser) {
      refreshDriveBackups();
      refreshCalendarEvents();
      initDedicatedFolder();
    }
  }, [googleUser, refreshDriveBackups, refreshCalendarEvents, initDedicatedFolder]);

  const connectGoogle = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setGoogleUser(result.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to connect Google account:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogle = async (): Promise<void> => {
    await signOutGoogle();
    setGoogleUser(null);
    setDriveBackups([]);
    setCalendarEvents([]);
    setDedicatedFolder(null);
    setFolderFiles([]);
  };

  // Google Drive general backups
  const uploadToDrive = async (fileName: string, data: any, description?: string) => {
    const res = await uploadBackupToGoogleDrive(fileName, data, description);
    if (res.success && res.file) {
      setDriveBackups(prev => [res.file!, ...prev]);
    }
    return res;
  };

  const restoreFromDrive = async (fileId: string) => {
    return await downloadGoogleDriveBackup(fileId);
  };

  const deleteFromDrive = async (fileId: string, fileName: string) => {
    const res = await deleteGoogleDriveFile(fileId, fileName);
    if (res.success) {
      setDriveBackups(prev => prev.filter(f => f.id !== fileId));
    }
    return res;
  };

  // Dedicated Folder Two-Way Sync implementation
  const syncSingleSubmission = async (submission: any, assignmentTitle?: string): Promise<boolean> => {
    if (!googleUser || !autoSyncEnabled) return false;
    try {
      let folder = dedicatedFolder;
      if (!folder) {
        folder = await initDedicatedFolder();
      }
      if (!folder) return false;

      const res = await syncExamSubmissionToDrive(folder.id, submission, assignmentTitle);
      if (res.success) {
        await refreshFolderFiles();
        const now = new Date().toLocaleTimeString('id-ID');
        setLastSyncTime(now);
        localStorage.setItem('cakrawala_last_gdrive_sync', now);
        return true;
      }
    } catch (err) {
      console.warn('syncSingleSubmission error:', err);
    }
    return false;
  };

  const syncSingleAssignment = async (assignment: any): Promise<boolean> => {
    if (!googleUser || !autoSyncEnabled) return false;
    try {
      let folder = dedicatedFolder;
      if (!folder) {
        folder = await initDedicatedFolder();
      }
      if (!folder) return false;

      const res = await syncAssignmentToDrive(folder.id, assignment);
      if (res.success) {
        await refreshFolderFiles();
        return true;
      }
    } catch (err) {
      console.warn('syncSingleAssignment error:', err);
    }
    return false;
  };

  const triggerTwoWaySync = async (localSubmissions: any[], localAssignments: any[]) => {
    setIsSyncingTwoWay(true);
    try {
      const res = await executeTwoWayDriveSync(localSubmissions, localAssignments);
      if (res.success) {
        if (res.folder) setDedicatedFolder(res.folder);
        await refreshFolderFiles();
        const now = new Date().toLocaleTimeString('id-ID');
        setLastSyncTime(now);
        localStorage.setItem('cakrawala_last_gdrive_sync', now);
      }
      return res;
    } finally {
      setIsSyncingTwoWay(false);
    }
  };

  // Google Calendar
  const addToCalendar = async (eventData: GoogleCalendarEventInput) => {
    const res = await createGoogleCalendarEvent(eventData);
    if (res.success && res.event) {
      setCalendarEvents(prev => [res.event!, ...prev]);
    }
    return res;
  };

  const syncLmsEventsToCalendar = async (events: any[]) => {
    const res = await syncBatchToGoogleCalendar(events);
    if (res.success) {
      await refreshCalendarEvents();
    }
    return res;
  };

  // Google Sheets
  const createSheet = async (title: string, initialRows?: string[][]) => {
    return await createGoogleSheet(title, initialRows);
  };

  const appendSheet = async (spreadsheetId: string, range: string, values: string[][]) => {
    return await appendGoogleSheetValues(spreadsheetId, range, values);
  };

  const readSheet = async (spreadsheetId: string, range: string) => {
    return await getGoogleSheetValues(spreadsheetId, range);
  };

  // Gmail
  const sendEmail = async (to: string, subject: string, bodyText: string) => {
    return await sendGmailMessage(to, subject, bodyText);
  };

  const getRecentEmails = async () => {
    return await listRecentGmailMessages();
  };

  // Google Docs
  const createDoc = async (title: string, content?: string) => {
    return await createGoogleDoc(title, content);
  };

  const getDocContent = async (documentId: string) => {
    return await getGoogleDocContent(documentId);
  };

  // Google Forms
  const createForm = async (title: string, description?: string, questions?: Array<{ title: string; options?: string[] }>) => {
    return await createGoogleForm(title, description, questions);
  };

  const getFormDetails = async (formId: string) => {
    return await getGoogleForm(formId);
  };

  const getFormAnswers = async (formId: string) => {
    return await getGoogleFormResponses(formId);
  };

  // Google Meet
  const createMeetRoom = async () => {
    return await createGoogleMeetSpace();
  };

  // Google Slides
  const createSlidePresentation = async (
    title: string,
    slides?: Array<{ title: string; subtitle?: string; bulletPoints?: string[] }>
  ) => {
    return await createGoogleSlidePresentation(title, slides);
  };

  const getSlidePresentation = async (presentationId: string) => {
    return await getGoogleSlidePresentation(presentationId);
  };

  // Google Picker
  const pickFileWithGooglePicker = async (options?: {
    viewType?: 'all' | 'docs' | 'sheets' | 'slides' | 'forms';
  }): Promise<{ success: boolean; file?: PickedGoogleFile; error?: string }> => {
    return new Promise((resolve) => {
      openGooglePicker({
        viewType: options?.viewType || 'all',
        onPicked: (file) => resolve({ success: true, file }),
        onCancel: () => resolve({ success: false, error: 'Pemilihan berkas dibatalkan oleh pengguna' })
      }).then((res) => {
        if (!res.success) {
          resolve({ success: false, error: res.error });
        }
      });
    });
  };

  return (
    <GoogleWorkspaceContext.Provider
      value={{
        isGoogleConnected: !!googleUser,
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
        initDedicatedFolder,
        refreshFolderFiles,
        syncSingleSubmission,
        syncSingleAssignment,
        triggerTwoWaySync,
        calendarEvents,
        isLoadingCalendar,
        refreshCalendarEvents,
        addToCalendar,
        syncLmsEventsToCalendar,
        createSheet,
        appendSheet,
        readSheet,
        sendEmail,
        getRecentEmails,
        createDoc,
        getDocContent,
        createForm,
        getFormDetails,
        getFormAnswers,
        createMeetRoom,
        createSlidePresentation,
        getSlidePresentation,
        pickFileWithGooglePicker
      }}
    >
      {children}
    </GoogleWorkspaceContext.Provider>
  );
};

export const useGoogleWorkspace = () => {
  const context = useContext(GoogleWorkspaceContext);
  if (!context) {
    throw new Error('useGoogleWorkspace must be used within a GoogleWorkspaceProvider');
  }
  return context;
};
