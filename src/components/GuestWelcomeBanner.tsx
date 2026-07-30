import React, { useState } from 'react';
import { Briefcase, MapPin, Sparkles, UserRound, Wrench, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface GuestWelcomeBannerProps {
  onOpenGuestModal: (role?: 'worker' | 'employer') => void;
  pageType?: 'jobs' | 'workers' | 'home';
  className?: string;
}

export default function GuestWelcomeBanner({ onOpenGuestModal, pageType = 'home', className = '' }: GuestWelcomeBannerProps) {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(`guest_welcome_dismissed_${pageType}`) === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(`guest_welcome_dismissed_${pageType}`, 'true');
    } catch {
      // Storage fallback
    }
  };

  const getBannerData = () => {
    if (pageType === 'jobs') {
      return {
        badge: t('guest_banner_jobs_badge', 'For Skilled Workers in Qardho'),
        title: t('guest_banner_jobs_title', 'Are You Looking for Skilled Work in Qardho?'),
        desc: t('guest_banner_jobs_desc', 'Qardho Skilled Platform directly connects local carpenters, solar technicians, tailors, electricians & builders with local employers.'),
        primaryRole: 'worker' as const,
        primaryBtnText: 'Join as Worker',
        secondaryRole: 'employer' as const,
        secondaryBtnText: 'Join as Employer',
      };
    }
    if (pageType === 'workers') {
      return {
        badge: t('guest_banner_workers_badge', 'For Employers & Hiring in Qardho'),
        title: t('guest_banner_workers_title', 'Do You Need Skilled Help for Your Project or Home?'),
        desc: t('guest_banner_workers_desc', 'Directly find and hire verified local carpenters, solar technicians, tailors, electricians & builders in Qardho.'),
        primaryRole: 'employer' as const,
        primaryBtnText: 'Join as Employer',
        secondaryRole: 'worker' as const,
        secondaryBtnText: 'Join as Worker',
      };
    }
    return {
      badge: t('guest_banner_home_badge', 'Browsing as a Guest in Qardho'),
      title: t('guest_banner_home_title', 'Are you looking for work or do you need skilled help?'),
      desc: t('guest_banner_home_desc', 'Qardho Skilled Platform directly connects local carpenters, solar technicians, tailors, electricians & builders with local employers.'),
      primaryRole: 'worker' as const,
      primaryBtnText: 'Join as Worker',
      secondaryRole: 'employer' as const,
      secondaryBtnText: 'Join as Employer',
    };
  };

  const data = getBannerData();

  return (
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-900 via-blue-950 to-slate-950 p-4 sm:p-6 text-white shadow-md ${className}`}>
      {/* Background Accent Mesh */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition focus:outline-none"
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pr-8 sm:pr-0">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-300 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>{data.badge}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
            {data.title}
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
            {data.desc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 lg:pt-0">
          <button
            type="button"
            onClick={() => onOpenGuestModal(data.primaryRole)}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white shadow-md transition active:scale-[0.98] ${
              data.primaryRole === 'employer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
            }`}
          >
            {data.primaryRole === 'employer' ? <Briefcase className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            <span>{data.primaryBtnText}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenGuestModal(data.secondaryRole)}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white shadow-md transition active:scale-[0.98] ${
              data.secondaryRole === 'employer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
            }`}
          >
            {data.secondaryRole === 'employer' ? <Briefcase className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            <span>{data.secondaryBtnText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
