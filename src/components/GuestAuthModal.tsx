import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Lock, UserRound, Wrench, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { PAGE_ROUTES } from '../routes';

interface GuestAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  intentRole?: 'worker' | 'employer';
  targetSummary?: {
    type: 'job' | 'worker' | 'post-job';
    title: string;
    subtitle?: string;
  };
}

export default function GuestAuthModal({
  isOpen,
  onClose,
  title,
  subtitle,
  intentRole,
  targetSummary,
}: GuestAuthModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChooseRole = (role: 'worker' | 'employer', path: string) => {
    try {
      sessionStorage.setItem(
        'guest_auth_intent',
        JSON.stringify({
          role,
          targetSummary,
          returnPath: window.location.pathname,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Storage fallback
    }
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-slate-100 min-w-0">
        {/* Top Header Decorative Banner */}
        <div className="bg-gradient-to-r from-[#2563eb] via-blue-600 to-indigo-700 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-100 backdrop-blur-md mb-2">
            <Lock className="h-3 w-3 text-blue-200" />
            <span>Qardho Skilled Platform</span>
          </div>

          <h2 id="guest-modal-title" className="text-xl sm:text-2xl font-black text-white leading-snug">
            {title || t('guest_modal_title')}
          </h2>

          <p className="mt-1 text-xs sm:text-sm font-medium text-blue-100/90 leading-relaxed">
            {subtitle || t('guest_modal_desc')}
          </p>
        </div>

        {/* Target Action Context Card (if present) */}
        {targetSummary && (
          <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
              {targetSummary.type === 'worker' ? (
                <Wrench className="h-5 w-5" />
              ) : (
                <Briefcase className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563eb]">
                {targetSummary.type === 'worker'
                  ? 'Target Worker'
                  : targetSummary.type === 'post-job'
                  ? 'Posting Job'
                  : 'Target Job'}
              </span>
              <p className="text-xs font-black text-slate-900 truncate">{targetSummary.title}</p>
              {targetSummary.subtitle && (
                <p className="text-[11px] font-medium text-slate-600 truncate">{targetSummary.subtitle}</p>
              )}
            </div>
          </div>
        )}

        {/* Body Choices */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Choose how you want to join:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Option 1: Worker */}
            <button
              type="button"
              onClick={() => handleChooseRole('worker', PAGE_ROUTES.register)}
              className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition duration-200 hover:shadow-md ${
                intentRole === 'worker'
                  ? 'border-[#2563eb] bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-[#2563eb]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2563eb]">
                  <Wrench className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-black text-slate-950">Skilled Worker</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Showcase your skills, get hired, and apply for local jobs in Qardho.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-black text-[#2563eb]">
                <span>Register as Worker</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Option 2: Employer */}
            <button
              type="button"
              onClick={() => handleChooseRole('employer', PAGE_ROUTES.register)}
              className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition duration-200 hover:shadow-md ${
                intentRole === 'employer'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:border-emerald-600'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Briefcase className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-black text-slate-950">Employer</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Post job listings and hire verified trade professionals in Qardho.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-black text-emerald-700">
                <span>Register as Employer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Already have an account? Sign in */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">Already have an account?</span>
            <button
              type="button"
              onClick={() => handleChooseRole('worker', PAGE_ROUTES.auth)}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 text-xs font-black text-slate-800 hover:bg-slate-200 transition w-full sm:w-auto"
            >
              <UserRound className="h-4 w-4 text-slate-600" />
              <span>Sign In to Existing Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
