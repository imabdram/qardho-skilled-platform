import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Clock3, DollarSign, Send, X } from 'lucide-react';
import { Job, User } from '../types';
import Avatar from './Avatar';

interface ConnectModalProps {
  worker: User;
  currentUser: User | null;
  jobs: Job[];
  onClose: () => void;
  onSubmit: (data: { message: string; jobId?: string; expectedTimeline?: string }) => void | Promise<void>;
}

export default function ConnectModal({ worker, currentUser, jobs, onClose, onSubmit }: ConnectModalProps) {
  const availableJobs = jobs.filter((job) => job.employerId === currentUser?.id && job.status === 'open');
  const [jobId, setJobId] = useState(availableJobs[0]?.id || '');
  const [message, setMessage] = useState(`Hello ${worker.name}, I reviewed your profile on Qardho Skilled Platform and would like to discuss a work opportunity with you.`);
  const [timeline, setTimeline] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedJob = availableJobs.find((job) => job.id === jobId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isSubmitting) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [isSubmitting, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return setError('Add a short message for the worker.');
    setError('');
    setIsSubmitting(true);
    try { await Promise.resolve(onSubmit({ message: message.trim(), jobId: jobId || undefined, expectedTimeline: timeline.trim() || undefined })); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="hire-dialog-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur"><div className="flex min-w-0 items-center gap-3"><Avatar name={worker.name} src={worker.avatarUrl} /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3b82f6]">Send job offer</p><h2 id="hire-dialog-title" className="truncate text-xl font-black text-slate-950">{worker.name}</h2><p className="text-sm font-semibold text-slate-500">{worker.skill || 'Skilled worker'}</p></div></div><button onClick={onClose} disabled={isSubmitting} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-slate-100" aria-label="Close hiring dialog"><X className="h-5 w-5" /></button></header>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <div><label htmlFor="hire-job" className="mb-1.5 block text-sm font-black">Related job <span className="font-medium text-slate-400">(optional)</span></label><div className="relative"><BriefcaseBusiness className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><select id="hire-job" value={jobId} onChange={(event) => setJobId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-semibold"><option value="">General hiring request</option>{availableJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></div>{availableJobs.length === 0 && <p className="mt-1 text-xs font-medium text-slate-500">You can send a general request, or post a job first.</p>}</div>
          {selectedJob && <div className="grid gap-3 rounded-2xl bg-brand-50 p-4 sm:grid-cols-2"><div><span className="text-[10px] font-black uppercase text-brand-700">Job title</span><p className="mt-1 text-sm font-black text-slate-900">{selectedJob.title}</p></div><div><span className="text-[10px] font-black uppercase text-brand-700">Proposed price</span><p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-900"><DollarSign className="h-4 w-4" />{selectedJob.rate}{selectedJob.pricingType ? ` / ${selectedJob.pricingType}` : ''}</p></div></div>}
          <div><label htmlFor="hire-message" className="mb-1.5 block text-sm font-black">Message</label><textarea id="hire-message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /><p className="mt-1 text-xs text-slate-500">Your private number is shared only if the worker accepts.</p></div>
          <div><label htmlFor="hire-timeline" className="mb-1.5 block text-sm font-black">Expected timeline <span className="font-medium text-slate-400">(optional)</span></label><div className="relative"><Clock3 className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input id="hire-timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="For example: start next week, 5 days" className="min-h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-semibold" /></div></div>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row"><button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-12 flex-1 rounded-full border border-slate-200 text-sm font-black">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] text-sm font-black text-white hover:bg-[#1d4ed8] disabled:opacity-60"><Send className="h-4 w-4" />{isSubmitting ? 'Sending...' : 'Send job offer'}</button></div>
        </form>
      </section>
    </div>
  );
}


