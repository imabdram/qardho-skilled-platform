import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft, Check, CheckCircle2, Clock3, DollarSign, Lock, MapPin,
  MessageCircle, Phone, ShieldCheck, UserCheck, UserRound, X
} from 'lucide-react';
import { Application, Job, User } from '../types';
import Avatar from './Avatar';

interface CandidateReviewModalProps {
  application: Application;
  worker?: User;
  currentUser: User;
  job?: Job;
  onClose: () => void;
  onViewWorkerProfile?: (worker: User) => void;
  onAccept: (applicationId: string) => void;
  onDecline: (applicationId: string) => void;
}

export default function CandidateReviewModal({
  application,
  worker,
  currentUser,
  job,
  onClose,
  onViewWorkerProfile,
  onAccept,
  onDecline,
}: CandidateReviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const cleanPhone = application.phone ? application.phone.replace(/[^+\d]/g, '') : '';
  const cleanWhatsapp = application.phone ? application.phone.replace(/\D/g, '') : '';

  const formatPhoneDisplay = (phoneStr?: string) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('252')) {
      return `+252 ${digits.slice(3)}`;
    }
    return phoneStr;
  };

  const proposedPricing = application.proposedAmount && application.proposedPricingType
    ? `${application.proposedCurrency || 'USD'} ${application.proposedAmount} / ${application.proposedPricingType}`
    : (application.proposedPricingType as string) === 'negotiable'
    ? 'Negotiable'
    : job?.rate || 'Not specified';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-review-title"
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Candidate Review
            </span>
            <h2 id="candidate-review-title" className="text-xl font-black text-slate-900 sm:text-2xl">
              {application.applicantName}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Applied for: <span className="font-bold text-[#073f34]">"{application.jobTitle}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Close candidate review"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Form Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Worker Profile Card */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={application.applicantName}
                src={worker?.avatarUrl}
                size="lg"
                eager
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">{application.applicantName}</h3>
                  {worker?.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#073f34]">{application.applicantSkill || 'Skilled Worker'}</p>
                <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {application.location || 'Qardho'}
                </p>
              </div>
            </div>

            {worker && onViewWorkerProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewWorkerProfile(worker);
                }}
                className="hidden sm:inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-black text-slate-700 hover:bg-slate-50 shrink-0"
              >
                <UserRound className="h-3.5 w-3.5" />
                View Profile
              </button>
            )}
          </div>

          {/* Application Message */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">Application message</h3>
            <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line overflow-wrap-anywhere word-break-break-word">
              "{application.message}"
            </p>
          </div>

          {/* Proposal Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Price Proposal</span>
              <span className="mt-1 block text-sm font-black text-slate-900">{proposedPricing}</span>
              {application.proposedNote && (
                <p className="mt-1 text-[11px] font-medium text-slate-500 italic">"{application.proposedNote}"</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Availability & Timeline</span>
              <span className="mt-1 block text-sm font-black text-slate-900">
                {application.expectedTimeline || 'Available immediately'}
              </span>
            </div>
          </div>

          {/* Contact Details (Unlocked if Accepted) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Candidate Contact</span>

            {application.status === 'accepted' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">Primary Phone</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{formatPhoneDisplay(application.phone)}</span>
                  </div>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white hover:bg-slate-800 transition"
                  >
                    Call
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">WhatsApp</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{formatPhoneDisplay(application.phone)}</span>
                  </div>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello ${application.applicantName}, I am ${currentUser.name}. I accepted your application for "${application.jobTitle}" on Qardho Skilled Platform. Let's discuss next steps.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-xs font-black text-slate-950 hover:bg-[#20bd5a] transition"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                <Lock className="mx-auto h-4 w-4 text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-700">Contact details protected</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Contact information unlocks after you accept this candidate's application.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Actions Footer */}
        <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          {worker && onViewWorkerProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewWorkerProfile(worker);
              }}
              className="sm:hidden min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"
            >
              View Profile
            </button>
          )}

          {application.status === 'pending' ? (
            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onDecline(application.id)}
                className="min-h-12 min-w-[100px] rounded-xl border border-rose-200 bg-white px-4 text-xs font-black text-rose-700 hover:bg-rose-50 transition"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onAccept(application.id)}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#073f34] px-6 text-xs font-black text-white hover:bg-[#064e3b] transition shadow-xs"
              >
                <UserCheck className="h-4 w-4" />
                <span>Accept & Hire</span>
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                application.status === 'accepted' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
              }`}>
                Status: {application.status}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700"
              >
                Close
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
