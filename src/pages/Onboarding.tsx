import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, DollarSign, FileText, MapPin, Phone, UserRound, Wrench } from 'lucide-react';
import { Job, PricingType, User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface OnboardingProps {
  currentUser: User;
  jobs: Job[];
  onCompleteOnboarding: (updatedUser: User) => void | Promise<void>;
}

export default function Onboarding({ currentUser, jobs, onCompleteOnboarding }: OnboardingProps) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(`onboarding-${currentUser.id}`) || '{}'); } catch { return {}; } })();
  const [step, setStep] = useState(saved.step || 1);
  const [role, setRole] = useState<'worker' | 'employer' | null>(saved.role || null);
  const [name, setName] = useState(saved.name || currentUser.name || '');
  const initialPhone = saved.phone || (currentUser.phone || '').replace(/[^\d]/g, '').replace(/^252/, '');
  const initialWhatsapp = saved.whatsappPhone || (currentUser.whatsappPhone || '').replace(/[^\d]/g, '').replace(/^252/, '');
  const [phone, setPhone] = useState(initialPhone);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState<boolean>(
    saved.whatsappSameAsPhone !== undefined ? saved.whatsappSameAsPhone : (!initialWhatsapp || initialWhatsapp === initialPhone)
  );
  const [whatsappPhone, setWhatsappPhone] = useState(initialWhatsapp || initialPhone);
  const [location, setLocation] = useState(saved.location || currentUser.location || '');
  const [skill, setSkill] = useState(saved.skill || currentUser.skill || '');
  const [bio, setBio] = useState(saved.bio || currentUser.bio || '');
  const [gender, setGender] = useState<User['gender']>(saved.gender || currentUser.gender);
  const [pricingType, setPricingType] = useState<PricingType | ''>(saved.pricingType || currentUser.pricingType || '');
  const [pricingAmount, setPricingAmount] = useState(saved.pricingAmount?.toString() || currentUser.pricingAmount?.toString() || '');
  const [pricingCurrency, setPricingCurrency] = useState(saved.pricingCurrency || currentUser.pricingCurrency || 'USD');
  const [pricingNote, setPricingNote] = useState(saved.pricingNote || currentUser.pricingNote || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/[^\d]/g, '');
    setPhone(digits);
    if (whatsappSameAsPhone) {
      setWhatsappPhone(digits);
    }
  };

  const handleToggleWhatsappSame = (checked: boolean) => {
    setWhatsappSameAsPhone(checked);
    if (checked) {
      setWhatsappPhone(phone);
    }
  };

  const persist = (nextStep = step, overrides: any = {}) => localStorage.setItem(`onboarding-${currentUser.id}`, JSON.stringify({ step: nextStep, role, name, phone, whatsappSameAsPhone, whatsappPhone, location, skill, bio, gender, pricingType, pricingAmount, pricingCurrency, pricingNote, ...overrides }));

  const goNext = () => {
    const next: Record<string, string> = {};
    if (step === 1 && !role) next.role = 'Choose Worker or Employer.';
    if (step === 2) {
      if (!name.trim()) next.name = 'Full name is required.';
      const digits = phone.replace(/\D/g, '');
      if (!digits) next.phone = 'Phone number is required.';
      else if (digits.length < 7) next.phone = 'Enter a valid phone number (e.g. 907123456).';
      if (!whatsappSameAsPhone) {
        const waDigits = whatsappPhone.replace(/\D/g, '');
        if (waDigits && waDigits.length < 7) next.whatsappPhone = 'Enter a valid WhatsApp number.';
      }
      if (!location) next.location = 'Choose your neighborhood.';
      if (!bio.trim()) next.bio = 'Add a short description.';
      if (role === 'worker' && !skill.trim()) next.skill = 'Add your main skill.';
      if (pricingAmount && Number(pricingAmount) < 0) next.pricingAmount = 'Pricing cannot be negative.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const nextStep = Math.min(3, step + 1);
    persist(nextStep);
    setStep(nextStep);
  };

  const finish = async () => {
    if (!role || submitting) return;
    setSubmitting(true);
    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : '+252' + phone.replace(/\D/g, '');
    const activeWhatsapp = whatsappSameAsPhone ? phone : whatsappPhone;
    const formattedWhatsapp = activeWhatsapp.trim()
      ? (activeWhatsapp.trim().startsWith('+') ? activeWhatsapp.trim() : '+252' + activeWhatsapp.replace(/\D/g, ''))
      : undefined;

    try {
      await Promise.resolve(onCompleteOnboarding({ ...currentUser, name: name.trim(), phone: formattedPhone, whatsappPhone: formattedWhatsapp, role, location, bio: bio.trim(), skill: role === 'worker' ? skill.trim() : undefined, availability: role === 'worker' ? currentUser.availability || 'available' : currentUser.availability, gender, pricingType: role === 'worker' && pricingType ? pricingType : undefined, pricingAmount: role === 'worker' && pricingAmount ? Number(pricingAmount) : undefined, pricingCurrency: role === 'worker' ? pricingCurrency : undefined, pricingNote: role === 'worker' ? pricingNote.trim() || undefined : undefined, rate: role === 'worker' && pricingAmount && pricingType ? `${pricingCurrency} ${pricingAmount} / ${pricingType}` : currentUser.rate }));
      localStorage.removeItem(`onboarding-${currentUser.id}`);
    } finally { setSubmitting(false); }
  };

  const input = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10';
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl bg-[#2563eb] p-6 text-white sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#93c5fd]">Account setup</p><h1 className="mt-3 text-3xl font-black">Welcome, {currentUser.name}</h1><p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-brand-50/80">Three short steps help people understand your role, location, experience, and preferred way of working.</p></header>
      <div className="mt-6 grid grid-cols-3 gap-2">{['Choose role', 'Profile details', 'Review'].map((label, index) => <div key={label} className={`rounded-xl border p-3 ${step > index + 1 ? 'border-brand-200 bg-brand-50 text-brand-800' : step === index + 1 ? 'border-[#3b82f6] bg-[#3b82f6] text-white' : 'border-slate-200 bg-white text-slate-400'}`}><span className="text-[10px] font-black uppercase">Step {index + 1}</span><span className="mt-1 flex items-center gap-1 text-xs font-black">{step > index + 1 && <Check className="h-3.5 w-3.5" />}{label}</span></div>)}</div>

      <section className="mt-6 rounded-3xl border border-brand-950/10 bg-white p-5 shadow-sm sm:p-7">
        {step === 1 && <div><h2 className="text-2xl font-black">How will you use the platform?</h2><p className="mt-2 text-sm text-slate-600">You can switch later from Profile More Settings.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[{ value: 'worker' as const, title: 'Skilled Worker', detail: 'Build a profile, review job details, and send applications.', Icon: UserRound }, { value: 'employer' as const, title: 'Employer', detail: 'Find workers, post jobs, and review applications.', Icon: BriefcaseBusiness }].map(({ value, title, detail, Icon }) => <button key={value} onClick={() => { setRole(value); setErrors({}); persist(2, { role: value }); setTimeout(() => setStep(2), 250); }} className={`min-h-40 rounded-2xl border-2 p-5 text-left transition ${role === value ? 'border-[#3b82f6] bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}><Icon className="h-7 w-7 text-[#3b82f6]" /><span className="mt-5 block text-lg font-black">{title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{detail}</span></button>)}</div>{errors.role && <p className="mt-3 text-sm font-bold text-rose-600">{errors.role}</p>}</div>}

        {step === 2 && <div><h2 className="text-2xl font-black">Complete the useful details</h2><p className="mt-2 text-sm text-slate-600">Required fields are marked. WhatsApp, pricing, and gender are optional.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-black">Full Name *</label><div className="relative"><UserRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={name} onChange={(event) => setName(event.target.value)} className={`${input} pl-11`} placeholder="Your full name" /></div>{errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}</div><div><label className="mb-1.5 block text-sm font-black">Primary Phone Number *</label><div className="flex min-h-11 w-full rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-brand-500/10"><span className="flex items-center gap-1.5 bg-slate-100 px-3 text-sm font-bold text-slate-700 border-r border-slate-200"><Phone className="h-4 w-4 text-slate-400" />+252</span><input value={phone} onChange={(event) => handlePhoneChange(event.target.value)} className="w-full px-4 text-sm font-semibold outline-none" placeholder="90xxxxxxx" /></div>{errors.phone && <p className="mt-1 text-xs font-bold text-rose-600">{errors.phone}</p>}</div><div className="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><label className="text-sm font-black text-slate-900">WhatsApp Number</label><label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3b82f6] hover:underline"><input type="checkbox" checked={whatsappSameAsPhone} onChange={(e) => handleToggleWhatsappSame(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6]" />Same as primary phone number</label></div>{!whatsappSameAsPhone ? (<div className="mt-2 flex min-h-11 w-full rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-brand-500/10"><span className="flex items-center gap-1.5 bg-slate-100 px-3 text-sm font-bold text-slate-700 border-r border-slate-200">+252</span><input value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value.replace(/[^\d]/g, ''))} className="w-full px-4 text-sm font-semibold outline-none" placeholder="90xxxxxxx" /></div>) : (<p className="mt-2 text-xs font-semibold text-slate-500">Will use <span className="font-mono font-bold text-slate-800">+252 {phone || '...'}</span> for WhatsApp contacts.</p>)}{errors.whatsappPhone && <p className="mt-1 text-xs font-bold text-rose-600">{errors.whatsappPhone}</p>}</div><div><label className="mb-1.5 block text-sm font-black">Neighborhood *</label><div className="relative"><MapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><select value={location} onChange={(event) => setLocation(event.target.value)} className={`${input} pl-11`}><option value="">Choose neighborhood</option>{QARDHO_NEIGHBORHOODS.map((item) => <option key={item}>{item}</option>)}</select></div>{errors.location && <p className="mt-1 text-xs font-bold text-rose-600">{errors.location}</p>}</div><div><label className="mb-1.5 block text-sm font-black">Gender <span className="font-medium text-slate-400">(optional)</span></label><select value={gender || ''} onChange={(event) => setGender((event.target.value || undefined) as User['gender'])} className={input}><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>{role === 'worker' && <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-black">Main skill *</label><div className="relative"><Wrench className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={skill} onChange={(event) => setSkill(event.target.value)} className={`${input} pl-11`} placeholder="Solar technician, mason, tailor..." /></div>{errors.skill && <p className="mt-1 text-xs font-bold text-rose-600">{errors.skill}</p>}</div>}<div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-black">{role === 'worker' ? 'Work bio' : 'Employer description'} *</label><div className="relative"><FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" /><textarea rows={5} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium leading-6 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" placeholder="Explain your experience, tools, needs, or typical work." /></div>{errors.bio && <p className="mt-1 text-xs font-bold text-rose-600">{errors.bio}</p>}</div></div>
          {role === 'worker' && <fieldset className="mt-6 rounded-2xl border border-slate-100 p-4"><legend className="px-2 text-sm font-black">Optional pricing</legend><div className="grid gap-3 sm:grid-cols-3"><select value={pricingType} onChange={(event) => setPricingType(event.target.value as PricingType | '')} className={input}><option value="">No pricing type</option><option value="project">Per project</option><option value="hour">Per hour</option><option value="day">Per day</option></select><div className="relative"><DollarSign className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input type="number" min="0" step="0.01" value={pricingAmount} onChange={(event) => setPricingAmount(event.target.value)} className={`${input} pl-11`} placeholder="Amount" /></div><input value={pricingCurrency} onChange={(event) => setPricingCurrency(event.target.value.toUpperCase().slice(0, 8))} className={input} aria-label="Currency" /></div><input value={pricingNote} onChange={(event) => setPricingNote(event.target.value)} className={`${input} mt-3`} placeholder="Optional pricing note" />{errors.pricingAmount && <p className="mt-1 text-xs font-bold text-rose-600">{errors.pricingAmount}</p>}</fieldset>}</div>}

        {step === 3 && <div><Check className="h-8 w-8 text-[#3b82f6]" /><h2 className="mt-4 text-2xl font-black">Your setup is ready</h2><p className="mt-2 text-sm text-slate-600">Review the summary, then continue to the main page for your role.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Full Name</span><p className="mt-1 font-black">{name}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Phone Number</span><p className="mt-1 font-black">+252 {phone}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">WhatsApp Number</span><p className="mt-1 font-black">+252 {whatsappSameAsPhone ? phone : whatsappPhone}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Role</span><p className="mt-1 font-black capitalize">{role}</p></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Location</span><p className="mt-1 font-black">{location}</p></div>{role === 'worker' && <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Main Skill</span><p className="mt-1 font-black">{skill}</p></div>}{role === 'worker' && <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Price / Rate</span><p className="mt-1 font-black">{pricingAmount && pricingType ? `${pricingCurrency} ${pricingAmount} / ${pricingType}${pricingNote ? ` (${pricingNote})` : ''}` : 'Not specified'}</p></div>}<div className="sm:col-span-2 rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">{role === 'worker' ? 'Work Bio' : 'Employer Description'}</span><p className="mt-1 font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">{bio}</p></div></div></div>}

        <div className="mt-8 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row"><button type="button" onClick={() => { const next = Math.max(1, step - 1); persist(next); setStep(next); }} disabled={step === 1 || submitting} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-black disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Back</button>{step < 3 ? <button type="button" onClick={goNext} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] text-sm font-black text-white">Continue<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={finish} disabled={submitting} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] text-sm font-black text-white disabled:opacity-60">{submitting ? 'Saving...' : role === 'worker' ? 'Finish and browse jobs' : 'Finish and find workers'}<ArrowRight className="h-4 w-4" /></button>}</div>
      </section>
    </main>
  );
}


