import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider with full Workspace suite scopes
export const provider = new GoogleAuthProvider();

// Workspace Scopes List
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings'
];

WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

provider.setCustomParameters({
  prompt: 'select_account'
});

// In-Memory Token Cache (Never in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  date: string;
  startTime?: string;
  endTime?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
}

export interface GoogleDocData {
  documentId: string;
  title: string;
  webViewLink?: string;
}

export interface GoogleSheetData {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
}

export interface GoogleFormData {
  formId: string;
  title: string;
  responderUri: string;
}

export interface GoogleMeetData {
  meetingUri: string;
  meetingCode: string;
  spaceName: string;
}

export interface GoogleSlideData {
  presentationId: string;
  title: string;
  webViewLink?: string;
  slidesCount?: number;
}

export interface PickedGoogleFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  sizeBytes?: number;
}

/**
 * Initialize Auth State Listener
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign-In with Popup
 */
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google OAuth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out from Google Auth
 */
export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/* =====================================================================
   1. GOOGLE DRIVE INTEGRATION (Dual Storage Support)
   ===================================================================== */

export const uploadBackupToGoogleDrive = async (
  fileName: string,
  content: object | string,
  description?: string
): Promise<{ success: boolean; file?: GoogleDriveFile; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Belum terhubung dengan akun Google. Silakan masuk terlebih dahulu.' };
  }

  try {
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: description || 'Cadangan Data Resmi Cakrawala LMS Dual Storage',
      properties: {
        app: 'Cakrawala LMS',
        backupType: 'Dual-Storage'
      }
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal mengunggah ke Google Drive (${response.status})`);
    }

    const file: GoogleDriveFile = await response.json();
    return { success: true, file };
  } catch (error: any) {
    console.error('uploadBackupToGoogleDrive error:', error);
    return { success: false, error: error.message || 'Gagal menyimpan ke Google Drive' };
  }
};

export const listGoogleDriveBackups = async (): Promise<{ success: boolean; files: GoogleDriveFile[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, files: [], error: 'Token tidak tersedia' };
  }

  try {
    const query = encodeURIComponent("trashed = false and (name contains 'cakrawala' or mimeType = 'application/json')");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal membaca berkas Drive (${response.status})`);
    }

    const data = await response.json();
    return { success: true, files: data.files || [] };
  } catch (error: any) {
    console.error('listGoogleDriveBackups error:', error);
    return { success: false, files: [], error: error.message || 'Gagal membaca berkas Google Drive' };
  }
};

export const downloadGoogleDriveBackup = async (fileId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token tidak tersedia' };
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengunduh berkas (${response.status})`);
    }

    const jsonData = await response.json();
    return { success: true, data: jsonData };
  } catch (error: any) {
    console.error('downloadGoogleDriveBackup error:', error);
    return { success: false, error: error.message || 'Gagal mengunduh dari Google Drive' };
  }
};

export const deleteGoogleDriveFile = async (
  fileId: string, 
  fileName: string
): Promise<{ success: boolean; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token tidak tersedia' };
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Gagal menghapus berkas (${response.status})`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('deleteGoogleDriveFile error:', error);
    return { success: false, error: error.message || 'Gagal menghapus berkas dari Google Drive' };
  }
};

/* =====================================================================
   DEDICATED FOLDER & TWO-WAY AUTOMATIC SYNCHRONIZATION
   (Hasil Ujian dan Tugas Siswa Dua Arah)
   ===================================================================== */

export const DEDICATED_DRIVE_FOLDER_NAME = 'Cakrawala_LMS_Hasil_Ujian_dan_Tugas';

export interface DedicatedFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface SyncedDriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  type?: 'exam_submission' | 'assignment' | 'general';
  title?: string;
  studentName?: string;
}

/**
 * Get or create the dedicated Google Drive folder for exam results & assignments
 */
export const getOrCreateDedicatedFolder = async (
  folderName = DEDICATED_DRIVE_FOLDER_NAME
): Promise<{ success: boolean; folder?: DedicatedFolderInfo; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Belum terhubung ke Google Drive. Silakan hubungkan akun Google.' };
  }

  try {
    // 1. Search if folder already exists and not in trash
    const query = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
    );
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          success: true,
          folder: {
            id: data.files[0].id,
            name: data.files[0].name,
            webViewLink: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`
          }
        };
      }
    }

    // 2. Folder does not exist, create it
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Folder khusus Cakrawala LMS untuk sinkronisasi otomatis hasil ujian dan tugas siswa.'
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat folder Google Drive (${createRes.status})`);
    }

    const newFolder = await createRes.json();
    return {
      success: true,
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        webViewLink: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`
      }
    };
  } catch (error: any) {
    console.error('getOrCreateDedicatedFolder error:', error);
    return { success: false, error: error.message || 'Gagal menyiapkan folder Google Drive' };
  }
};

/**
 * List all files in the dedicated folder
 */
export const listFilesInDedicatedFolder = async (
  folderId: string
): Promise<{ success: boolean; files: SyncedDriveFileMeta[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, files: [], error: 'Token tidak tersedia' };

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=100`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membaca isi folder (${res.status})`);
    }

    const data = await res.json();
    const files: SyncedDriveFileMeta[] = (data.files || []).map((f: any) => {
      let type: 'exam_submission' | 'assignment' | 'general' = 'general';
      let title: string | undefined;
      let studentName: string | undefined;

      if (f.name.startsWith('[Hasil_Ujian]')) {
        type = 'exam_submission';
        const parts = f.name.replace('[Hasil_Ujian]_', '').replace('.json', '').split('_');
        if (parts.length >= 2) {
          title = parts[0];
          studentName = parts[1];
        }
      } else if (f.name.startsWith('[Tugas]')) {
        type = 'assignment';
        const parts = f.name.replace('[Tugas]_', '').replace('.json', '').split('_');
        if (parts.length >= 1) {
          title = parts[0];
        }
      }

      return {
        ...f,
        type,
        title,
        studentName
      };
    });

    return { success: true, files };
  } catch (error: any) {
    return { success: false, files: [], error: error.message };
  }
};

/**
 * Upload or update an exam submission into the dedicated Google Drive folder (In-place update if existing)
 */
export const syncExamSubmissionToDrive = async (
  folderId: string,
  submission: any,
  assignmentTitle?: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token Google tidak tersedia' };

  try {
    const safeStudentName = (submission.studentName || 'Siswa').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTitle = (assignmentTitle || submission.assignmentId || 'Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `[Hasil_Ujian]_${safeTitle}_${safeStudentName}_${submission.id}.json`;

    const payload = {
      lmsSyncType: 'EXAM_SUBMISSION_RESULT',
      syncedAt: new Date().toISOString(),
      assignmentId: submission.assignmentId,
      assignmentTitle: assignmentTitle || 'Ujian Terjadwal',
      submissionId: submission.id,
      studentId: submission.studentId,
      studentName: submission.studentName,
      submittedAt: submission.submittedAt,
      status: submission.status,
      totalAiScore: submission.totalAiScore,
      totalTeacherScore: submission.totalTeacherScore,
      finalEffectiveScore: submission.totalTeacherScore !== undefined ? submission.totalTeacherScore : submission.totalAiScore,
      aiOverallFeedback: submission.aiOverallFeedback,
      teacherOverallFeedback: submission.teacherOverallFeedback,
      approvedBy: submission.approvedBy,
      approvedAt: submission.approvedAt,
      sebViolations: submission.sebViolations || [],
      answersCount: (submission.answers || []).length,
      answers: submission.answers || []
    };

    const fileContent = JSON.stringify(payload, null, 2);

    // Check if file already exists in folder
    const searchQ = encodeURIComponent(`'${folderId}' in parents and name = '${fileName}' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${searchQ}&fields=files(id,webViewLink)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let existingFileId: string | null = null;
    let existingWebLink: string | undefined;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
        existingWebLink = searchData.files[0].webViewLink;
      }
    }

    if (existingFileId) {
      // In-place update existing file content
      const patchRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: fileContent
      });

      if (!patchRes.ok) {
        throw new Error(`Gagal memperbarui berkas di Drive (${patchRes.status})`);
      }

      return { success: true, fileId: existingFileId, webViewLink: existingWebLink };
    } else {
      // Create new file inside folder
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
        description: `Hasil evaluasi ujian siswa: ${submission.studentName} (${assignmentTitle || submission.assignmentId})`
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!createRes.ok) {
        throw new Error(`Gagal mengunggah hasil ujian ke Drive (${createRes.status})`);
      }

      const created = await createRes.json();
      return { success: true, fileId: created.id, webViewLink: created.webViewLink };
    }
  } catch (error: any) {
    console.error('syncExamSubmissionToDrive error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload or update an assignment into the dedicated Google Drive folder
 */
export const syncAssignmentToDrive = async (
  folderId: string,
  assignment: any
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token tidak tersedia' };

  try {
    const safeTitle = (assignment.title || assignment.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `[Tugas]_${safeTitle}_${assignment.id}.json`;

    const payload = {
      lmsSyncType: 'ASSIGNMENT_SPECIFICATION',
      syncedAt: new Date().toISOString(),
      assignmentId: assignment.id,
      title: assignment.title,
      courseId: assignment.courseId,
      courseTitle: assignment.courseTitle,
      durationMinutes: assignment.durationMinutes,
      maxViolations: assignment.maxViolations,
      dueDate: assignment.dueDate,
      questionsCount: (assignment.questions || []).length,
      questions: assignment.questions || []
    };

    const fileContent = JSON.stringify(payload, null, 2);

    const searchQ = encodeURIComponent(`'${folderId}' in parents and name = '${fileName}' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${searchQ}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let existingFileId: string | null = null;
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        existingFileId = data.files[0].id;
      }
    }

    if (existingFileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: fileContent
      });
      return { success: true, fileId: existingFileId };
    } else {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
        description: `Spesifikasi tugas & kuis: ${assignment.title}`
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      const created = await res.json();
      return { success: true, fileId: created.id };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute Two-Way Synchronization:
 * - Direction 1: Push local submissions & assignments to dedicated Google Drive folder
 * - Direction 2: Pull & reconcile files from Google Drive folder back into local state
 */
export const executeTwoWayDriveSync = async (
  localSubmissions: any[],
  localAssignments: any[],
  folderName = DEDICATED_DRIVE_FOLDER_NAME
): Promise<{
  success: boolean;
  folder?: DedicatedFolderInfo;
  pushedCount: number;
  pulledCount: number;
  mergedSubmissions: any[];
  mergedAssignments: any[];
  error?: string;
}> => {
  // Step 1: Ensure folder exists
  const folderRes = await getOrCreateDedicatedFolder(folderName);
  if (!folderRes.success || !folderRes.folder) {
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      mergedSubmissions: localSubmissions,
      mergedAssignments: localAssignments,
      error: folderRes.error || 'Gagal mengakses folder Google Drive'
    };
  }

  const folder = folderRes.folder;
  let pushedCount = 0;
  let pulledCount = 0;

  // Step 2: Push local submissions to Drive
  for (const sub of localSubmissions) {
    const matchedAssignment = localAssignments.find(a => a.id === sub.assignmentId);
    const pushRes = await syncExamSubmissionToDrive(folder.id, sub, matchedAssignment?.title);
    if (pushRes.success) {
      pushedCount++;
    }
  }

  // Step 3: Push local assignments to Drive
  for (const asg of localAssignments) {
    const pushAsgRes = await syncAssignmentToDrive(folder.id, asg);
    if (pushAsgRes.success) {
      pushedCount++;
    }
  }

  // Step 4: Pull from Drive & reconcile (Direction 2: Drive -> Local)
  const listRes = await listFilesInDedicatedFolder(folder.id);
  const updatedSubmissions = [...localSubmissions];
  const updatedAssignments = [...localAssignments];

  if (listRes.success && listRes.files.length > 0) {
    for (const driveFile of listRes.files) {
      try {
        const fileDataRes = await downloadGoogleDriveBackup(driveFile.id);
        if (fileDataRes.success && fileDataRes.data) {
          const item = fileDataRes.data;

          // Reconcile Submission
          if (item.lmsSyncType === 'EXAM_SUBMISSION_RESULT' && item.submissionId) {
            const existingIdx = updatedSubmissions.findIndex(s => s.id === item.submissionId);
            if (existingIdx >= 0) {
              // Update with newest teacher review or scores if present
              const existing = updatedSubmissions[existingIdx];
              if (item.approvedAt && !existing.approvedAt) {
                updatedSubmissions[existingIdx] = { ...existing, ...item, id: item.submissionId };
                pulledCount++;
              }
            } else {
              // New submission pulled from Drive
              updatedSubmissions.unshift({
                id: item.submissionId,
                assignmentId: item.assignmentId,
                courseId: 'crs-mat-12',
                studentId: item.studentId,
                studentName: item.studentName,
                submittedAt: item.submittedAt || driveFile.modifiedTime || new Date().toLocaleString('id-ID'),
                status: item.status || 'published',
                answers: item.answers || [],
                sebViolations: item.sebViolations || [],
                totalAiScore: item.totalAiScore || 80,
                totalTeacherScore: item.totalTeacherScore,
                aiOverallFeedback: item.aiOverallFeedback || 'Disinkronkan dari Google Drive',
                teacherOverallFeedback: item.teacherOverallFeedback,
                approvedBy: item.approvedBy,
                approvedAt: item.approvedAt
              });
              pulledCount++;
            }
          }

          // Reconcile Assignment
          if (item.lmsSyncType === 'ASSIGNMENT_SPECIFICATION' && item.assignmentId) {
            const existingAsgIdx = updatedAssignments.findIndex(a => a.id === item.assignmentId);
            if (existingAsgIdx < 0) {
              updatedAssignments.push({
                id: item.assignmentId,
                title: item.title,
                courseId: item.courseId || 'crs-mat-12',
                courseTitle: item.courseTitle || 'Matematika Peminatan',
                durationMinutes: item.durationMinutes || 30,
                maxViolations: item.maxViolations || 3,
                dueDate: item.dueDate || '2026-10-31',
                questions: item.questions || []
              });
              pulledCount++;
            }
          }
        }
      } catch (err) {
        console.warn('Error downloading single file in two-way sync:', err);
      }
    }
  }

  return {
    success: true,
    folder,
    pushedCount,
    pulledCount,
    mergedSubmissions: updatedSubmissions,
    mergedAssignments: updatedAssignments
  };
};

/* =====================================================================
   2. GOOGLE CALENDAR INTEGRATION
   ===================================================================== */

export const listGoogleCalendarEvents = async (): Promise<{ success: boolean; events: GoogleCalendarEvent[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, events: [], error: 'Token tidak tersedia' };
  }

  try {
    const now = new Date();
    const minTime = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(minTime)}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal mengambil agenda Calendar (${response.status})`);
    }

    const data = await response.json();
    return { success: true, events: data.items || [] };
  } catch (error: any) {
    console.error('listGoogleCalendarEvents error:', error);
    return { success: false, events: [], error: error.message || 'Gagal membaca agenda Google Calendar' };
  }
};

export const createGoogleCalendarEvent = async (
  eventData: GoogleCalendarEventInput
): Promise<{ success: boolean; event?: GoogleCalendarEvent; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token tidak tersedia' };
  }

  try {
    const startDateStr = eventData.date;
    const startTimeStr = eventData.startTime || '08:00';
    const endTimeStr = eventData.endTime || '10:00';

    const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
    const endDateTime = new Date(`${startDateStr}T${endTimeStr}:00`).toISOString();

    const body = {
      summary: eventData.summary,
      description: `${eventData.description || ''}\n\n[Disinkronkan otomatis dari Cakrawala LMS]`,
      location: eventData.location || 'Cakrawala LMS Online Class',
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal membuat agenda Google Calendar (${response.status})`);
    }

    const created = await response.json();
    return { success: true, event: created };
  } catch (error: any) {
    console.error('createGoogleCalendarEvent error:', error);
    return { success: false, error: error.message || 'Gagal menambahkan agenda ke Google Calendar' };
  }
};

export const syncBatchToGoogleCalendar = async (
  events: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    startTime?: string;
    endTime?: string;
    category: string;
    targetClass?: string;
  }>
): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, syncedCount: 0, error: 'Token tidak tersedia' };
  }

  let count = 0;
  try {
    for (const ev of events) {
      const categoryTag = ev.category.toUpperCase();
      const summary = `[${categoryTag}] ${ev.title} (${ev.targetClass || 'Semua Kelas'})`;
      const res = await createGoogleCalendarEvent({
        summary,
        description: ev.description,
        location: `Kelas: ${ev.targetClass || 'Semua Kelas'} - Cakrawala LMS`,
        date: ev.date,
        startTime: ev.startTime || '08:00',
        endTime: ev.endTime || '10:00'
      });
      if (res.success) {
        count++;
      }
    }
    return { success: true, syncedCount: count };
  } catch (error: any) {
    return { success: count > 0, syncedCount: count, error: error.message };
  }
};

/* =====================================================================
   3. GOOGLE SHEETS INTEGRATION
   ===================================================================== */

export const createGoogleSheet = async (
  title: string,
  initialRows?: string[][]
): Promise<{ success: boolean; spreadsheet?: GoogleSheetData; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia. Silakan hubungkan akun Google Anda.' };
  }

  try {
    const body = {
      properties: {
        title: title || `Cakrawala LMS Rekap Nilai - ${new Date().toLocaleDateString('id-ID')}`
      }
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat Google Sheet (${response.status})`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // If initial rows provided, append them
    if (initialRows && initialRows.length > 0) {
      await appendGoogleSheetValues(spreadsheetId, 'Sheet1!A1', initialRows);
    }

    return {
      success: true,
      spreadsheet: {
        spreadsheetId,
        title,
        spreadsheetUrl
      }
    };
  } catch (error: any) {
    console.error('createGoogleSheet error:', error);
    return { success: false, error: error.message || 'Gagal membuat Google Sheets' };
  }
};

export const appendGoogleSheetValues = async (
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<{ success: boolean; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia' };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menulis data ke Google Sheet (${response.status})`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('appendGoogleSheetValues error:', error);
    return { success: false, error: error.message || 'Gagal menyimpan nilai ke Google Sheet' };
  }
};

export const getGoogleSheetValues = async (
  spreadsheetId: string,
  range: string
): Promise<{ success: boolean; values?: string[][]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token tidak tersedia' };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membaca sheet (${response.status})`);
    }

    const data = await response.json();
    return { success: true, values: data.values || [] };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membaca isi Google Sheet' };
  }
};

/* =====================================================================
   4. GMAIL INTEGRATION
   ===================================================================== */

/**
 * Send an email via Gmail API
 */
export const sendGmailMessage = async (
  to: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia. Hubungkan akun Google terlebih dahulu.' };
  }

  try {
    // Construct standard RFC 2822 email format
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
      '',
      '---',
      'Dikirim secara resmi melalui Sistem Pembelajaran Terpadu Cakrawala LMS'
    ];

    const rawMessage = messageParts.join('\r\n');
    // Base64URL encode
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengirim email Gmail (${response.status})`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('sendGmailMessage error:', error);
    return { success: false, error: error.message || 'Gagal mengirim pesan melalui Gmail' };
  }
};

export const listRecentGmailMessages = async (
  maxResults = 10
): Promise<{ success: boolean; messages: any[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, messages: [], error: 'Token tidak tersedia' };

  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Gagal membaca kotak masuk Gmail');
    }

    const data = await response.json();
    return { success: true, messages: data.messages || [] };
  } catch (error: any) {
    return { success: false, messages: [], error: error.message };
  }
};

/* =====================================================================
   5. GOOGLE DOCS INTEGRATION
   ===================================================================== */

export const createGoogleDoc = async (
  title: string,
  content?: string
): Promise<{ success: boolean; document?: GoogleDocData; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia.' };
  }

  try {
    // 1. Create document
    const response = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat Google Doc (${response.status})`);
    }

    const doc = await response.json();
    const documentId = doc.documentId;

    // 2. Insert initial content if provided
    if (content && content.trim() !== '') {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `${content}\n\n[Dibuat melalui Cakrawala LMS - ${new Date().toLocaleString('id-ID')}]\n`
              }
            }
          ]
        })
      });
    }

    return {
      success: true,
      document: {
        documentId,
        title,
        webViewLink: `https://docs.google.com/document/d/${documentId}/edit`
      }
    };
  } catch (error: any) {
    console.error('createGoogleDoc error:', error);
    return { success: false, error: error.message || 'Gagal membuat Google Docs' };
  }
};

export const getGoogleDocContent = async (
  documentId: string
): Promise<{ success: boolean; title?: string; bodyText?: string; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token tidak tersedia' };

  try {
    const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil isi Google Doc');
    }

    const data = await response.json();
    let text = '';
    data.body?.content?.forEach((element: any) => {
      element.paragraph?.elements?.forEach((el: any) => {
        if (el.textRun?.content) text += el.textRun.content;
      });
    });

    return { success: true, title: data.title, bodyText: text };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/* =====================================================================
   6. GOOGLE FORMS INTEGRATION
   ===================================================================== */

export const createGoogleForm = async (
  title: string,
  description?: string,
  questions?: Array<{ title: string; options?: string[] }>
): Promise<{ success: boolean; form?: GoogleFormData; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia.' };
  }

  try {
    // 1. Create empty form
    const response = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat Google Form (${response.status})`);
    }

    const createdForm = await response.json();
    const formId = createdForm.formId;
    const safeFormId = encodeURIComponent(formId.trim());

    // 2. Add description and questions if provided via batchUpdate
    const requests: any[] = [];
    if (description) {
      requests.push({
        updateFormInfo: {
          info: { description },
          updateMask: 'description'
        }
      });
    }

    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        const item: any = {
          title: q.title,
          questionItem: {
            question: {
              required: true
            }
          }
        };

        if (q.options && q.options.length > 0) {
          item.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: q.options.map(opt => ({ value: opt }))
          };
        } else {
          item.questionItem.question.textQuestion = {
            paragraph: true
          };
        }

        requests.push({
          createItem: {
            item,
            location: { index: idx }
          }
        });
      });
    }

    if (requests.length > 0) {
      await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
    }

    return {
      success: true,
      form: {
        formId,
        title,
        responderUri: createdForm.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`
      }
    };
  } catch (error: any) {
    console.error('createGoogleForm error:', error);
    return { success: false, error: error.message || 'Gagal membuat Google Forms' };
  }
};

export const getGoogleForm = async (
  formId: string
): Promise<{ success: boolean; form?: any; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token tidak tersedia' };

  try {
    const safeFormId = encodeURIComponent(formId.trim());
    const response = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Gagal membaca Google Form (${response.status})`);
    }

    const data = await response.json();
    return { success: true, form: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getGoogleFormResponses = async (
  formId: string
): Promise<{ success: boolean; responses?: any[]; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token tidak tersedia' };

  try {
    const safeFormId = encodeURIComponent(formId.trim());
    const response = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}/responses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Gagal membaca respon formulir (${response.status})`);
    }

    const data = await response.json();
    return { success: true, responses: data.responses || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/* =====================================================================
   7. GOOGLE MEET INTEGRATION
   ===================================================================== */

export const createGoogleMeetSpace = async (): Promise<{ success: boolean; meet?: GoogleMeetData; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia.' };
  }

  try {
    const response = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat ruang Google Meet (${response.status})`);
    }

    const data = await response.json();
    const meetingUri = data.meetingUri || `https://meet.google.com/${data.meetingCode || 'new'}`;
    const meetingCode = data.meetingCode || meetingUri.replace('https://meet.google.com/', '');

    return {
      success: true,
      meet: {
        meetingUri,
        meetingCode,
        spaceName: data.name || 'Ruang Kelas Google Meet Cakrawala LMS'
      }
    };
  } catch (error: any) {
    console.error('createGoogleMeetSpace error:', error);
    return { success: false, error: error.message || 'Gagal membuat ruang Google Meet' };
  }
};

/* =====================================================================
   8. GOOGLE SLIDES INTEGRATION
   ===================================================================== */

export const createGoogleSlidePresentation = async (
  title: string,
  slides?: Array<{ title: string; subtitle?: string; bulletPoints?: string[] }>
): Promise<{ success: boolean; presentation?: GoogleSlideData; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia. Hubungkan akun Google terlebih dahulu.' };
  }

  try {
    // 1. Create blank presentation
    const response = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: title || 'Cakrawala LMS Slide Presentasi' })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat presentasi Google Slides (${response.status})`);
    }

    const data = await response.json();
    const presentationId = data.presentationId;

    // 2. Add slide items if provided
    if (slides && slides.length > 0) {
      const requests: any[] = [];
      slides.forEach((_slide) => {
        const slideId = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: {
              predefinedLayout: 'TITLE_AND_BODY'
            }
          }
        });
      });

      if (requests.length > 0) {
        await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });
      }
    }

    return {
      success: true,
      presentation: {
        presentationId,
        title,
        webViewLink: `https://docs.google.com/presentation/d/${presentationId}/edit`,
        slidesCount: (slides?.length || 0) + 1
      }
    };
  } catch (error: any) {
    console.error('createGoogleSlidePresentation error:', error);
    return { success: false, error: error.message || 'Gagal membuat presentasi Google Slides' };
  }
};

export const getGoogleSlidePresentation = async (
  presentationId: string
): Promise<{ success: boolean; presentation?: any; error?: string }> => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Token tidak tersedia' };

  try {
    const res = await fetch(`https://slides.googleapis.com/v1/presentations/${encodeURIComponent(presentationId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Gagal membaca presentasi (${res.status})`);
    const data = await res.json();
    return { success: true, presentation: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/* =====================================================================
   9. GOOGLE PICKER INTEGRATION
   ===================================================================== */

let isGooglePickerLoaded = false;

export const loadGooglePickerScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).google?.picker) {
      isGooglePickerLoaded = true;
      return resolve(true);
    }
    if (isGooglePickerLoaded) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).gapi) {
        (window as any).gapi.load('picker', () => {
          isGooglePickerLoaded = true;
          resolve(true);
        });
      } else {
        resolve(false);
      }
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openGooglePicker = async (options: {
  onPicked: (file: PickedGoogleFile) => void;
  onCancel?: () => void;
  viewType?: 'all' | 'docs' | 'sheets' | 'slides' | 'forms';
}): Promise<{ success: boolean; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak tersedia. Hubungkan akun Google terlebih dahulu.' };
  }

  await loadGooglePickerScript();

  const google = (window as any).google;
  if (!google?.picker) {
    return { success: false, error: 'Pustaka Google Picker belum berhasil dimuat pada peramban.' };
  }

  try {
    const pickerOrigin =
      window.location.ancestorOrigins &&
      window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const builder = new google.picker.PickerBuilder();

    if (options.viewType === 'docs') {
      builder.addView(new google.picker.DocsView(google.picker.ViewId.DOCUMENTS));
    } else if (options.viewType === 'sheets') {
      builder.addView(new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS));
    } else if (options.viewType === 'slides') {
      builder.addView(new google.picker.DocsView(google.picker.ViewId.PRESENTATIONS));
    } else if (options.viewType === 'forms') {
      builder.addView(new google.picker.DocsView(google.picker.ViewId.FORMS));
    } else {
      builder.addView(google.picker.ViewId.DOCS);
    }

    builder.setOAuthToken(token);
    builder.setOrigin(pickerOrigin);
    builder.setCallback((data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const doc = data.docs && data.docs[0];
        if (doc) {
          options.onPicked({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
            iconUrl: doc.iconUrl,
            sizeBytes: doc.sizeBytes
          });
        }
      } else if (data.action === google.picker.Action.CANCEL) {
        if (options.onCancel) options.onCancel();
      }
    });

    const picker = builder.build();
    picker.setVisible(true);
    return { success: true };
  } catch (error: any) {
    console.error('openGooglePicker error:', error);
    return { success: false, error: error.message || 'Gagal membuka Google Picker' };
  }
};

