import React from 'react';
import { Application, Job, JobStatus } from '../types';
import { ArrowRight, Calendar, CheckCircle2, Clock, DollarSign, MapPin, Wrench, X } from 'lucide-react';

interface JobCardProps {
  key?: string;
  job: Job;
  application?: Application;
  onViewDetails?: (job: Job) => void;
  isOwner: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently posted';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently posted';
  }
};

const getHumanReadableStatus = (status: JobStatus) => {
  switch (status) {
    case 'open':
      return { label: 'Open', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'active':
    case 'in_progress':
      return { label: 'In progress', className: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'completion_requested_by_worker':
    case 'completion_requested_by_employer':
      return { label: 'Completion requested', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'completed':
      return { label: 'Completed', className: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 'completion_disputed':
      return { label: 'Disputed', className: 'bg-rose-50 text-rose-800 border-rose-200' };
    case 'closed':
    case 'cancelled':
    default:
      return { label: 'Closed', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
};

const formatPaymentDisplay = (job: Job) => {
  if (job.pricingAmount && job.pricingType) {
    return `${job.pricingCurrency || 'USD'} ${job.pricingAmount} / ${job.pricingType}`;
  }
  if (job.rate) {
    // Validate rate string: if it looks like garbage or empty, show Not specified
    const cleanRate = job.rate.trim();
    if (!cleanRate || cleanRate.length > 30 || /^[a-z]{5,}$/i.test(cleanRate)) {
      return 'Payment not specified';
    }
    return cleanRate;
  }
  return 'Payment not specified';
};

export default function JobCard({ job, application, onViewDetails, isOwner }: JobCardProps) {
  const statusInfo = getHumanReadableStatus(job.status);
  const paymentDisplay = formatPaymentDisplay(job);

  return (
    <article
      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#2563eb] hover:shadow-md"
      id={`job-card-${job.id}`}
    >
      <div className="space-y-4">
        {/* Header: Title & Badges */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-[#2563eb] transition">
              {job.title}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="mt-1 text-xs font-bold text-slate-500">
            By: <span className="text-slate-900">{job.employerName}</span>
          </p>
        </div>

        {/* Application status if worker applied */}
        {application && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Applied: {application.status}</span>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <MapPin className="h-3.5 w-3.5 text-[#2563eb] shrink-0" />
            <span className="truncate text-slate-900 font-bold">{job.location ? `Qardho - ${job.location}` : 'Qardho'}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <DollarSign className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-slate-900 font-bold">{paymentDisplay}</span>
          </div>
        </div>

        {/* Work Type & Posted Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          {job.workType && (
            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
              <Wrench className="h-3 w-3 text-blue-600" />
              {job.workType}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Calendar className="h-3 w-3" />
            Posted {formatDate(job.createdAt)}
          </span>
        </div>

        {/* Description: Clamp to 3 lines */}
        <p className="text-xs font-medium leading-relaxed text-slate-600 line-clamp-3 break-words [overflow-wrap:anywhere]">
          {job.description}
        </p>
      </div>

      {/* Footer Action */}
      <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white hover:bg-[#1d4ed8] group-hover:bg-[#1d4ed8] hover:shadow-md transition-all duration-200"
          >
            <span>View Job</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {isOwner && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 py-1.5 text-center text-[11px] font-bold text-blue-700">
            Your Job Listing
          </div>
        )}
      </div>
    </article>
  );
}
