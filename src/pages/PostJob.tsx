import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, DollarSign, Eye, FileText, MapPin, Save, Send, Wrench } from 'lucide-react';
import { PricingType, User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

export interface JobFormData {
  title: string;
  category: string;
  location: string;
  workType: string;
  description: string;
  requirements: string;
  pricingType?: PricingType;
  pricingAmount?: number;
  pricingCurrency: string;
  pricingNote?: string;
  rate: string;
  expectedDuration: string;
}

interface PostJobProps {
  currentUser: User | null;
  onPostJob: (jobData: JobFormData) => void | Promise<void>;
  onNavigate: (page: string) => void;
}

const DRAFT_KEY = 'qardho-job-draft';
const emptyForm: JobFormData = { title: '', category: '', location: '', workType: '', description: '', requirements: '', pricingType: undefined, pricingAmount: undefined, pricingCurrency: 'USD', pricingNote: '', rate: '', expectedDuration: '' };

export default function PostJob({ currentUser, onPostJob, onNavigate }: PostJobProps) {
  if (!currentUser || currentUser.role !== 'employer') return <main className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="text-2xl font-black">Employer access required</h1><button onClick={() => onNavigate('dashboard')} className="mt-5 min-h-11 rounded-full bg-slate-900 px-5 text-sm font-black text-white">Back to dashboard</button></main>;

  const [form, setForm] = useState<JobFormData>(() => {
    try { return { ...emptyForm, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') }; } catch { return emptyForm; }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  const derivedRate = useMemo(() => form.pricingAmount !== undefined && form.pricingType ? `${form.pricingCurrency} ${form.pricingAmount} / ${form.pricingType}` : form.pricingNote?.trim() || 'Negotiable', [form.pricingAmount, form.pricingCurrency, form.pricingNote, form.pricingType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Job title is required.';
    if (!form.category.trim()) next.category = 'Choose or enter a category.';
    if (!form.location) next.location = 'Choose a location.';
    if (!form.workType) next.workType = 'Choose a work type.';
    if (form.description.trim().length < 30) next.description = 'Job description must be at least 30 characters.';
    if (form.requirements.trim().length < 30) next.requirements = 'Requirements must be at least 30 characters.';
    if (form.pricingAmount !== undefined && form.pricingAmount < 0) next.pricingAmount = 'Budget cannot be negative.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) { setPreview(false); return; }
    if (!preview) { setPreview(true); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onPostJob({ ...form, title: form.title.trim(), description: form.description.trim(), requirements: form.requirements.trim(), rate: derivedRate }));
      localStorage.removeItem(DRAFT_KEY);
    } finally { setSubmitting(false); }
  };

  const input = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10';
  const Error = ({ field }: { field: string }) => errors[field] ? <p className="mt-1 text-xs font-bold text-rose-600">{errors[field]}</p> : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => onNavigate('dashboard')} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-white"><ArrowLeft className="h-4 w-4" />Dashboard</button>
      <header className="rounded-3xl bg-[#073f34] p-6 text-white sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#93c5fd]">Employer workspace</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Post a job with clear expectations.</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-brand-50/80">Complete the scope, requirements, pricing, and duration, then review everything before publishing.</p></header>

      <div className="mt-6 flex flex-wrap gap-2">{['Job details', 'Scope', 'Pricing', 'Review & publish'].map((step, index) => <span key={step} className={`rounded-full border px-3 py-2 text-xs font-black ${preview && index === 3 ? 'border-[#3b82f6] bg-[#3b82f6] text-white' : 'border-brand-950/10 bg-white text-slate-600'}`}>{index + 1}. {step}</span>)}</div>

      <form onSubmit={submit} className="mt-6">
        {preview ? (
          <section className="rounded-3xl border border-brand-950/10 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">Review before publishing</p><h2 className="mt-2 text-2xl font-black text-slate-950">{form.title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{form.category} - {form.workType} - {form.location}</p></div><Eye className="h-6 w-6 text-[#3b82f6]" /></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><MapPin className="h-4 w-4 text-[#3b82f6]" /><p className="mt-2 text-xs font-black uppercase text-slate-400">Location</p><p className="font-black">{form.location}</p></div><div className="rounded-2xl bg-slate-50 p-4"><DollarSign className="h-4 w-4 text-[#3b82f6]" /><p className="mt-2 text-xs font-black uppercase text-slate-400">Pricing</p><p className="font-black">{derivedRate}</p></div><div className="rounded-2xl bg-slate-50 p-4"><Clock3 className="h-4 w-4 text-[#3b82f6]" /><p className="mt-2 text-xs font-black uppercase text-slate-400">Duration</p><p className="font-black">{form.expectedDuration || 'Not specified'}</p></div></div>
            <div className="mt-5"><h3 className="font-black">Description</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{form.description}</p></div><div className="mt-5"><h3 className="font-black">Requirements</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{form.requirements}</p></div>
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row"><button type="button" onClick={() => setPreview(false)} className="min-h-12 flex-1 rounded-full border border-slate-200 text-sm font-black">Edit details</button><button type="submit" disabled={submitting} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] text-sm font-black text-white hover:bg-[#1d4ed8] disabled:opacity-60"><Send className="h-4 w-4" />{submitting ? 'Publishing...' : 'Publish job'}</button></div>
          </section>
        ) : (
          <section className="space-y-8 rounded-3xl border border-brand-950/10 bg-white p-5 shadow-sm sm:p-7">
            <div><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">1. Job details</p><h2 className="mt-1 text-xl font-black">What work is needed?</h2></div><span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"><Save className="h-3.5 w-3.5" />{saved ? 'Draft saved' : 'Auto-saving'}</span></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-black" htmlFor="job-title">Job title</label><input id="job-title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Solar pump installer needed" className={input} /><Error field="title" /></div><div><label className="mb-1.5 block text-sm font-black" htmlFor="job-category">Category</label><div className="relative"><Wrench className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input id="job-category" value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Solar, construction, tailoring..." className={`${input} pl-11`} /></div><Error field="category" /></div><div><label className="mb-1.5 block text-sm font-black" htmlFor="job-location">Location</label><select id="job-location" value={form.location} onChange={(event) => update('location', event.target.value)} className={input}><option value="">Choose neighborhood</option>{QARDHO_NEIGHBORHOODS.map((location) => <option key={location}>{location}</option>)}</select><Error field="location" /></div><div><label className="mb-1.5 block text-sm font-black" htmlFor="job-work-type">Work type</label><select id="job-work-type" value={form.workType} onChange={(event) => update('workType', event.target.value)} className={input}><option value="">Choose work type</option><option>On site</option><option>Remote</option><option>Flexible</option><option>One-time project</option><option>Ongoing work</option></select><Error field="workType" /></div></div></div>

            <div className="border-t border-slate-100 pt-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">2. Scope and requirements</p><div className="mt-4 space-y-5"><div><label htmlFor="job-description" className="mb-1.5 flex items-center justify-between text-sm font-black"><span>Job description</span><span className={form.description.length >= 30 ? 'text-brand-600' : 'text-slate-400'}>{form.description.length}/30 minimum</span></label><textarea id="job-description" rows={7} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Explain the work, context, deliverables, schedule, and what a successful result looks like." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /><Error field="description" /></div><div><label htmlFor="job-requirements" className="mb-1.5 flex items-center justify-between text-sm font-black"><span>Requirements</span><span className={form.requirements.length >= 30 ? 'text-brand-600' : 'text-slate-400'}>{form.requirements.length}/30 minimum</span></label><textarea id="job-requirements" rows={5} value={form.requirements} onChange={(event) => update('requirements', event.target.value)} placeholder="List experience, tools, certifications, availability, or other practical requirements." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /><Error field="requirements" /></div></div></div>

            <div className="border-t border-slate-100 pt-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">3. Pricing and duration</p><p className="mt-1 text-sm text-slate-500">Pricing is optional; leave it blank to mark the budget negotiable.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><label className="mb-1.5 block text-sm font-black">Pricing type</label><select value={form.pricingType || ''} onChange={(event) => update('pricingType', (event.target.value || undefined) as PricingType | undefined)} className={input}><option value="">Negotiable</option><option value="project">Per project</option><option value="hour">Per hour</option><option value="day">Per day</option></select></div><div><label className="mb-1.5 block text-sm font-black">Amount</label><input type="number" min="0" step="0.01" value={form.pricingAmount ?? ''} onChange={(event) => update('pricingAmount', event.target.value ? Number(event.target.value) : undefined)} className={input} placeholder="0.00" /><Error field="pricingAmount" /></div><div><label className="mb-1.5 block text-sm font-black">Currency</label><input value={form.pricingCurrency} onChange={(event) => update('pricingCurrency', event.target.value.toUpperCase().slice(0, 8))} className={input} /></div><div><label className="mb-1.5 block text-sm font-black">Expected duration</label><input value={form.expectedDuration} onChange={(event) => update('expectedDuration', event.target.value)} className={input} placeholder="3 days" /></div></div><div className="mt-4"><label className="mb-1.5 block text-sm font-black">Pricing note <span className="font-medium text-slate-400">(optional)</span></label><input value={form.pricingNote || ''} onChange={(event) => update('pricingNote', event.target.value)} className={input} placeholder="Materials included, transport separate..." /></div></div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-6 sm:flex-row"><button type="button" onClick={() => onNavigate('dashboard')} className="min-h-12 flex-1 rounded-full border border-slate-200 text-sm font-black">Cancel</button><button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-black text-white hover:bg-[#073f34]"><Eye className="h-4 w-4" />Review job</button></div>
          </section>
        )}
      </form>
    </main>
  );
}


