import React from 'react';
import { FileText, CheckCircle2, MapPin, DollarSign, Calendar } from 'lucide-react';

interface WorkAgreementSummaryProps {
  agreedAmount?: string;
  location?: string;
  expectedTimeline?: string;
  jobTitle?: string;
  isConfirmed?: boolean;
  expanded?: boolean;
}

export default function WorkAgreementSummary({
  agreedAmount,
  location = 'Qardho',
  expectedTimeline = 'Flexible',
  jobTitle,
  isConfirmed = true,
  expanded = false,
}: WorkAgreementSummaryProps) {
  if (!expanded) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 text-xs text-emerald-950">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span className="font-bold">Agreement confirmed</span>
        <span className="text-emerald-300">·</span>
        <span className="font-semibold text-emerald-900">{agreedAmount || 'Discussed on call'}</span>
        <span className="text-emerald-300">·</span>
        <span className="text-emerald-800">{location}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-blue-50/30 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-emerald-700" />
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">Work Agreement Summary</h4>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-white/80 p-2 border border-emerald-100/70">
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Job Title</span>
          <span className="mt-0.5 block font-bold text-slate-900 truncate">{jobTitle || 'Direct Work'}</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-emerald-100/70">
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Agreed Rate</span>
          <span className="mt-0.5 block font-mono font-bold text-emerald-700">{agreedAmount || 'Discussed on call'}</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-emerald-100/70">
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Location</span>
          <span className="mt-0.5 block font-bold text-slate-900 truncate">{location}</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-emerald-100/70">
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Timeline / Duration</span>
          <span className="mt-0.5 block font-bold text-slate-900 truncate">{expectedTimeline}</span>
        </div>
      </div>
    </div>
  );
}
