import React, { useState } from 'react';
import { Application, Job, JobStatus } from '../types';
import { ArrowRight, Calendar, CheckCircle2, DollarSign, MapPin, Wrench } from 'lucide-react';
import Avatar from './Avatar';

interface JobCardProps {
  key?: string;
  job: Job;
  application?: Application;
  onViewDetails?: (job: Job) => void;
  isOwner: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

const getHumanReadableStatus = (status: JobStatus) => {
  switch (status) {
    case 'open':
      return { label: 'Open', className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' };
    case 'active':
    case 'in_progress':
      return { label: 'In progress', className: 'bg-blue-50 text-blue-800 border-blue-200/80' };
    case 'completion_requested_by_worker':
    case 'completion_requested_by_employer':
      return { label: 'Completion requested', className: 'bg-amber-50 text-amber-800 border-amber-200/80' };
    case 'completed':
      return { label: 'Completed', className: 'bg-slate-100 text-slate-700 border-slate-200/80' };
    case 'completion_disputed':
      return { label: 'Disputed', className: 'bg-rose-50 text-rose-800 border-rose-200/80' };
    case 'closed':
    case 'cancelled':
    default:
      return { label: 'Closed', className: 'bg-slate-100 text-slate-600 border-slate-200/80' };
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

const formatApplicationBadge = (status: Application['status']) => {
  switch (status) {
    case 'accepted':
      return { label: 'Applied: Accepted', className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' };
    case 'declined':
      return { label: 'Applied: Declined', className: 'bg-slate-100 text-slate-600 border-slate-200/80' };
    case 'pending':
    default:
      return { label: 'Applied: Under Review', className: 'bg-blue-50 text-blue-800 border-blue-200/80' };
  }
};

export default function JobCard({ job, application, onViewDetails, isOwner }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = getHumanReadableStatus(job.status);
  const paymentDisplay = formatPaymentDisplay(job);
  const descriptionLong = (job.description || '').length > 100;
  const appBadge = application ? formatApplicationBadge(application.status) : null;

  return (
    <article
      className="group flex h-full w-full max-w-full min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 lg:p-6 shadow-xs hover:border-[#2563eb] hover:shadow-md transition-all duration-200"
      id={`job-card-${job.id}`}
    >
      <div className="space-y-3.5 min-w-0">
        {/* 1. Top Row: Title & Primary Status Badge */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-[#2563eb] transition min-w-0 flex-1 break-words [overflow-wrap:anywhere] line-clamp-2">
            {job.title}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* 2. Poster Row */}
        <div className="flex items-center gap-1.5 min-w-0 text-xs">
          <Avatar name={job.employerName} src={job.employerAvatarUrl} className="!h-5 !w-5 text-[9px] font-extrabold shrink-0" />
          <p className="text-[11px] font-medium text-slate-500 truncate">
            By <span className="font-semibold text-slate-800">{job.employerName}</span>
          </p>
        </div>

        {/* Applied status pill badge if worker applied */}
        {appBadge && (
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${appBadge.className}`}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{appBadge.label}</span>
            </span>
          </div>
        )}

        {/* 3. Key Facts Row */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 min-w-0 pt-1">
          {/* Location Chip */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100 min-w-0" title={`Location: ${job.location || 'Qardho'}`}>
            <MapPin className="h-3.5 w-3.5 text-[#2563eb] shrink-0" />
            <span className="truncate font-semibold text-slate-800 text-[11px]">
              {job.location ? `Qardho - ${job.location}` : 'Qardho'}
            </span>
          </div>

          {/* Budget / Payment Chip */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100 min-w-0" title={`Payment: ${paymentDisplay}`}>
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-bold text-slate-900 text-[11px]">
              {paymentDisplay}
            </span>
          </div>

          {/* Work Type Chip */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100 min-w-0" title={`Work Type: ${job.workType || 'General'}`}>
            <Wrench className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate font-medium text-slate-700 text-[11px]">
              {job.workType || 'General'}
            </span>
          </div>

          {/* Posted Date Chip */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100 min-w-0" title={`Posted: ${formatDate(job.createdAt)}`}>
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-500 text-[11px]">
              {formatDate(job.createdAt)}
            </span>
          </div>
        </div>

        {/* 4. Description Row */}
        <div className="min-w-0 pt-0.5">
          <p className={`text-xs font-normal leading-relaxed text-slate-600 break-words [overflow-wrap:anywhere] ${!isExpanded ? 'line-clamp-2' : ''}`}>
            {job.description}
          </p>
          {descriptionLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[11px] font-semibold text-[#2563eb] hover:underline focus:outline-none min-h-[28px] inline-flex items-center mt-0.5"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : 'View more'}
            </button>
          )}
        </div>
      </div>

      {/* 5. Action Row */}
      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 w-full">
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-2xs hover:shadow-xs transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            <span>View Job Posting</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {isOwner && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 py-1.5 text-center text-[11px] font-bold text-blue-700">
            Your Job Listing
          </div>
        )}
      </div>
    </article>
  );
}
