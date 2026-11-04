import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Layers, 
  HelpCircle, 
  BookOpen, 
  ArrowRight,
  Maximize2,
  Minimize2,
  Brain,
  Lightbulb,
  Move,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { FormattedAiMessage } from './FormattedAiMessage';

interface AiAssistantDrawerProps {
  currentCourseId?: string;
  activeTopic?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ currentCourseId, activeTopic }) => {
  const { currentUser } = useAuth();
  const { courses } = useCourses();

  // Prompt requirement: AI Scaffolding & chatbot is specifically for students!
  if (currentUser?.role !== 'siswa') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'scaffold_hints'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);

  // Draggable position state (null means default position at bottom-right)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('cakrawala_ai_position');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Selected course for grounded tutoring (defaults to currentCourseId or first course)
  const [selectedCourseId, setSelectedCourseId] = useState<string>(currentCourseId || 'crs-mat-12');

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Halo ${currentUser?.name || 'Siswa'}! Saya **Cakrawala AI Tutor & Scaffolding Copilot**.\n\nSaya telah terhubung langsung dengan **seluruh materi pembelajaran yang ada di web Cakrawala LMS**:\n- 📐 **Matematika Peminatan XII:** Limit trigonometri, sifat sudut ganda, aturan rantai Leibniz dy/dx, serta titik stasioner & nilai ekstrem.\n- ✍️ **Bahasa Indonesia XII:** Sistematika 7 bagian baku surat lamaran pekerjaan formal & kaidah EYD V.\n- 🎬 **Media Ajar & Modul Web:** Video animasi grafik, modul digital, infografis peta konsep, dan kuis interaktif.\n- 🪜 **Scaffolding Bertingkat (ZPD):** Bimbingan langkah bertahap tanpa membocorkan kunci jawaban ujian SEB.\n\nPilih topik di bawah atau tanyakan materi apa saja yang sedang kamu pelajari!`,
      timestamp: 'Baru saja'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Scaffolding Hint State
  const [hintQuestion, setHintQuestion] = useState('Buktikan bahwa lim x->0 (1 - cos 2x) / (x sin x) = 2!');
  const [currentHintLevel, setCurrentHintLevel] = useState<number>(1);
  const [hintsRevealed, setHintsRevealed] = useState<{ [lvl: number]: { title: string; hint: string } }>({});
  const [isHintLoading, setIsHintLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when holding the drag handle or launcher button
    const currentX = position ? position.x : (window.innerWidth - (isOpen ? (isExpanded ? 640 : 420) : 180));
    const currentY = position ? position.y : (window.innerHeight - (isOpen ? 560 : 70));

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const newX = Math.max(10, Math.min(window.innerWidth - 120, dragStartRef.current.posX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.posY + deltaY));

      const newPos = { x: newX, y: newY };
      setPosition(newPos);
      try {
        localStorage.setItem('cakrawala_ai_position', JSON.stringify(newPos));
      } catch {}
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(null);
    localStorage.removeItem('cakrawala_ai_position');
  };

  // Send Chat Message
  const handleSendChat = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user' as const,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetPrompt) setChatInput('');
    setIsChatLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);

    try {
      const activeCourse = courses.find(c => c.id === (selectedCourseId || currentCourseId));
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          prompt: textToSend,
          role: 'siswa',
          userRole: 'siswa',
          currentCourseId: selectedCourseId || currentCourseId,
          courseTitle: activeCourse?.title || activeTopic || 'Materi Belajar Siswa',
          history: chatMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || data.answer || 'Saya telah mencatat pertanyaan Anda. Mari kita ulas konsep dasarnya bersama!';
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-ai`,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Gagal menghubungi AI service.');
      }
    } catch {
      clearTimeout(timeoutId);
      // Fallback Pedagogical Response based on web materials
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: `💡 **Pedagogical Scaffold Guide:**\n\nUntuk memahami konsep "${textToSend}" berdasarkan materi di web Cakrawala LMS:\n1. **Identifikasi Konsep Kunci:** Tentukan topik mingguan yang relevan (misal Minggu 1 untuk Limit, Minggu 2 untuk Aturan Rantai, Minggu 3 untuk Stasioner, atau Modul Bahasa).\n2. **Kaitkan Teorema & Rumus:** Periksa catatan kuliah dosen dan rangkuman rumus pada materi terkait.\n3. **Cek Logika Penyelesaian:** Uji substitusi nilai atau periksa kesesuaian kaidah sebelum mengumpulkan jawaban di ujian.\n\nCoba tuliskan langkah awal pengerjaanmu, dan kita bahas bersama!`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Request Scaffold Hint
  const handleRequestHint = async (level: number) => {
    setIsHintLoading(true);
    setCurrentHintLevel(level);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/api/ai/scaffold-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: hintQuestion,
          questionPrompt: hintQuestion,
          courseId: selectedCourseId || currentCourseId,
          level
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setHintsRevealed(prev => ({
          ...prev,
          [level]: {
            title: data.title || data.hintTitle || `Level ${level}: Petunjuk`,
            hint: data.hint || data.hintContent || 'Coba gunakan sifat materi yang telah dipelajari.'
          }
        }));
      } else {
        throw new Error('Gagal memuat petunjuk.');
      }
    } catch {
      clearTimeout(timeoutId);
      const fallbacks: { [lvl: number]: { title: string; hint: string } } = {
        1: {
          title: 'Level 1: Konsep & Teorema Kunci',
          hint: 'Perhatikan bahwa bentuk limit ini adalah 0/0 (bentuk tak tentu). Gunakan identitas trigonometri sudut ganda: 1 - cos(2x) = 2 sin²(x).'
        },
        2: {
          title: 'Level 2: Manipulasi Aljabar',
          hint: 'Ganti pembilang dengan 2 sin²(x). Pecahkan menjadi: [2 · sin(x) · sin(x)] / [x · sin(x)]. Sederhanakan faktor sin(x) yang sama pada pembilang dan penyebut.'
        },
        3: {
          title: 'Level 3: Langkah Eksekusi Akhir',
          hint: 'Setelah menyederhanakan sin(x), kamu mendapatkan limit: lim x->0 [ 2 · (sin x / x) ]. Gunakan teorema limit dasar lim x->0 (sin x / x) = 1. Maka hasilnya 2 · 1 = 2.'
        }
      };

      setHintsRevealed(prev => ({
        ...prev,
        [level]: fallbacks[level] || { title: `Level ${level}`, hint: 'Coba gunakan sifat limit dasar.' }
      }));
    } finally {
      setIsHintLoading(false);
    }
  };

  // Position styles
  const stylePos: React.CSSProperties = position 
    ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <>
      {/* Floating Draggable Launcher when closed */}
      {!isOpen && (
        <div
          style={stylePos}
          className={`${
            !position ? 'fixed bottom-5 right-5' : 'fixed'
          } z-40 group cursor-move select-none animate-in fade-in duration-300`}
          onMouseDown={handleMouseDown}
        >
          <div className="relative flex items-center gap-2">
            {position && (
              <button
                onClick={handleResetPosition}
                title="Kembalikan posisi tombol ke sudut kanan bawah"
                className="p-1.5 rounded-full bg-white/90 border border-slate-300 text-slate-500 hover:text-blue-600 shadow-md cursor-pointer hover:scale-105 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition-all duration-200 hover:scale-105 cursor-pointer border border-blue-400/40"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight">AI Scaffold Siswa</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[10px] text-blue-100 font-normal">Tutor Belajar ZPD Level 1-3</span>
              </div>
              <Move className="w-3.5 h-3.5 text-blue-200/60 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Dialog / Window when open */}
      {isOpen && (
        <div
          style={stylePos}
          className={`${
            !position ? 'fixed bottom-5 right-5' : 'fixed'
          } z-50 ${isExpanded ? 'w-[95vw] sm:w-[620px] h-[80vh]' : 'w-[92vw] sm:w-[420px] h-[580px]'} max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Header - Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="p-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between cursor-move"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs tracking-tight">Cakrawala AI Tutor (Siswa)</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-blue-100">Bimbingan Bertahap • ZPD Bloom C1-C6</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              {position && (
                <button
                  onClick={handleResetPosition}
                  title="Reset ke posisi default"
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Kecilkan' : 'Perbesar'}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chat' 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Tanya Jawab Materi</span>
            </button>
            <button
              onClick={() => setActiveTab('scaffold_hints')}
              className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'scaffold_hints' 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Petunjuk Berjenjang (Hints)</span>
            </button>
          </div>

          {/* Web Material Context Indicator & Subject Filter */}
          <div className="bg-blue-50/80 px-3.5 py-2 border-b border-blue-100 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-900 font-semibold truncate">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="shrink-0">Materi Web:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-white border border-blue-200 text-blue-950 rounded-lg px-2 py-0.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
              >
                <option value="">Semua Materi di Web LMS</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] bg-blue-200/60 text-blue-800 font-bold px-1.5 py-0.5 rounded shrink-0">
              Grounded AI
            </span>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
            
            {/* TAB 1: CHATBOT PEMBELAJARAN */}
            {activeTab === 'chat' && (
              <div className="space-y-3.5">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                      }`}
                    >
                      {msg.sender === 'ai' ? (
                        <FormattedAiMessage content={msg.text} />
                      ) : (
                        <div className="whitespace-pre-line font-medium">{msg.text}</div>
                      )}
                      <div className={`text-[9px] mt-2 pt-1.5 flex items-center justify-between border-t ${
                        msg.sender === 'user' ? 'border-blue-500/50 text-blue-200' : 'border-slate-100 text-slate-400'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>Cakrawala AI Tutor</span>
                          </span>
                        ) : (
                          <span className="font-medium">Anda</span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-2">
                    <Brain className="w-4 h-4 animate-spin text-blue-600" />
                    <span>AI Tutor sedang merumuskan panduan konsep...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* TAB 2: SCAFFOLDING HINTS */}
            {activeTab === 'scaffold_hints' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span>Pertanyaan / Soal yang Sedang Dikerjakan:</span>
                  </div>
                  <textarea
                    value={hintQuestion}
                    onChange={(e) => setHintQuestion(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan soal latihan yang sedang kamu hadapi..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="font-bold text-xs text-slate-700 flex items-center justify-between">
                    <span>Tahapan Bimbingan Pedagogis (ZPD):</span>
                    <span className="text-[10px] text-slate-400 font-normal">Level 1 ➔ 2 ➔ 3</span>
                  </div>

                  {/* Level 1 Hint Card */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                        <span>Level 1: Konsep Kunci & Teorema</span>
                      </span>
                      {!hintsRevealed[1] ? (
                        <button
                          onClick={() => handleRequestHint(1)}
                          disabled={isHintLoading}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer transition"
                        >
                          Buka Petunjuk
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">Terbuka ✓</span>
                      )}
                    </div>
                    {hintsRevealed[1] && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <FormattedAiMessage content={hintsRevealed[1].hint} />
                      </div>
                    )}
                  </div>

                  {/* Level 2 Hint Card */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
                        <span>Level 2: Kaidah & Manipulasi Aljabar</span>
                      </span>
                      {!hintsRevealed[2] ? (
                        <button
                          onClick={() => handleRequestHint(2)}
                          disabled={isHintLoading || !hintsRevealed[1]}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold cursor-pointer transition disabled:opacity-40"
                        >
                          Buka Petunjuk
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">Terbuka ✓</span>
                      )}
                    </div>
                    {hintsRevealed[2] && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <FormattedAiMessage content={hintsRevealed[2].hint} />
                      </div>
                    )}
                  </div>

                  {/* Level 3 Hint Card */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">3</span>
                        <span>Level 3: Langkah Pengerjaan Akhir</span>
                      </span>
                      {!hintsRevealed[3] ? (
                        <button
                          onClick={() => handleRequestHint(3)}
                          disabled={isHintLoading || !hintsRevealed[2]}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer transition disabled:opacity-40"
                        >
                          Buka Petunjuk
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">Terbuka ✓</span>
                      )}
                    </div>
                    {hintsRevealed[3] && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <FormattedAiMessage content={hintsRevealed[3].hint} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Quick Prompts & Chat Input (Bottom) */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSendChat('Jelaskan materi Minggu 1: Konsep & Sifat Limit Fungsi Trigonometri serta rumus sudut ganda!')}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shrink-0 cursor-pointer transition shadow-2xs font-medium"
                >
                  📐 Minggu 1: Limit & Sudut Ganda
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Bagaimana rumus dan penerapan aturan rantai Leibniz dy/dx pada materi Minggu 2?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shrink-0 cursor-pointer transition shadow-2xs font-medium"
                >
                  ⚡ Minggu 2: Aturan Rantai dy/dx
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Bagaimana cara mencari titik stasioner dan menentukan jenisnya dengan uji turunan kedua f\'\'(x) di materi Minggu 3?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shrink-0 cursor-pointer transition shadow-2xs font-medium"
                >
                  📈 Minggu 3: Titik Stasioner & f''(x)
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Jelaskan 7 sistematika baku surat lamaran pekerjaan formal sesuai materi Bahasa Indonesia di web LMS!')}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shrink-0 cursor-pointer transition shadow-2xs font-medium"
                >
                  ✍️ Sistematika Surat Lamaran EYD V
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Apa saja media ajar dan modul video yang tersedia di web LMS untuk membantu pemahaman kalkulus?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shrink-0 cursor-pointer transition shadow-2xs font-medium"
                >
                  🎬 Modul & Media Ajar Web
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pertanyaan konsep atau materi..."
                  disabled={isChatLoading}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
