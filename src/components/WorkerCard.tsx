import React from 'react';
import { useUser } from '@clerk/react';
import { DollarSign, ShieldCheck } from 'lucide-react';
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

export default function WorkerCard({ worker, currentUser, onViewProfile, isCurrentUser }: WorkerCardProps) {
  const { user: clerkUser } = useUser();
  const availability = worker.availability || 'available';
  const availabilityLabel = availability === 'available' ? 'Available' : availability === 'busy' ? 'Busy' : 'Unavailable';

  const avatarSrc = (isCurrentUser && clerkUser?.imageUrl)
    ? clerkUser.imageUrl
    : (isCurrentUser && currentUser?.avatarUrl)
    ? currentUser.avatarUrl
    : worker.avatarUrl;

  return (
    <article id={`worker-card-${worker.id}`} className="worker-card flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#073f34] hover:shadow-md">
      <div>
        <div className="flex items-start gap-4">
          <Avatar name={worker.name} src={avatarSrc} eager={isCurrentUser} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-black text-slate-950">{worker.name}</h3>
            <p className="mt-1 truncate text-sm font-bold text-slate-600">{worker.skill || 'Skilled professional'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {worker.verified && <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-black text-brand-700"><ShieldCheck className="h-3 w-3" />Verified</span>}
              {worker.location && <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">{worker.location}</span>}
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2 border-y border-slate-100 py-4 text-sm font-semibold text-slate-600">
          <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${availability === 'busy' ? 'bg-amber-500' : availability === 'unavailable' ? 'bg-rose-500' : 'bg-brand-500'}`} />{availabilityLabel}</span><span className="inline-flex items-center gap-1 text-[#2563eb]"><DollarSign className="h-3.5 w-3.5" />{worker.rate || 'Rate on request'}</span></div>
          <p className="text-xs text-slate-500">Pricing: {worker.pricingType === 'project' ? 'Per project' : worker.pricingType === 'hour' ? 'Per hour' : worker.pricingType === 'day' ? 'Per day' : 'Not specified'}</p>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{worker.bio || 'Professional skilled worker ready to discuss the right fit for your job.'}</p>
      </div>
      <div className="mt-5">
        {onViewProfile && <button onClick={() => onViewProfile(worker)} className="view-profile-button inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-700 px-4 text-sm font-black text-[#2563eb] transition hover:bg-[#3b82f6] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2">View Profile</button>}
        {isCurrentUser && <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-400">This is you</div>}
      </div>
    </article>
  );
}


