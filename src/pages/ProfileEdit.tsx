import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, DollarSign, FileText, MapPin, Phone, Save, Upload, UserRound, Wrench } from 'lucide-react';
import { PricingType, User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';
import Avatar from '../components/Avatar';
import { useClerk } from '@clerk/react';

interface ProfileEditProps {
  currentUser: User;
  onUpdateProfile: (updatedProfile: User) => void | Promise<void>;
  onAvatarUpdated?: (user: User) => void;
  onNavigate: (page: string) => void;
}

export default function ProfileEdit({
  currentUser,
  onUpdateProfile,
  onAvatarUpdated,
  onNavigate,
}: ProfileEditProps) {
  const { openUserProfile } = useClerk();

  const rawPhone = (currentUser.phone || '').replace(/[^\d]/g, '').replace(/^252/, '');
  const rawWhatsapp = (currentUser.whatsappPhone || '').replace(/[^\d]/g, '').replace(/^252/, '');

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(rawPhone);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState<boolean>(!rawWhatsapp || rawWhatsapp === rawPhone);
  const [whatsappPhone, setWhatsappPhone] = useState(rawWhatsapp || rawPhone);
  const [location, setLocation] = useState(currentUser.location || '');
  const [skill, setSkill] = useState(currentUser.skill || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [gender, setGender] = useState<User['gender']>(currentUser.gender);
  const [pricingType, setPricingType] = useState<PricingType | ''>(currentUser.pricingType || '');
  const [pricingAmount, setPricingAmount] = useState(currentUser.pricingAmount?.toString() || '');
  const [pricingCurrency, setPricingCurrency] = useState(currentUser.pricingCurrency || 'USD');
  const [pricingNote, setPricingNote] = useState(currentUser.pricingNote || '');
  const [availability, setAvailability] = useState(currentUser.availability || 'available');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim() || !phone.trim()) {
      setSaveError('Name and primary phone number are required.');
      return;
    }
    if (pricingAmount && Number(pricingAmount) < 0) {
      setSaveError('Pricing amount cannot be negative.');
      return;
    }

    const formattedPhone = '+252' + phone.replace(/\D/g, '');
    const activeWhatsapp = whatsappSameAsPhone ? phone : whatsappPhone;
    const formattedWhatsapp = activeWhatsapp.trim()
      ? '+252' + activeWhatsapp.replace(/\D/g, '')
      : undefined;

    const updated: User = {
      ...currentUser,
      name: name.trim(),
      phone: formattedPhone,
      whatsappPhone: formattedWhatsapp,
      location,
      skill: currentUser.role === 'worker' ? skill.trim() : undefined,
      bio: bio.trim(),
      rate: currentUser.role === 'worker' && pricingAmount && pricingType ? `${pricingCurrency} ${pricingAmount} / ${pricingType}` : currentUser.rate,
      availability: currentUser.role === 'worker' ? availability : currentUser.availability,
      gender,
      pricingType: pricingType || undefined,
      pricingAmount: pricingAmount ? Number(pricingAmount) : undefined,
      pricingCurrency,
      pricingNote: pricingNote.trim() || undefined,
    };

    setIsSaving(true);
    setSaveError('');
    try {
      await Promise.resolve(onUpdateProfile(updated));
      setSuccessMsg('Profile saved successfully.');
      setTimeout(() => {
        setSuccessMsg('');
        onNavigate('profile');
      }, 800);
    } catch {
      setSaveError('Could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isWorker = currentUser.role === 'worker';
  const inputClass = 'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 sm:pb-12">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
          <span className="text-xs font-bold text-slate-400">Editing Profile</span>
        </div>

        <header className="mb-6 rounded-2xl bg-[#2563eb] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#93c5fd]">Profile Setup</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Edit Your Profile Information</h1>
          <p className="mt-2 max-w-xl text-xs font-medium text-brand-50/80 sm:text-sm">
            Keep your details up to date so employers and workers can easily discover and connect with you.
          </p>
        </header>

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200 p-4 text-sm font-bold text-brand-800">
            <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-800">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Profile Picture Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Profile Picture</h2>
            <p className="mt-1 text-xs text-slate-500">Manage your profile picture securely through your account.</p>

            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <Avatar
                  name={currentUser.name}
                  src={currentUser.avatarUrl}
                  size="xl"
                  eager
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => openUserProfile?.()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white hover:bg-[#1d4ed8] transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Change Photo</span>
                  </button>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Profile pictures are hosted securely on Clerk's cloud CDN.</p>
              </div>
            </div>
          </section>

          {/* 2. Basic Information */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Basic Information</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                  Full Name *
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} pl-11`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                  Gender <span className="font-medium text-slate-400">(optional)</span>
                </label>
                <select
                  value={gender || ''}
                  onChange={(e) => setGender((e.target.value || undefined) as User['gender'])}
                  className={inputClass}
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                  Neighborhood *
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${inputClass} pl-11`}
                  >
                    <option value="">Choose neighborhood</option>
                    {QARDHO_NEIGHBORHOODS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isWorker && (
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Work Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="available">Available for work</option>
                    <option value="busy">Currently busy / unavailable</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* 3. Professional Details */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Professional Profile</h2>

            <div className="mt-4 space-y-4">
              {isWorker && (
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Primary Skill / Occupation *
                  </label>
                  <div className="relative">
                    <Wrench className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="e.g. Solar technician, mason, electrician..."
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                  {isWorker ? 'About Me' : 'About the Company'} *
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 leading-relaxed outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10"
                    placeholder={
                      isWorker
                        ? 'Describe your experience, specialized skills, tools, and background...'
                        : 'Describe your company, hiring needs, and typical work projects...'
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Pricing (for Worker) */}
          {isWorker && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-lg font-black text-slate-900">Rates & Pricing</h2>
              <p className="mt-1 text-xs text-slate-500">Structured pricing helps clients understand your rates upfront.</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Rate Type
                  </label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as PricingType | '')}
                    className={inputClass}
                  >
                    <option value="">Negotiable</option>
                    <option value="project">Per project</option>
                    <option value="hour">Per hour</option>
                    <option value="day">Per day</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingAmount}
                      onChange={(e) => setPricingAmount(e.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Currency
                  </label>
                  <input
                    value={pricingCurrency}
                    onChange={(e) => setPricingCurrency(e.target.value.toUpperCase().slice(0, 8))}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                    Pricing Note <span className="font-medium text-slate-400">(optional)</span>
                  </label>
                  <input
                    value={pricingNote}
                    onChange={(e) => setPricingNote(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Includes basic equipment, travel costs separate..."
                  />
                </div>
              </div>
            </section>
          )}

          {/* 5. Contact Information */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Contact Information</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-600">
                  Primary Phone Number *
                </label>
                <div className="flex min-h-12 w-full rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-brand-500/10">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-3 text-sm font-bold text-slate-700 border-r border-slate-200">
                    <Phone className="h-4 w-4 text-slate-400" />
                    +252
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-4 text-sm font-semibold outline-none"
                    placeholder="90xxxxxxx"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase text-slate-900">WhatsApp Number</label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3b82f6]">
                    <input
                      type="checkbox"
                      checked={whatsappSameAsPhone}
                      onChange={(e) => handleToggleWhatsappSame(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    Same as primary phone number
                  </label>
                </div>
                {!whatsappSameAsPhone ? (
                  <div className="mt-3 flex min-h-12 w-full rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-brand-500/10">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 text-sm font-bold text-slate-700 border-r border-slate-200">
                      +252
                    </span>
                    <input
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-4 text-sm font-semibold outline-none"
                      placeholder="90xxxxxxx"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Will use <span className="font-mono font-bold text-slate-800">+252 {phone || '...'}</span> for WhatsApp actions.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Desktop Actions */}
          <div className="hidden sm:flex sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2563eb] px-8 text-sm font-black text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>

          {/* Mobile Sticky Save Bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-xs font-black text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
