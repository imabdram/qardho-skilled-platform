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

  const getBannerConfig = () => {
    if (pageType === 'jobs') {
      return {
        badge: t('guest_banner_jobs_badge', 'For Skilled Workers in Qardho'),
        title: t('guest_banner_jobs_title', 'Are You Looking for Skilled Work in Qardho?'),
        desc: t('guest_banner_jobs_desc', 'Qardho Skilled Platform directly connects local carpenters, solar technicians, tailors, electricians & builders with local employers.'),
        role: 'worker' as const,
        btnText: 'Join as Worker',
        borderClass: 'border-emerald-500/50',
        bgClass: 'bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-900',
        badgeClass: 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300',
        sparkleClass: 'text-emerald-400',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20',
        Icon: Wrench,
      };
    }
    if (pageType === 'workers') {
      return {
        badge: t('guest_banner_workers_badge', 'For Employers & Hiring in Qardho'),
        title: t('guest_banner_workers_title', 'Do You Need Skilled Help for Your Project or Home?'),
        desc: t('guest_banner_workers_desc', 'Directly find and hire verified local carpenters, solar technicians, tailors, electricians & builders in Qardho.'),
        role: 'employer' as const,
        btnText: 'Join as Employer',
        borderClass: 'border-blue-500/50',
        bgClass: 'bg-gradient-to-r from-blue-950 via-slate-950 to-blue-900',
        badgeClass: 'bg-blue-500/20 border border-blue-400/30 text-blue-300',
        sparkleClass: 'text-blue-400',
        btnClass: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-950/20',
        Icon: Briefcase,
      };
    }
    return {
      badge: t('guest_banner_home_badge', 'Browsing as a Guest in Qardho'),
      title: t('guest_banner_home_title', 'Are you looking for work or do you need skilled help?'),
      desc: t('guest_banner_home_desc', 'Qardho Skilled Platform directly connects local carpenters, solar technicians, tailors, electricians & builders with local employers.'),
      role: 'worker' as const,
      btnText: 'Join as Worker',
      borderClass: 'border-blue-500/50',
      bgClass: 'bg-gradient-to-r from-blue-950 via-slate-950 to-slate-900',
      badgeClass: 'bg-blue-500/20 border border-blue-400/30 text-blue-300',
      sparkleClass: 'text-blue-400',
      btnClass: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-950/20',
      Icon: Wrench,
    };
  };

  const config = getBannerConfig();
  const BtnIcon = config.Icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 ${config.borderClass} ${config.bgClass} p-4 sm:p-6 text-white shadow-md ${className}`}>
      {/* Background Accent Mesh */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

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
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md ${config.badgeClass}`}>
            <Sparkles className={`h-3 w-3 ${config.sparkleClass}`} />
            <span>{config.badge}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
            {config.title}
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
            {config.desc}
          </p>
        </div>

        <div className="flex items-center shrink-0 pt-1 lg:pt-0">
          <button
            type="button"
            onClick={() => onOpenGuestModal(config.role)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-xs sm:text-sm font-black shadow-md transition active:scale-[0.98] ${config.btnClass}`}
          >
            <BtnIcon className="h-4 w-4" />
            <span>{config.btnText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
