import React, { useEffect, useRef, useState } from 'react';
import { Clock3, DollarSign, Send, Wrench, X } from 'lucide-react';
import { Job, PricingType, User } from '../types';

interface ApplyModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: {
    message: string;
    proposedPricingType?: PricingType;
    proposedAmount?: number;
    proposedCurrency?: string;
    proposedNote?: string;
    expectedTimeline?: string;
  }) => void | Promise<void>;
}

export default function ApplyModal({ job, currentUser, onClose, onSubmit }: ApplyModalProps) {
  const [message, setMessage] = useState(
    `Hello, I am interested in this job. I have relevant experience and I am available to discuss the details.`
  );
  const [pricingType, setPricingType] = useState<PricingType | ''>(currentUser?.pricingType || '');
  const [amount, setAmount] = useState(currentUser?.pricingAmount?.toString() || '');
  const [currency, setCurrency] = useState(currentUser?.pricingCurrency || 'USD');
  const [note, setNote] = useState(currentUser?.pricingNote || '');
  const [timeline, setTimeline] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus message input initially
    setTimeout(() => messageInputRef.current?.focus(), 100);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSubmitting, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || submittedSuccess) return;

    if (!message.trim()) {
      setError('Please enter a short application message.');
      messageInputRef.current?.focus();
      return;
    }

    if (message.trim().length > 1000) {
      setError('The message must be fewer than 1,000 characters.');
      messageInputRef.current?.focus();
      return;
    }

    if (pricingType !== 'negotiable' && amount && Number(amount) < 0) {
      setError('Enter a valid price greater than zero.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await Promise.resolve(
        onSubmit({
          message: message.trim(),
          proposedPricingType: pricingType || undefined,
          proposedAmount: pricingType !== 'negotiable' && amount ? Number(amount) : undefined,
          proposedCurrency: currency.trim() || 'USD',
          proposedNote: note.trim() || undefined,
          expectedTimeline: timeline.trim() || undefined,
        })
      );
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setError('Could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNegotiable = pricingType === 'negotiable';
  const jobOfferDisplay = job.pricingAmount && job.pricingType
    ? `${job.pricingCurrency || 'USD'} ${job.pricingAmount} / ${job.pricingType}`
    : job.rate || 'Not specified';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-dialog-title"
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <h2 id="application-dialog-title" className="text-xl font-black text-slate-900 sm:text-2xl">
              Application Review
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              Apply for <span className="font-bold text-[#2563eb]">"{job.title}"</span>
            </p>
            <p className="text-xs font-medium text-slate-400">{job.employerName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition"
            aria-label="Close application dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Form Content */}
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            
            {/* Summary Card */}
            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Applicant</span>
                <p className="mt-0.5 truncate text-xs font-black text-slate-900">{currentUser?.name || 'Worker'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Relevant Skill</span>
                <p className="mt-0.5 truncate text-xs font-black text-slate-900">{currentUser?.skill || 'Skilled Worker'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Job Budget</span>
                <p className="mt-0.5 truncate text-xs font-black text-[#2563eb]">{jobOfferDisplay}</p>
              </div>
            </div>

            {/* Application Message */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="application-message" className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Application message *
                </label>
                <span className={`text-xs font-mono font-semibold ${message.length > 1000 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {message.length} / 1000
                </span>
              </div>
              <p className="mb-2 text-xs text-slate-500">
                Briefly explain your experience, why you are suitable, and when you can start.
              </p>
              <textarea
                id="application-message"
                ref={messageInputRef}
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1000}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-medium text-slate-900 leading-relaxed outline-none transition focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10 min-h-[130px] sm:min-h-[150px]"
                placeholder="Explain relevant experience, tools, and availability..."
              />
            </div>

            {/* Price Proposal (Optional) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Price proposal <span className="font-medium text-slate-400 lowercase">(optional)</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">Propose your rate if different from the job offer.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Rate type</label>
                  <select
                    value={pricingType}
                    onChange={(event) => setPricingType(event.target.value as PricingType | '')}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#3b82f6]"
                  >
                    <option value="">No preference</option>
                    <option value="project">Per project</option>
                    <option value="hour">Per hour</option>
                    <option value="day">Per day</option>
                    <option value="fixed">Fixed price</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Amount</label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isNegotiable}
                      value={isNegotiable ? '' : amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder={isNegotiable ? 'Negotiable' : '0.00'}
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#3b82f6] disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Currency</label>
                  <input
                    value={currency}
                    disabled={isNegotiable}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 8))}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 outline-none focus:border-[#3b82f6] disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">
                  Pricing note <span className="font-medium text-slate-400 lowercase">(optional)</span>
                </label>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Example: Price may change depending on the project size."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>

            {/* Expected Timeline (Optional) */}
            <div>
              <label htmlFor="application-timeline" className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">
                Availability and timeline <span className="font-medium text-slate-400 lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="application-timeline"
                  value={timeline}
                  onChange={(event) => setTimeline(event.target.value)}
                  placeholder="Example: I can start Monday and complete the work in 3 days."
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-900 outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Sticky Footer Actions */}
          <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-12 min-w-[100px] rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submittedSuccess || !message.trim()}
              className="inline-flex min-h-12 flex-1 sm:flex-initial min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-xs font-black text-white hover:bg-[#1d4ed8] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="h-4 w-4" />
              <span>
                {submittedSuccess
                  ? 'Application submitted successfully'
                  : isSubmitting
                  ? 'Submitting...'
                  : 'Submit Application'}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
