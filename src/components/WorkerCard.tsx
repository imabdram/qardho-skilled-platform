import React from 'react';
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
    : worker.rating ? worker.rating.toFixed(1) : null;

  return (
    <article
      id={`worker-card-${worker.id}`}
      className="worker-card group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#073f34] hover:shadow-md"
    >
      <div className="space-y-4">
        {/* Header: Avatar, Name & Availability Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={worker.name} src={avatarSrc} eager={isCurrentUser} />
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-[#073f34] transition truncate">
                {worker.name}
              </h3>
              <p className="text-xs font-bold text-slate-500 truncate mt-0.5">
                {worker.skill || worker.category || 'Skilled professional'}
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

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <MapPin className="h-3.5 w-3.5 text-[#073f34] shrink-0" />
            <span className="truncate text-slate-900 font-bold">{worker.location ? `Qardho - ${worker.location}` : 'Qardho'}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate text-slate-900 font-bold">{rateDisplay}</span>
          </div>
        </div>

        {/* Verification & Rating Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          {worker.verified ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified Worker
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
              <Wrench className="h-3 w-3 text-blue-600" />
              Skilled Professional
            </span>
          )}

          {avgRating && (
            <span className="inline-flex items-center gap-1 text-slate-700 font-bold text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating} {workerReviews.length > 0 ? `(${workerReviews.length})` : ''}
            </span>
          )}
        </div>

        {/* Bio / Description: Clamped to 3 lines */}
        <p className="text-xs font-medium leading-relaxed text-slate-600 line-clamp-3 break-words [overflow-wrap:anywhere]">
          {worker.bio || 'Professional skilled worker in Qardho ready to discuss job opportunities and deliver quality work.'}
        </p>
      </div>

      {/* Footer Action */}
      <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
        {onViewProfile && (
          <button
            type="button"
            onClick={() => onViewProfile(worker)}
            className="view-profile-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#073f34] px-4 text-xs font-black text-white hover:bg-[#0b5c4d] group-hover:bg-[#0b5c4d] hover:shadow-md transition-all duration-200"
          >
            <span>View Profile</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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



