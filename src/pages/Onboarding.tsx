import React, { useMemo, useState } from 'react';
import { User, MapPin, Briefcase, DollarSign, FileText, ArrowRight, Check, Building2, Search } from 'lucide-react';
import { User as UserType } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface OnboardingProps {
  currentUser: UserType;
  onCompleteOnboarding: (updatedUser: UserType) => void;
}

type FieldErrors = Partial<Record<'role' | 'location' | 'skill' | 'rate' | 'bio', string>>;

export default function Onboarding({ currentUser, onCompleteOnboarding }: OnboardingProps) {
  const [role, setRole] = useState<'worker' | 'employer' | null>(currentUser.role === 'worker' || currentUser.role === 'employer' ? currentUser.role : null);
  const [skill, setSkill] = useState(currentUser.skill || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [rate, setRate] = useState(currentUser.rate || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { label: 'Choose role', done: !!role },
    { label: 'Complete profile', done: !!location.trim() && !!bio.trim() && (role !== 'worker' || (!!skill.trim() && !!rate.trim())) },
    { label: role === 'employer' ? 'Post first job' : 'Browse jobs', done: false },
  ];

  const nextAction = useMemo(() => {
    if (role === 'worker') {
      return {
        icon: Search,
        title: 'Next: Browse open jobs',
        detail: 'After setup, you will go to job listings so you can apply with your completed worker profile.',
      };
    }
    if (role === 'employer') {
      return {
        icon: Building2,
        title: 'Next: Post your first job',
        detail: 'After setup, you will go straight to the job form so workers can apply.',
      };
    }
    return {
      icon: ArrowRight,
      title: 'Next action appears after role choice',
      detail: 'Choose Worker or Employer to see the first useful screen for your account.',
    };
  }, [role]);

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors: FieldErrors = {};
    if (!role) nextErrors.role = 'Choose Worker or Employer.';
    if (!location.trim()) nextErrors.location = 'Choose your Qardho neighborhood.';
    if (!bio.trim()) nextErrors.bio = role === 'worker' ? 'Add a short work bio.' : 'Add a short employer description.';
    if (role === 'worker' && !skill.trim()) nextErrors.skill = 'Trade skill is required for workers.';
    if (role === 'worker' && !rate.trim()) nextErrors.rate = 'Expected rate is required for workers.';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !role) return;

    setIsSubmitting(true);
    try {
      const updatedUser: UserType = {
        ...currentUser,
        role,
        location: location.trim(),
        skill: role === 'worker' ? skill.trim() : undefined,
        rate: role === 'worker' ? rate.trim() : undefined,
        availability: role === 'worker' ? (currentUser.availability || 'available') : currentUser.availability,
        bio: bio.trim(),
      };

      await Promise.resolve(onCompleteOnboarding(updatedUser));
    } finally {
      setIsSubmitting(false);
    }
  };

  const NextIcon = nextAction.icon;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" id="onboarding-page">
      <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-wider text-blue-300">Profile setup</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Welcome, {currentUser.name}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
          Choose your role, finish the fields people need to trust you, then continue to the first action for that role.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.label} className={`rounded-xl border px-4 py-3 ${step.done ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : index === 2 && role ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-slate-100 bg-white text-slate-500'}`}>
            <span className="block text-[10px] font-black uppercase tracking-wider">Step {index + 1}</span>
            <span className="mt-1 flex items-center gap-2 text-sm font-black">
              {step.done && <Check className="h-4 w-4" />}
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]" noValidate>
        <section className="space-y-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs sm:p-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Choose Role</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: 'worker' as const, title: 'Skilled Worker', detail: 'Apply to jobs and show your trade profile.', Icon: User },
                { key: 'employer' as const, title: 'Employer', detail: 'Post jobs and review applicants.', Icon: Building2 },
              ].map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => { setRole(option.key); clearFieldError('role'); }}
                  className={`min-h-32 rounded-xl border-2 p-4 text-left transition ${role === option.key ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700 shadow-xs"><option.Icon className="h-5 w-5" /></span>
                    {role === option.key && <span className="rounded-full bg-blue-600 p-1 text-white"><Check className="h-3 w-3" /></span>}
                  </span>
                  <span className="mt-3 block text-base font-black text-slate-950">{option.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{option.detail}</span>
                </button>
              ))}
            </div>
            {fieldErrors.role && <p className="mt-2 text-[11px] font-semibold text-red-600">{fieldErrors.role}</p>}
          </div>

          {role && (
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Complete Profile</h2>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Neighborhood *</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <select value={location} onChange={(e) => { setLocation(e.target.value); clearFieldError('location'); }} className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.location ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
                    <option value="">Select neighborhood</option>
                    {QARDHO_NEIGHBORHOODS.map((neighborhood) => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}
                  </select>
                </div>
                {fieldErrors.location && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.location}</p>}
              </div>

              {role === 'worker' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Trade skill *</label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input value={skill} onChange={(e) => { setSkill(e.target.value); clearFieldError('skill'); }} placeholder="Solar technician, mason, tailor..." className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.skill ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`} />
                    </div>
                    {fieldErrors.skill && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.skill}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Expected rate *</label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input value={rate} onChange={(e) => { setRate(e.target.value); clearFieldError('rate'); }} placeholder="$20 / day or $150 total" className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.rate ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`} />
                    </div>
                    {fieldErrors.rate && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.rate}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">{role === 'worker' ? 'Work bio' : 'Employer description'} *</label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea value={bio} onChange={(e) => { setBio(e.target.value); clearFieldError('bio'); }} rows={4} placeholder={role === 'worker' ? 'Describe your experience, tools, and work style.' : 'Describe your household, farm, school, or business needs.'} className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.bio ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`} />
                </div>
                {fieldErrors.bio && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.bio}</p>}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <NextIcon className="h-5 w-5 text-blue-700" />
            <h2 className="mt-3 text-sm font-black text-blue-950">{nextAction.title}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-blue-800">{nextAction.detail}</p>
          </div>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/15 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300" id="onboarding-submit-btn">
            <span>{isSubmitting ? 'Saving setup...' : role === 'employer' ? 'Finish and Post Job' : role === 'worker' ? 'Finish and Browse Jobs' : 'Complete Setup'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </form>
    </main>
  );
}
