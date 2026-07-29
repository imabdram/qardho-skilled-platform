import React, { useState } from 'react';
import { useUser } from '@clerk/react';
import { ArrowRight, DollarSign, MapPin, ShieldCheck, Star, Wrench } from 'lucide-react';
import { User as UserType, Review } from '../types';
import Avatar from './Avatar';

interface WorkerCardProps {
  key?: string;
  worker: UserType;
  currentUser?: UserType | null;
  onConnect?: (worker: UserType) => void;
  onViewProfile?: (worker: UserType) => void;
  isCurrentUser: boolean;
  reviews?: Review[];
}

const getAvailabilityStatus = (availability?: string) => {
  switch (availability) {
    case 'available':
      return { label: 'Available', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    case 'busy':
      return { label: 'Busy', className: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    case 'unavailable':
    default:
      return { label: 'Unavailable', className: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  }
};

const formatRateDisplay = (worker: UserType) => {
  if (worker.rate && worker.rate.trim()) {
    const cleanRate = worker.rate.trim();
    if (worker.pricingType) {
      const typeLabel = worker.pricingType === 'project' ? 'project' : worker.pricingType === 'hour' ? 'hr' : 'day';
      if (!cleanRate.includes('/')) {
        return `${cleanRate} / ${typeLabel}`;
      }
    }
    return cleanRate;
  }
  return 'Rate on request';
};

export default function WorkerCard({ worker, currentUser, onViewProfile, isCurrentUser, reviews = [] }: WorkerCardProps) {
  const { user: clerkUser } = useUser();
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const statusInfo = getAvailabilityStatus(worker.availability);
  const rateDisplay = formatRateDisplay(worker);

  const avatarSrc = (isCurrentUser && clerkUser?.imageUrl)
    ? clerkUser.imageUrl
    : (isCurrentUser && currentUser?.avatarUrl)
    ? currentUser.avatarUrl
    : worker.avatarUrl;

  const workerReviews = reviews.filter(r => r.workerId === worker.id);
  const avgRating = workerReviews.length > 0
    ? (workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length).toFixed(1)
    : null;

  // Extract all skills from worker.skill string or fallback
  const skillsList = worker.skill
    ? worker.skill.split(/[,|/]+/).map(s => s.trim()).filter(Boolean)
    : [];

  const bioText = worker.bio || 'Professional skilled worker in Qardho ready to discuss job opportunities and deliver quality work.';
  const isBioLong = bioText.length > 90;

  return (
    <article
      id={`worker-card-${worker.id}`}
      className="worker-card group flex h-full w-full max-w-full min-w-0 flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-xs transition hover:border-[#2563eb] hover:shadow-md"
    >
      <div className="space-y-3 min-w-0">
        {/* Header: Avatar, Name & Availability Pill */}
        <div className="flex items-start justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar name={worker.name} src={avatarSrc} eager={isCurrentUser} />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug group-hover:text-[#2563eb] transition break-words [overflow-wrap:anywhere]">
                {worker.name}
              </h3>
              {/* Show primary role/skill subtext */}
              <p className="text-xs font-bold text-slate-500 truncate mt-0.5">
                {skillsList[0] || 'Skilled professional'}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${statusInfo.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* All Skills: Wrapping Skill Chips */}
        <div className="flex flex-wrap gap-1.5 min-w-0 pt-1">
          {skillsList.length > 0 ? (
            skillsList.map((skillItem, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563eb] border border-blue-100/80 break-words [overflow-wrap:anywhere]"
              >
                {skillItem}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Skilled Professional
            </span>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100 min-w-0">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-[#2563eb] shrink-0" />
            <span className="truncate text-slate-900 font-bold">{worker.location ? `Qardho - ${worker.location}` : 'Qardho'}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100 min-w-0">
            <DollarSign className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-slate-900 font-bold">{rateDisplay}</span>
          </div>
        </div>

        {/* Verification & Rating Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          {worker.verified ? (
            <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              Verified Worker
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
              <Wrench className="h-3 w-3 text-blue-600 shrink-0" />
              Skilled Professional
            </span>
          )}

          {avgRating && (
            <span className="inline-flex items-center gap-1 text-slate-700 font-bold text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              {avgRating} {workerReviews.length > 0 ? `(${workerReviews.length})` : ''}
            </span>
          )}
        </div>

        {/* Bio: Clamped to 2 lines initially with View more / Show less expander */}
        <div className="space-y-1 min-w-0">
          <p className={`text-xs font-medium leading-relaxed text-slate-600 break-words [overflow-wrap:anywhere] ${!isBioExpanded ? 'line-clamp-2' : ''}`}>
            {bioText}
          </p>
          {isBioLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBioExpanded(!isBioExpanded);
              }}
              className="text-[11px] font-bold text-[#2563eb] hover:underline focus:outline-none min-h-[32px] inline-flex items-center"
              aria-expanded={isBioExpanded}
            >
              {isBioExpanded ? 'Show less' : 'View more'}
            </button>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 w-full">
        {onViewProfile && (
          <button
            type="button"
            onClick={() => onViewProfile(worker)}
            className="view-profile-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-xs sm:text-sm font-black text-white hover:bg-[#1d4ed8] group-hover:bg-[#1d4ed8] hover:shadow-md transition-all duration-200"
          >
            <span>View Profile</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {isCurrentUser && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 py-1.5 text-center text-[11px] font-bold text-blue-700">
            This is your worker profile
          </div>
        )}
      </div>
    </article>
  );
}
