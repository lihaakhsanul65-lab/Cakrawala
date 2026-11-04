import { User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'Administrator Utama',
    email: 'admin@cakrawala.sch.id',
    secondaryEmail: 'mathmateai.123@gmail.com',
    role: 'admin',
    identifierNumber: '198501152010011002',
    phone: '081234567890',
    institution: 'SMA Cakrawala Nusantara',
    createdAt: '2026-01-01',
    googleId: 'goog-mathmateai',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'usr-guru-01',
    name: 'Drs. Bambang Suryono, M.Pd',
    email: 'bambang@cakrawala.sch.id',
    secondaryEmail: 'lihaakhsanul6@gmail.com',
    role: 'guru',
    identifierNumber: '197604212003121004',
    isWaliKelas: true,
    kelasBimbingan: '12-MIPA-1',
    phone: '081398765432',
    institution: 'SMA Cakrawala Nusantara',
    createdAt: '2026-01-05',
    googleId: 'goog-liha6',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'usr-guru-02',
    name: 'Siti Nurhaliza, S.Pd',
    email: 'siti@cakrawala.sch.id',
    role: 'guru',
    identifierNumber: '198809122015022001',
    isWaliKelas: false,
    phone: '081211223344',
    institution: 'SMA Cakrawala Nusantara',
    createdAt: '2026-01-10',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'usr-siswa-01',
    name: 'Arya Pratama',
    email: 'arya@siswa.cakrawala.sch.id',
    secondaryEmail: 'lihaakhsanul65@gmail.com',
    role: 'siswa',
    identifierNumber: '0071829384',
    kelasBimbingan: '12-MIPA-1',
    institution: 'SMA Cakrawala Nusantara',
    createdAt: '2026-02-01',
    googleId: 'goog-liha65',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'usr-siswa-02',
    name: 'Nabila Putri Larasati',
    email: 'nabila@siswa.cakrawala.sch.id',
    role: 'siswa',
    identifierNumber: '0071829385',
    kelasBimbingan: '12-MIPA-1',
    institution: 'SMA Cakrawala Nusantara',
    createdAt: '2026-02-01',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80'
  }
];

export const AVAILABLE_CLASSES = [
  '10-MIPA-1',
  '10-MIPA-2',
  '10-IPS-1',
  '11-MIPA-1',
  '11-MIPA-2',
  '11-IPS-1',
  '12-MIPA-1',
  '12-MIPA-2',
  '12-IPS-1'
];

import { Course } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-mat-12',
    code: 'MAT-12-MIPA',
    title: 'Matematika Peminatan Kelas XII',
    category: 'MIPA / Sains',
    description: 'Kalkulus lanjut mencakup limit fungsi trigonometri, turunan trigonometri, serta aplikasi nilai stasioner dan integral tentu.',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    targetClass: '12-MIPA-1',
    enrollmentKey: 'MIPA12',
    bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    enrolledStudentIds: ['usr-siswa-01', 'usr-siswa-02'],
    createdAt: '2026-08-25',
    sections: [
      {
        id: 'sec-mat-w1',
        courseId: 'crs-mat-12',
        weekNumber: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        title: 'Minggu 1: Konsep & Sifat Limit Fungsi Trigonometri',
        description: 'Pemahaman dasar limit sinus, kosinus, tangen menuju titik tertentu dan pembuktian rumus dasar lim x->0 (sin x / x) = 1.',
        resources: [
          {
            id: 'res-mat-01',
            sectionId: 'sec-mat-w1',
            title: 'Diktat Kuliah: Rangkuman Teorema Limit Trigonometri',
            type: 'pdf',
            content: 'Dokumen panduan resmi materi bab 1 limit trigonometri lengkap dengan 25 contoh soal dan pembahasan.',
            fileUrl: 'https://example.com/diktat-limit-trigonometri.pdf',
            completedByStudentIds: ['usr-siswa-01'],
            createdAt: '2026-09-01'
          },
          {
            id: 'res-mat-02',
            sectionId: 'sec-mat-w1',
            title: 'Video Pembahasan: Trik Cepat Sifat Aljabar Trigonometri',
            type: 'video',
            content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            completedByStudentIds: ['usr-siswa-01', 'usr-siswa-02'],
            createdAt: '2026-09-02'
          },
          {
            id: 'res-mat-03',
            sectionId: 'sec-mat-w1',
            title: 'Catatan Kuliah Dosen: Rumus Sudut Ganda & Identitas',
            type: 'text',
            content: 'Ingat: sin 2x = 2 sin x cos x; cos 2x = 1 - 2 sin^2 x. Jika menjumpai (1 - cos ax), ubah ke 2 sin^2(ax/2).',
            completedByStudentIds: ['usr-siswa-01'],
            createdAt: '2026-09-03'
          }
        ]
      },
      {
        id: 'sec-mat-w2',
        courseId: 'crs-mat-12',
        weekNumber: 2,
        startDate: '2026-09-08',
        endDate: '2026-09-14',
        title: 'Minggu 2: Turunan Fungsi Trigonometri & Aturan Rantai',
        description: 'Penerapan konsep turunan implisit dan aturan rantai Leibniz pada fungsi trigonometri majemuk.',
        resources: [
          {
            id: 'res-mat-04',
            sectionId: 'sec-mat-w2',
            title: 'Modul PDF: Aturan Rantai dy/dx = dy/du * du/dx',
            type: 'pdf',
            content: 'Latihan mandiri 15 soal turunan bertingkat untuk persiapan ujian.',
            fileUrl: 'https://example.com/modul-rantai-turunan.pdf',
            completedByStudentIds: [],
            createdAt: '2026-09-08'
          },
          {
            id: 'res-mat-05',
            sectionId: 'sec-mat-w2',
            title: 'Tautan Geogebra Interaktif: Visualisasi Garis Singgung Kurva',
            type: 'link',
            content: 'https://www.geogebra.org/m/kalkulus-trigonometri',
            completedByStudentIds: [],
            createdAt: '2026-09-09'
          }
        ]
      },
      {
        id: 'sec-mat-w3',
        courseId: 'crs-mat-12',
        weekNumber: 3,
        startDate: '2026-09-15',
        endDate: '2026-09-21',
        title: 'Minggu 3: Nilai Maksimum, Minimum & Titik Balik Stasioner',
        description: 'Analisis uji turunan pertama dan turunan kedua f\'\'(x) untuk menentukan kecekungan kurva dan nilai ekstrem.',
        resources: [
          {
            id: 'res-mat-06',
            sectionId: 'sec-mat-w3',
            title: 'Ringkasan Teori Titik Stasioner & Uji Turunan Kedua',
            type: 'text',
            content: 'f\'(x) = 0 untuk titik stasioner. Jika f\'\'(x) < 0 maka titik balik maksimum relatif; jika f\'\'(x) > 0 maka minimum.',
            completedByStudentIds: [],
            createdAt: '2026-09-15'
          }
        ]
      }
    ]
  },
  {
    id: 'crs-bindo-12',
    code: 'BINDO-12-UMUM',
    title: 'Bahasa Indonesia: Teks Surat Lamaran & Artikel Opini',
    category: 'Bahasa & Sastra',
    description: 'Penyusunan surat lamaran pekerjaan formal berbasis kaidah EYD V, analisis teks cerita sejarah, dan penulisan artikel ilmiah populer.',
    teacherId: 'usr-guru-02',
    teacherName: 'Siti Nurhaliza, S.Pd',
    targetClass: 'Semua Kelas XII',
    enrollmentKey: '', // Terbuka tanpa kunci
    bannerImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    enrolledStudentIds: ['usr-siswa-01'],
    createdAt: '2026-08-28',
    sections: [
      {
        id: 'sec-bin-w1',
        courseId: 'crs-bindo-12',
        weekNumber: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        title: 'Minggu 1: Sistematika & Kaidah Surat Lamaran Pekerjaan',
        description: 'Menganalisis lampiran, perihal, alamat surat, salam pembuka, isi, dan salam penutup sesuai pedoman tata bahasa resmi.',
        resources: [
          {
            id: 'res-bin-01',
            sectionId: 'sec-bin-w1',
            title: 'Format Standar CV & Surat Lamaran BUMN/Korporat',
            type: 'pdf',
            content: 'Template dokumen resmi format .docx dan .pdf untuk latihan mandiri.',
            fileUrl: 'https://example.com/template-surat-lamaran.pdf',
            completedByStudentIds: ['usr-siswa-01'],
            createdAt: '2026-09-01'
          }
        ]
      },
      {
        id: 'sec-bin-w2',
        courseId: 'crs-bindo-12',
        weekNumber: 2,
        startDate: '2026-09-08',
        endDate: '2026-09-14',
        title: 'Minggu 2: Menulis Artikel Opini & Fakta Objektif',
        description: 'Membedakan opini dan fakta empiris dalam tajuk rencana serta menyusun argumen yang kohesif.',
        resources: [
          {
            id: 'res-bin-02',
            sectionId: 'sec-bin-w2',
            title: 'Panduan Menulis Opini untuk Surat Kabar Nasional',
            type: 'text',
            content: 'Struktur artikel opini terdiri dari tesis, rangkaian argumen pendukung dengan bukti nyata, dan penegasan ulang.',
            completedByStudentIds: [],
            createdAt: '2026-09-08'
          }
        ]
      }
    ]
  }
];

import { Assignment, Submission } from '../types';

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-mat-01',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    title: 'Ujian Blok 1: Kalkulus Lanjut & Limit Trigonometri (Mode Web SEB)',
    description: 'Ujian terintegrasi dengan penguncian layar Safe Exam Browser. Dilarang berpindah tab atau keluar fullscreen selama pengerjaan berlangsung.',
    deadline: '2026-10-25',
    durationMinutes: 30,
    isSebLocked: true,
    maxViolations: 3,
    createdAt: '2026-09-10',
    questions: [
      {
        id: 'q-mat-01',
        type: 'mcq',
        prompt: 'Nilai dari limit trigonometri lim(x -> 0) [sin(6x) / 3x] adalah...',
        points: 20,
        options: ['1/2', '1', '2', '3', '6'],
        correctOptionIndex: 2, // 2
        expectedAnswer: '2'
      },
      {
        id: 'q-mat-02',
        type: 'short',
        prompt: 'Jika f(x) = sin^2(3x), tentukan turunan pertama f\'(x) dalam bentuk perkalian sudut ganda!',
        points: 20,
        expectedAnswer: '3 sin(6x)',
        rubricCriteria: 'Menggunakan aturan rantai: 2 * sin(3x) * 3 * cos(3x) = 3 * (2 sin 3x cos 3x) = 3 sin(6x).'
      },
      {
        id: 'q-mat-03',
        type: 'essay',
        prompt: 'Jelaskan konsep dasar teorema limit trigonometri lim(x -> 0) [tan(x) / x] = 1 dengan menguraikan definisi tan(x) = sin(x)/cos(x) dan sifat perkalian limit!',
        points: 30,
        expectedAnswer: 'tan(x)/x = [sin(x)/x] * [1/cos(x)]. Saat x mendekati 0, lim sin(x)/x = 1 dan lim cos(x) = 1, sehingga 1 * 1 = 1.',
        rubricCriteria: 'Penjelasan harus runtut menyertakan pemecahan tan(x) menjadi sin(x)/cos(x), penerapan limit perkalian terpisah, dan nilai cos(0) = 1.'
      },
      {
        id: 'q-mat-04',
        type: 'image',
        prompt: 'Tuliskan langkah lengkap mencari titik stasioner kurva f(x) = sin(2x) pada interval 0 <= x <= pi di kertas lembar kerja Anda, kemudian ambil foto atau unggah foto lembar kerja tersebut!',
        points: 30,
        expectedAnswer: 'f\'(x) = 2 cos(2x) = 0 => 2x = pi/2 atau 3pi/2 => x = pi/4 dan 3pi/4.',
        rubricCriteria: 'Langkah kerja turunan pertama disamakan dengan 0, penyelesaian sudut kelipatan, dan penentuan titik stasioner x = pi/4 dan 3pi/4 secara tepat.'
      }
    ]
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-demo-01',
    assignmentId: 'asg-mat-01',
    courseId: 'crs-mat-12',
    studentId: 'usr-siswa-01',
    studentName: 'Arya Pratama',
    submittedAt: '2026-10-18 10:15 WIB',
    status: 'ai_graded_waiting_approval', // Menunggu persetujuan guru
    totalAiScore: 88,
    totalTeacherScore: undefined,
    aiOverallFeedback: 'Pemahaman konsep dasar limit dan diferensiasi trigonometri sangat baik. Penjabaran esai runut dan logis. Pada pembuktian kertas kerja, ada sedikit ketidaktelitian penulisan domain.',
    teacherOverallFeedback: '',
    sebViolations: [
      {
        timestamp: '10:04:12 WIB',
        type: 'tab_switch',
        description: 'Siswa sempat berpindah jendela/tab selama 3 detik sebelum kembali ke lembar ujian.'
      }
    ],
    answers: [
      {
        questionId: 'q-mat-01',
        selectedOptionIndex: 2,
        aiScore: 20,
        aiFeedback: 'Jawaban pilihan ganda tepat (Nilai = 2).'
      },
      {
        questionId: 'q-mat-02',
        answerText: '3 sin(6x)',
        aiScore: 20,
        aiFeedback: 'Jawaban isian singkat sempurna sesuai bentuk sudut ganda.'
      },
      {
        questionId: 'q-mat-03',
        answerText: 'tan(x)/x dapat diubah menjadi [sin(x)/cos(x)] * (1/x) = [sin(x)/x] * [1/cos(x)]. Menurut teorema limit, lim sin(x)/x = 1 dan lim 1/cos(x) = 1/1 = 1. Jadi hasilnya 1.',
        aiScore: 28,
        aiFeedback: 'Argumen sangat baik dan runtut. Penjelasan teorema limit perkalian sudah tepat.'
      },
      {
        questionId: 'q-mat-04',
        imageUrls: [
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80'
        ],
        aiScore: 20,
        aiFeedback: 'Langkah diferensiasi f\'(x) = 2 cos(2x) = 0 terbaca jelas pada foto. Solusi x = pi/4 benar, namun penentuan titik stasioner kedua kurang lengkap.'
      }
    ]
  }
];

import { ReportCard, SystemAuditLog } from '../types';

export const INITIAL_REPORT_CARDS: ReportCard[] = [
  {
    id: 'rc-arya-12mipa1',
    studentId: 'usr-siswa-01',
    studentName: 'Arya Pratama',
    nisn: '0071829384',
    kelas: '12-MIPA-1',
    semester: 'Ganjil',
    academicYear: '2026/2027',
    waliKelasName: 'Drs. Bambang Suryono, M.Pd',
    averageScore: 88.8,
    statusKenaikan: 'Naik Kelas',
    homeroomNotes: 'Arya menunjukkan konsistensi belajar yang sangat baik dalam mata pelajaran kalkulus dan sains terapan. Selalu menaati integritas ujian.',
    updatedAt: '2026-10-18',
    grades: [
      {
        courseId: 'crs-mat-12',
        courseTitle: 'Matematika Peminatan Kelas XII',
        score: 92,
        letterGrade: 'A',
        kkm: 75,
        teacherName: 'Drs. Bambang Suryono, M.Pd',
        attendancePercent: 98,
        examIntegrityScore: 90
      },
      {
        courseId: 'crs-bindo-12',
        courseTitle: 'Bahasa Indonesia: Teks Surat & Opini',
        score: 88,
        letterGrade: 'A',
        kkm: 75,
        teacherName: 'Siti Nurhaliza, S.Pd',
        attendancePercent: 100,
        examIntegrityScore: 100
      },
      {
        courseId: 'crs-fis-12',
        courseTitle: 'Fisika Kuantum & Inti XII',
        score: 85,
        letterGrade: 'B',
        kkm: 75,
        teacherName: 'Drs. Bambang Suryono, M.Pd',
        attendancePercent: 95,
        examIntegrityScore: 100
      },
      {
        courseId: 'crs-kim-12',
        courseTitle: 'Kimia Karbon & Biokimia XII',
        score: 90,
        letterGrade: 'A',
        kkm: 75,
        teacherName: 'Ir. Hendra Wijaya',
        attendancePercent: 96,
        examIntegrityScore: 100
      }
    ]
  },
  {
    id: 'rc-nabila-12mipa1',
    studentId: 'usr-siswa-02',
    studentName: 'Nabila Putri Larasati',
    nisn: '0071829385',
    kelas: '12-MIPA-1',
    semester: 'Ganjil',
    academicYear: '2026/2027',
    waliKelasName: 'Drs. Bambang Suryono, M.Pd',
    averageScore: 87.3,
    statusKenaikan: 'Naik Kelas',
    homeroomNotes: 'Nabila sangat aktif dalam diskusi materi dan pengerjaan modul mingguan. Pertahankan kemampuan analisis kritis.',
    updatedAt: '2026-10-18',
    grades: [
      {
        courseId: 'crs-mat-12',
        courseTitle: 'Matematika Peminatan Kelas XII',
        score: 86,
        letterGrade: 'B',
        kkm: 75,
        teacherName: 'Drs. Bambang Suryono, M.Pd',
        attendancePercent: 96,
        examIntegrityScore: 100
      },
      {
        courseId: 'crs-bindo-12',
        courseTitle: 'Bahasa Indonesia: Teks Surat & Opini',
        score: 94,
        letterGrade: 'A',
        kkm: 75,
        teacherName: 'Siti Nurhaliza, S.Pd',
        attendancePercent: 100,
        examIntegrityScore: 100
      },
      {
        courseId: 'crs-fis-12',
        courseTitle: 'Fisika Kuantum & Inti XII',
        score: 82,
        letterGrade: 'B',
        kkm: 75,
        teacherName: 'Drs. Bambang Suryono, M.Pd',
        attendancePercent: 92,
        examIntegrityScore: 100
      },
      {
        courseId: 'crs-kim-12',
        courseTitle: 'Kimia Karbon & Biokimia XII',
        score: 87,
        letterGrade: 'B',
        kkm: 75,
        teacherName: 'Ir. Hendra Wijaya',
        attendancePercent: 95,
        examIntegrityScore: 100
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-10-18 10:15 WIB',
    actorName: 'Arya Pratama',
    actorRole: 'siswa',
    action: 'Penyelesaian Ujian Safe Exam Browser',
    category: 'seb_security',
    details: 'Mengumpulkan Ujian Blok 1 Kalkulus Lanjut. Terdeteksi 1x perpindahan tab selama 3 detik.'
  },
  {
    id: 'log-02',
    timestamp: '2026-10-18 10:16 WIB',
    actorName: 'AI Gemini Evaluator',
    actorRole: 'admin',
    action: 'Koreksi Otomatis AI Gemini',
    category: 'ai_grading',
    details: 'Berhasil menganalisis 4 soal (PG, Isian, Esai, Foto) dengan total rekomendasi skor 88/100.'
  },
  {
    id: 'log-03',
    timestamp: '2026-10-18 10:30 WIB',
    actorName: 'Drs. Bambang Suryono, M.Pd',
    actorRole: 'guru',
    action: 'Verifikasi & Rilis Nilai Resmi',
    category: 'ai_grading',
    details: 'Guru menyetujui rekomendasi nilai AI dan merilis hasil resmi kepada siswa Arya Pratama.'
  },
  {
    id: 'log-04',
    timestamp: '2026-10-18 09:00 WIB',
    actorName: 'Administrator Utama',
    actorRole: 'admin',
    action: 'Pencadangan Sistem Google Drive',
    category: 'backup',
    details: 'Berhasil membuat snapshot cadangan terstruktur format .json (24 objek entitas).'
  }
];

import { ForumTopic } from '../types';

export const INITIAL_FORUMS: ForumTopic[] = [
  {
    id: 'forum-topic-01',
    courseId: 'crs-mat-12',
    title: 'Diskusi: Penerapan Teorema L\'Hopital pada Bentuk Tak Tentu 0/0',
    creatorId: 'usr-siswa-01',
    creatorName: 'Arya Pratama',
    creatorRole: 'siswa',
    createdAt: '2026-10-15 08:30',
    isPinned: true,
    posts: [
      {
        id: 'post-01',
        topicId: 'forum-topic-01',
        courseId: 'crs-mat-12',
        authorId: 'usr-siswa-01',
        authorName: 'Arya Pratama',
        authorRole: 'siswa',
        authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
        content: 'Halo teman-teman dan Pak Bambang, apakah aturan L\'Hopital selalu boleh dipakai ketika limit menghasilkan bentuk tak tentu 0/0 pada fungsi trigonometri majemuk seperti lim x->0 (1 - cos 2x) / (x sin x)? Terima kasih!',
        createdAt: '2026-10-15 08:30'
      },
      {
        id: 'post-02',
        topicId: 'forum-topic-01',
        courseId: 'crs-mat-12',
        authorId: 'usr-guru-01',
        authorName: 'Drs. Bambang Suryono, M.Pd',
        authorRole: 'guru',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        content: 'Bagus sekali pertanyaannya Arya. Boleh digunakan dengan syarat: turunan pembilang dan penyebut kontinu di sekitar titik tersebut, dan f(x)/g(x) memang memenuhi bentuk 0/0 atau tak hingga/tak hingga. Namun untuk fungsi ini, menggunakan identitas 1 - cos 2x = 2 sin^2 x justru seringkali lebih cepat!',
        createdAt: '2026-10-15 09:12'
      },
      {
        id: 'post-03',
        topicId: 'forum-topic-01',
        courseId: 'crs-mat-12',
        authorId: 'ai-asisten-cakrawala',
        authorName: 'Cakrawala AI Tutor (Scaffold)',
        authorRole: 'admin',
        authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
        content: '💡 **Pedagogical Scaffolding Insight:**\nMari kita bedah kedua rute pengerjaan:\n1. **Rute Identitas Aljabar (Disarankan):**\n   1 - cos(2x) = 2 sin²(x)\n   lim x->0 [ 2 sin²(x) / (x · sin x) ] = lim x->0 [ 2 sin(x) / x ] = 2 · 1 = 2.\n2. **Rute L\'Hopital:**\n   Turunan atas: 2 sin(2x)\n   Turunan bawah: sin x + x cos x\n   lim x->0 [ 2 sin(2x) / (sin x + x cos x) ] = 0/0 -> turunkan sekali lagi -> 4 cos(2x) / (cos x + cos x - x sin x) = 4 / 2 = 2.\nKedua cara valid, namun metode identitas meminimalkan risiko kesalahan aljabar!',
        createdAt: '2026-10-15 09:15',
        isAiGenerated: true
      }
    ]
  },
  {
    id: 'forum-topic-02',
    courseId: 'crs-mat-12',
    title: 'Tanya Jawab: Penggunaan Safe Exam Browser untuk Ujian Tengah Semester',
    creatorId: 'usr-siswa-02',
    creatorName: 'Nabila Putri Larasati',
    creatorRole: 'siswa',
    createdAt: '2026-10-17 14:00',
    isPinned: false,
    posts: [
      {
        id: 'post-04',
        topicId: 'forum-topic-02',
        courseId: 'crs-mat-12',
        authorId: 'usr-siswa-02',
        authorName: 'Nabila Putri Larasati',
        authorRole: 'siswa',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
        content: 'Bapak, apakah pada saat ujian Safe Exam Browser nanti kami diperbolehkan mengunggah lebih dari 1 foto untuk lembar kerja esai?',
        createdAt: '2026-10-17 14:00'
      },
      {
        id: 'post-05',
        topicId: 'forum-topic-02',
        courseId: 'crs-mat-12',
        authorId: 'usr-guru-01',
        authorName: 'Drs. Bambang Suryono, M.Pd',
        authorRole: 'guru',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        content: 'Ya, Nabila. Sistem Cakrawala LMS mendukung multi-upload foto lembar kerja sehingga kalian dapat memotret beberapa halaman sekaligus tanpa keluar dari lingkungan aman ujian.',
        createdAt: '2026-10-17 14:20'
      }
    ]
  }
];

import { CalendarEvent, MediaAjarItem, DirectQuiz, DirectQuizSubmission } from '../types';

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-ev-01',
    title: 'Penyerahan Tugas 1: Limit Trigonometri',
    description: 'Batas akhir unggah pengerjaan tugas lembar kerja mandiri modul minggu 1.',
    date: '2026-10-22',
    startTime: '08:00',
    endTime: '23:59',
    category: 'tugas',
    targetClass: '12-MIPA-1',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    creatorId: 'usr-guru-01',
    creatorName: 'Drs. Bambang Suryono, M.Pd',
    creatorRole: 'guru',
    createdAt: '2026-10-15'
  },
  {
    id: 'cal-ev-02',
    title: 'Kuis Harian 1: Konsep Dasar Turunan',
    description: 'Kuis online 20 menit pilihan ganda dan jawaban singkat dengan acak soal otomatis.',
    date: '2026-10-24',
    startTime: '10:00',
    endTime: '11:00',
    category: 'kuis',
    targetClass: '12-MIPA-1',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    creatorId: 'usr-guru-01',
    creatorName: 'Drs. Bambang Suryono, M.Pd',
    creatorRole: 'guru',
    createdAt: '2026-10-16'
  },
  {
    id: 'cal-ev-03',
    title: 'Ujian Blok Safe Exam Browser (SEB)',
    description: 'Ujian formatif semester dengan penguncian layar penuh dan sensor anti-curang.',
    date: '2026-10-28',
    startTime: '07:30',
    endTime: '09:00',
    category: 'ujian',
    targetClass: '12-MIPA-1',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    creatorId: 'usr-guru-01',
    creatorName: 'Drs. Bambang Suryono, M.Pd',
    creatorRole: 'guru',
    createdAt: '2026-10-17'
  },
  {
    id: 'cal-ev-04',
    title: 'Webinar Pembahasan Soal Bersama Guru Pengampu',
    description: 'Pertemuan sinkronus daring via Google Meet untuk bedah soal SBMPTN & UTBK.',
    date: '2026-10-25',
    startTime: '14:00',
    endTime: '15:30',
    category: 'pertemuan',
    targetClass: 'Semua',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    creatorId: 'usr-guru-01',
    creatorName: 'Drs. Bambang Suryono, M.Pd',
    creatorRole: 'guru',
    createdAt: '2026-10-18'
  },
  {
    id: 'cal-ev-05',
    title: 'Rapat Evaluasi Tengah Semester (Dewan Guru)',
    description: 'Agenda institusi evaluasi pencapaian KKM dan rekap kehadiran siswa.',
    date: '2026-10-30',
    startTime: '13:00',
    endTime: '15:00',
    category: 'akademik',
    targetClass: 'Semua',
    creatorId: 'usr-admin-01',
    creatorName: 'Administrator Utama',
    creatorRole: 'admin',
    createdAt: '2026-10-19'
  }
];

export const INITIAL_MEDIA_AJAR: MediaAjarItem[] = [
  {
    id: 'media-01',
    title: 'Video Pembelajaran: Animasi Geometris Limit & Turunan',
    description: 'Visualisasi grafik interaktif konsep laju perubahan sesaat dan gradien garis singgung kurva.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    type: 'video',
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileName: 'animasi_grafik_turunan.mp4',
    fileSize: '14.2 MB',
    order: 1,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-12'
  },
  {
    id: 'media-02',
    title: 'Buku Ajar Digital: Modul Lengkap Kalkulus Diferensial SMA',
    description: 'Dokumen panduan referensi utama kurikulum merdeka materi turunan trigonometri tingkat lanjut.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    type: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'modul_kalkulus_kelas12.pdf',
    fileSize: '3.8 MB',
    order: 2,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-14'
  },
  {
    id: 'media-03',
    title: 'Podcast Audio Penjelasan: Tips Trik Menghafal Rumus Sudut Ganda',
    description: 'Rekaman audio pembahasan singkat 10 menit untuk mempermudah mengingat identitas trigonometri.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    type: 'audio',
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    fileName: 'podcast_trik_trigonometri.mp3',
    fileSize: '4.5 MB',
    order: 3,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-15'
  },
  {
    id: 'media-04',
    title: 'Infografis Ringkasan: Peta Konsep Rumus Aturan Rantai',
    description: 'Poster grafik berwarna formula Leibniz dan turunan fungsi komposisi berderajat tinggi.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    type: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    fileName: 'peta_konsep_aturan_rantai.png',
    fileSize: '1.2 MB',
    order: 4,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-16'
  },
  {
    id: 'media-05',
    title: 'Tautan Laboratorium Visual GeoGebra Interaktif',
    description: 'Eksplorasi kurva sinus dan kosinus secara dinamik dengan mengubah parameter amplitudo dan periode.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    type: 'link',
    fileUrl: 'https://www.geogebra.org/m/mkvg2e4k',
    order: 5,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-17'
  }
];

export const INITIAL_DIRECT_QUIZZES: DirectQuiz[] = [
  {
    id: 'quiz-01',
    title: 'Kuis Diagnostik & Latihan Mandiri: Limit dan Kontinuitas',
    description: 'Kuis interaktif berbasis kompetensi dasar dengan penilaian otomatis dan rekomendasi umpan balik.',
    courseId: 'crs-mat-12',
    courseTitle: 'Matematika Peminatan Kelas XII',
    targetClass: '12-MIPA-1',
    durationMinutes: 25,
    status: 'published',
    teacherId: 'usr-guru-01',
    teacherName: 'Drs. Bambang Suryono, M.Pd',
    createdAt: '2026-10-18',
    questions: [
      {
        id: 'q-dq-01',
        type: 'mcq',
        prompt: 'Berapakah nilai dari limit lim(x -> 0) [ sin(4x) / (2x) ]?',
        points: 25,
        options: ['1', '2', '4', '0.5'],
        correctOptionIndex: 1
      },
      {
        id: 'q-dq-02',
        type: 'true_false',
        prompt: 'Pernyataan: "Jika f(x) kontinu di x = c, maka f(x) pasti memiliki turunan f\'(c)."',
        points: 25,
        correctBoolean: false,
        expectedAnswer: 'Palsu / Salah (contoh fungsi f(x) = |x| kontinu di 0 namun tidak memiliki turunan karena titik sudut tajam).'
      },
      {
        id: 'q-dq-03',
        type: 'numeric',
        prompt: 'Hitunglah nilai numerik dari f\'(1) jika f(x) = 3x² + 5x - 7.',
        points: 25,
        expectedAnswer: '11',
        rubricCriteria: 'f\'(x) = 6x + 5. Maka f\'(1) = 6(1) + 5 = 11.'
      },
      {
        id: 'q-dq-04',
        type: 'essay',
        prompt: 'Jelaskan mengapa aturan rantai (chain rule) diperlukan saat mencari turunan fungsi y = sin(x² + 3), dan tuliskan hasil akhirnya!',
        points: 25,
        expectedAnswer: 'Karena y adalah fungsi komposisi (fungsi luar sin u, fungsi dalam u = x^2 + 3). Hasil: y\' = 2x cos(x² + 3).',
        rubricCriteria: 'Penjelasan konsep fungsi komposisi (10 poin) dan ketepatan turunan (15 poin).'
      }
    ]
  }
];

export const INITIAL_DIRECT_QUIZ_SUBMISSIONS: DirectQuizSubmission[] = [
  {
    id: 'sub-dq-01',
    quizId: 'quiz-01',
    quizTitle: 'Kuis Diagnostik & Latihan Mandiri: Limit dan Kontinuitas',
    studentId: 'usr-siswa-01',
    studentName: 'Arya Pratama',
    studentClass: '12-MIPA-1',
    submittedAt: '2026-10-19 10:15 WIB',
    totalScore: 90,
    maxScore: 100,
    status: 'reviewed',
    teacherFeedback: 'Sangat baik! Penguasaan konsep fungsi komposisi dan limit trigonometri sudah kuat.',
    answers: [
      {
        questionId: 'q-dq-01',
        selectedOptionIndex: 1,
        isAutoGraded: true,
        earnedPoints: 25
      },
      {
        questionId: 'q-dq-02',
        selectedBoolean: false,
        isAutoGraded: true,
        earnedPoints: 25
      },
      {
        questionId: 'q-dq-03',
        numericAnswer: 11,
        textAnswer: '11',
        isAutoGraded: true,
        earnedPoints: 25
      },
      {
        questionId: 'q-dq-04',
        textAnswer: 'Aturan rantai diperlukan karena sin(x^2 + 3) adalah fungsi komposisi di mana argumen sinus bukan hanya x tunggal melainkan ekspresi x^2 + 3. Turunan luarnya adalah cos(x^2 + 3) dan turunan dalamnya 2x. Jadi hasil akhirnya 2x cos(x^2 + 3).',
        earnedPoints: 15,
        teacherNotes: 'Jawaban runtut dan benar.'
      }
    ]
  }
];


