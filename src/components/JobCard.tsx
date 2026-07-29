import React, { useState } from 'react';
import { Application, Job, JobStatus } from '../types';
import { ArrowRight, Calendar, CheckCircle2, DollarSign, MapPin, Wrench } from 'lucide-react';

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
    const cleanRate = job.rate.trim();
    if (!cleanRate || cleanRate.length > 30 || /^[a-z]{5,}$/i.test(cleanRate)) {
      return 'Payment not specified';
    }
    return cleanRate;
  }
  return 'Payment not specified';
};

export default function JobCard({ job, application, onViewDetails, isOwner }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = getHumanReadableStatus(job.status);
  const paymentDisplay = formatPaymentDisplay(job);
  const descriptionLong = (job.description || '').length > 95;

  return (
    <article
      className="group flex h-full w-full max-w-full min-w-0 flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-xs transition hover:border-[#2563eb] hover:shadow-md"
      id={`job-card-${job.id}`}
    >
      <div className="space-y-3 min-w-0">
        {/* Header: Title & Badges */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2.5 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug group-hover:text-[#2563eb] transition min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
              {job.title}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="mt-1 text-xs font-bold text-slate-500 truncate">
            By: <span className="text-slate-900">{job.employerName}</span>
          </p>
        </div>

        {/* Application status if worker applied */}
        {application && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Applied: {application.status}</span>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100 min-w-0">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-[#2563eb] shrink-0" />
            <span className="truncate text-slate-900 font-bold">{job.location ? `Qardho - ${job.location}` : 'Qardho'}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100 min-w-0">
            <DollarSign className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-slate-900 font-bold">{paymentDisplay}</span>
          </div>
        </div>

        {/* Work Type & Posted Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          {job.workType && (
            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
              <Wrench className="h-3 w-3 text-blue-600 shrink-0" />
              {job.workType}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Calendar className="h-3 w-3 shrink-0" />
            Posted {formatDate(job.createdAt)}
          </span>
        </div>

        {/* Description: Clamped to 2 lines initially with View more / Show less expander */}
        <div className="space-y-1 min-w-0">
          <p className={`text-xs font-medium leading-relaxed text-slate-600 break-words [overflow-wrap:anywhere] ${!isExpanded ? 'line-clamp-2' : ''}`}>
            {job.description}
          </p>
          {descriptionLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[11px] font-bold text-[#2563eb] hover:underline focus:outline-none min-h-[32px] inline-flex items-center"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : 'View more'}
            </button>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 w-full">
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-xs sm:text-sm font-black text-white hover:bg-[#1d4ed8] group-hover:bg-[#1d4ed8] hover:shadow-md transition-all duration-200"
          >
            <span>View Job</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
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
