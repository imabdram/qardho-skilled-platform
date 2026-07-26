import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, CheckCircle2, Clock3, DollarSign, Lock, MapPin, MessageCircle, UserRound } from 'lucide-react';
import { Application, Job, User } from '../types';
import { PAGE_ROUTES } from '../routes';

interface JobDetailProps {
  job?: Job;
  currentUser: User | null;
  applications: Application[];
  onApply: (job: Job) => void;
  onNavigate: (page: string) => void;
}

const formatDate = (date?: string) => {
  if (!date) return 'Recent';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
};

const statusStyles = {
  pending: 'border-amber-100 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  declined: 'border-rose-100 bg-rose-50 text-rose-700',
};

export default function JobDetail({ job, currentUser, applications, onApply, onNavigate }: JobDetailProps) {
  if (!job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
          <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-xl font-black text-slate-950">Job not found</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">This job link may be old, closed, or unavailable.</p>
          <Link to={PAGE_ROUTES.jobs} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800">
            Browse jobs
          </Link>
        </div>
      </main>
    );
  }

  const myApplication = currentUser?.role === 'worker'
    ? applications.find((app) => app.jobId === job.id && app.applicantId === currentUser.id)
    : undefined;
  const isOwner = currentUser?.id === job.employerId;
  const canApply = !!currentUser && currentUser.role === 'worker' && job.status === 'open' && !myApplication;
  const reviewed = applications.some((app) => app.jobId === job.id && app.status === 'accepted');
  const timeline = [
    { label: 'Posted', done: true },
    { label: 'Applied', done: !!myApplication || reviewed },
    { label: 'Accepted', done: !!job.assignedWorkerId || myApplication?.status === 'accepted' },
    { label: 'In progress', done: ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status) },
    { label: 'Completed', done: job.status === 'completed' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <button onClick={() => onNavigate('jobs')} className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </button>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Shareable job detail</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{job.title}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">Posted by {job.employerName}</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase text-slate-700">
              {job.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 p-4">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Location</span>
                <span className="text-sm font-bold text-slate-900">Qardho - {job.location}</span>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Offer</span>
                <span className="text-sm font-bold text-slate-900">{job.rate}</span>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Posted</span>
                <span className="text-sm font-bold text-slate-900">{formatDate(job.createdAt)}</span>
              </div>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-950">Full description</h2>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{job.description}</p>
            </div>

            {job.requirements && <div><h2 className="text-base font-black text-slate-950">Requirements</h2><p className="mt-3 whitespace-pre-line rounded-xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-700">{job.requirements}</p></div>}

            {(job.category || job.workType || job.expectedDuration) && <div className="grid gap-3 sm:grid-cols-3">
              {job.category && <div className="rounded-xl border border-slate-100 p-4"><Briefcase className="h-4 w-4 text-[#008060]" /><span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Category</span><span className="text-sm font-bold text-slate-900">{job.category}</span></div>}
              {job.workType && <div className="rounded-xl border border-slate-100 p-4"><UserRound className="h-4 w-4 text-[#008060]" /><span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Work type</span><span className="text-sm font-bold text-slate-900">{job.workType}</span></div>}
              {job.expectedDuration && <div className="rounded-xl border border-slate-100 p-4"><Clock3 className="h-4 w-4 text-[#008060]" /><span className="mt-2 block text-[10px] font-black uppercase text-slate-400">Expected duration</span><span className="text-sm font-bold text-slate-900">{job.expectedDuration}</span></div>}
            </div>}

            <div>
              <h2 className="text-base font-black text-slate-950">Status timeline</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {timeline.map((step) => (
                  <div key={step.label} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black uppercase ${step.done ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400'}`}>
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-black text-slate-950">Employer</h2>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">{job.employerName}</p>
              {job.phone && myApplication?.status === 'accepted' ? <a href={`https://wa.me/${job.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, my name is ${currentUser?.name}. I am contacting you through Qardho Skilled Platform regarding the job "${job.title}". My application has been accepted, and I would like to discuss the next steps.`)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-xs font-black text-slate-950"><MessageCircle className="h-4 w-4" />Contact on WhatsApp</a> : <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-800"><Lock className="mr-1.5 inline h-3.5 w-3.5" />Contact unlocks after an accepted application.</div>}
            </div>

            {myApplication && (
              <div className={`rounded-xl border p-4 ${statusStyles[myApplication.status]}`}>
                <p className="text-[10px] font-black uppercase tracking-wider">Your application</p>
                <p className="mt-1 text-sm font-black capitalize">{myApplication.status === 'pending' ? 'Waiting for employer response' : myApplication.status}</p>
              </div>
            )}

            {isOwner ? (
              <button onClick={() => onNavigate('dashboard')} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 hover:bg-blue-100">
                Manage in dashboard
              </button>
            ) : (
              <button
                onClick={() => onApply(job)}
                disabled={!!currentUser && !canApply}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                {!currentUser ? 'Log in to apply' : myApplication ? `Already applied: ${myApplication.status}` : job.status === 'open' ? 'Apply for this job' : 'Not accepting applications'}
              </button>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

