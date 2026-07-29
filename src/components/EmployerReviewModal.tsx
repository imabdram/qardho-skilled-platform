import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, Building2, User, Calendar, FileText, Handshake, AlertCircle } from 'lucide-react';
import { Job, User as UserType } from '../types';

interface EmployerReviewModalProps {
  job: Job;
  employer: UserType;
  currentUser: UserType;
  sourceBadge?: 'Job Application' | 'Direct Offer';
  onClose: () => void;
  onSubmit: (data: {
    jobId: string;
    employerId: string;
    overallRating: number;
    communicationRating: number;
    fairnessRating: number;
    paymentReliabilityRating: number;
    jobAccuracyRating: number;
    comment: string;
  }) => Promise<boolean>;
}

export default function EmployerReviewModal({
  job,
  employer,
  currentUser,
  sourceBadge = 'Job Application',
  onClose,
  onSubmit,
}: EmployerReviewModalProps) {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [fairnessRating, setFairnessRating] = useState<number>(5);
  const [paymentReliabilityRating, setPaymentReliabilityRating] = useState<number>(5);
  const [jobAccuracyRating, setJobAccuracyRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (overallRating < 1 || communicationRating < 1 || fairnessRating < 1 || paymentReliabilityRating < 1 || jobAccuracyRating < 1) {
      setErrorMsg('Please provide a 1-5 star rating for all required criteria.');
      return;
    }

    if (comment.length > 1000) {
      setErrorMsg('Comment cannot exceed 1,000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        jobId: job.id,
        employerId: employer.id || job.employerId,
        overallRating,
        communicationRating,
        fairnessRating,
        paymentReliabilityRating,
        jobAccuracyRating,
        comment: comment.trim(),
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Could not submit review. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRatingSelector = ({
    value,
    onChange,
    label,
    required = true,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
    required?: boolean;
  }) => {
    const [hoverVal, setHoverVal] = useState<number | null>(null);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[11px] font-extrabold text-amber-700">
            {hoverVal !== null ? hoverVal : value} / 5
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-h-[44px]">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverVal !== null ? hoverVal : value);
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverVal(star)}
                onMouseLeave={() => setHoverVal(null)}
                className="p-1 text-slate-300 hover:scale-110 active:scale-95 transition focus:outline-hidden"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={`h-7 w-7 sm:h-8 sm:w-8 transition ${
                    active ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const SourceIcon = sourceBadge === 'Direct Offer' ? Handshake : FileText;
  const completionDateStr = job.completionConfirmedAt
    ? new Date(job.completionConfirmedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-xs sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="employer-review-title"
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Verified Completed Work
              </span>
            </div>
            <h2 id="employer-review-title" className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
              Rate Employer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Close review form"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Work & Employer Summary */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-1.5 font-black text-slate-900">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>{employer.name || job.employerName}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                <SourceIcon className="h-3 w-3 text-slate-500" />
                {sourceBadge}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 text-slate-600 sm:grid-cols-2">
              <div>
                <span className="font-bold text-slate-700">Work Title:</span> {job.title}
              </div>
              <div>
                <span className="font-bold text-slate-700">Completion Date:</span> {completionDateStr}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Detailed Star Ratings */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Rating Criteria</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <StarRatingSelector
                  value={overallRating}
                  onChange={setOverallRating}
                  label="Overall Experience"
                  required
                />
              </div>

              <StarRatingSelector
                value={communicationRating}
                onChange={setCommunicationRating}
                label="Communication"
                required
              />

              <StarRatingSelector
                value={fairnessRating}
                onChange={setFairnessRating}
                label="Fairness and Respect"
                required
              />

              <StarRatingSelector
                value={paymentReliabilityRating}
                onChange={setPaymentReliabilityRating}
                label="Payment Reliability"
                required
              />

              <StarRatingSelector
                value={jobAccuracyRating}
                onChange={setJobAccuracyRating}
                label="Accuracy of Work Description"
                required
              />
            </div>
          </div>

          {/* Optional Written Comment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="written-comment" className="text-xs font-bold text-slate-800">
                Written Feedback <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className={`text-[11px] font-semibold ${comment.length > 1000 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {comment.length} / 1,000
              </span>
            </div>
            <textarea
              id="written-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with this employer, including communication, fairness, payment, and whether the agreed terms were followed."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          {/* Form Actions Footer */}
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-auto flex items-center justify-end gap-3 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-xs font-bold text-white shadow-md hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
