import React, { useEffect, useState } from 'react';
import { Clock3, DollarSign, Send, Wrench, X } from 'lucide-react';
import { Job, PricingType, User } from '../types';

interface ApplyModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: { message: string; proposedPricingType?: PricingType; proposedAmount?: number; proposedCurrency?: string; proposedNote?: string; expectedTimeline?: string }) => void | Promise<void>;
}

export default function ApplyModal({ job, currentUser, onClose, onSubmit }: ApplyModalProps) {
  const [message, setMessage] = useState(`Hello, I would like to apply for "${job.title}". My experience matches this work and I am available to discuss the details.`);
  const [pricingType, setPricingType] = useState<PricingType | ''>(currentUser?.pricingType || '');
  const [amount, setAmount] = useState(currentUser?.pricingAmount?.toString() || '');
  const [currency, setCurrency] = useState(currentUser?.pricingCurrency || 'USD');
  const [note, setNote] = useState(currentUser?.pricingNote || '');
  const [timeline, setTimeline] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isSubmitting) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [isSubmitting, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!message.trim()) return setError('Add a short message about your skills and availability.');
    if (amount && Number(amount) < 0) return setError('Proposed price cannot be negative.');
    setError('');
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit({ message: message.trim(), proposedPricingType: pricingType || undefined, proposedAmount: amount ? Number(amount) : undefined, proposedCurrency: currency.trim() || 'USD', proposedNote: note.trim() || undefined, expectedTimeline: timeline.trim() || undefined }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="application-dialog-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3b82f6]">Application review</p><h2 id="application-dialog-title" className="mt-1 text-xl font-black text-slate-950">{job.title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{job.employerName}</p></div>
          <button onClick={onClose} disabled={isSubmitting} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50" aria-label="Close application dialog"><X className="h-5 w-5" /></button>
        </header>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 rounded-2xl bg-brand-50 p-4 sm:grid-cols-3">
            <div><span className="text-[10px] font-black uppercase text-brand-700">Worker</span><p className="mt-1 text-sm font-black text-slate-900">{currentUser?.name}</p></div>
            <div><span className="text-[10px] font-black uppercase text-brand-700">Relevant skill</span><p className="mt-1 text-sm font-black text-slate-900">{currentUser?.skill || 'General worker'}</p></div>
            <div><span className="text-[10px] font-black uppercase text-brand-700">Job offer</span><p className="mt-1 text-sm font-black text-slate-900">{job.rate}</p></div>
          </div>

          <div><label htmlFor="application-message" className="mb-1.5 block text-sm font-black text-slate-800">Message</label><textarea id="application-message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /><p className="mt-1 text-xs text-slate-500">Describe relevant experience, tools, and when you can start.</p></div>

          <fieldset><legend className="text-sm font-black text-slate-800">Optional price proposal</legend><div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_7rem]"><label className="relative"><span className="sr-only">Pricing type</span><Wrench className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><select value={pricingType} onChange={(event) => setPricingType(event.target.value as PricingType | '')} className="min-h-11 w-full rounded-xl border border-slate-200 pl-11 pr-3 text-sm font-semibold"><option value="">No pricing type</option><option value="project">Per project</option><option value="hour">Per hour</option><option value="day">Per day</option></select></label><label className="relative"><span className="sr-only">Amount</span><DollarSign className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="min-h-11 w-full rounded-xl border border-slate-200 pl-11 pr-3 text-sm font-semibold" /></label><input aria-label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 8))} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-black" /></div><textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional pricing note" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium" /></fieldset>

          <div><label htmlFor="application-timeline" className="mb-1.5 block text-sm font-black text-slate-800">Expected timeline <span className="font-medium text-slate-400">(optional)</span></label><div className="relative"><Clock3 className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input id="application-timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="For example: can start Monday, 3 days estimated" className="min-h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-semibold" /></div></div>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row"><button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-12 flex-1 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] px-4 text-sm font-black text-white hover:bg-[#1d4ed8] disabled:opacity-60"><Send className="h-4 w-4" />{isSubmitting ? 'Submitting...' : 'Submit application'}</button></div>
        </form>
      </section>
    </div>
  );
}


