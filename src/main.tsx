import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Cakrawala LMS] Root Error caught:', error, errorInfo);
  }

  handleCleanAndReload = () => {
    try {
      localStorage.removeItem('cakrawala_submissions');
      localStorage.removeItem('cakrawala_quiz_submissions');
      localStorage.removeItem('cakrawala_media_ajar');
    } catch (e) {
      console.warn('Storage clear warning:', e);
    }
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear warning:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isQuotaError = this.state.error?.message?.includes('quota') || String(this.state.error).includes('quota');
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-2xl">
              🎓
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Cakrawala LMS Sedang Memulihkan Sistem</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isQuotaError 
                ? 'Memori penyimpanan peramban lokal (localStorage) penuh akibat lampiran atau berkas ujian. Sistem telah menyediakan tombol perbaikan otomatis di bawah ini.'
                : 'Terjadi penyesuaian status render pada peramban Anda. Klik tombol di bawah untuk menyegarkan tampilan dan memuat ulang data terbaru.'}
            </p>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 text-left overflow-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleCleanAndReload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition"
              >
                Bersihkan Cache & Muat Ulang
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Reset Semua Data
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
