import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignUpButton } from '@clerk/react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Construction,
  DollarSign,
  GraduationCap,
  Hammer,
  Leaf,
  MapPin,
  Plug,
  Scissors,
  Search,
  ShieldCheck,
  Star,
  SunMedium,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Job, Review, User } from '../types';
import { PAGE_ROUTES } from '../routes';
import { useLanguage } from '../LanguageContext';

interface LandingProps {
  workers: User[];
  jobs: Job[];
  reviews: Review[];
  workersCount: number;
  jobsCount: number;
  onNavigate: (page: string) => void;
  onViewWorkerProfile: (worker: User) => void;
  currentUser: User | null;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

interface CategoryConfig {
  name: string;
  key: string;
  aliases: string[];
  icon: LucideIcon;
}

interface HeroSlide {
  src: string;
  alt: string;
  position?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/assets/xirfad-qardho-tradesman-hero.webp',
    alt: 'Skilled tradesman and worker in Qardho',
    position: 'center right',
  },
  {
    src: '/assets/auth-gallery-solar.webp',
    alt: 'Solar energy technician working on panels in Qardho',
    position: 'center center',
  },
  {
    src: '/assets/auth-gallery-construction.webp',
    alt: 'Construction worker building on site in Qardho',
    position: 'center center',
  },
  {
    src: '/assets/auth-gallery-tailoring.webp',
    alt: 'Skilled tailor working on fabrics in Qardho',
    position: 'center center',
  },
  {
    src: '/assets/auth-gallery-teaching-farming.webp',
    alt: 'Agriculture and local worker in Qardho',
    position: 'center center',
  },
];

const categoryConfig: CategoryConfig[] = [
  { name: 'Plumbing', key: 'cat_plumbing', aliases: ['plumb', 'pipe'], icon: Wrench },
  { name: 'Electrical Work', key: 'cat_electrical', aliases: ['electric'], icon: Plug },
  { name: 'Solar Installation', key: 'cat_solar', aliases: ['solar'], icon: SunMedium },
  { name: 'Construction', key: 'cat_construction', aliases: ['mason', 'builder', 'construction'], icon: Construction },
  { name: 'Tailoring', key: 'cat_tailoring', aliases: ['tailor'], icon: Scissors },
  { name: 'Teaching', key: 'cat_teaching', aliases: ['teacher', 'tutor'], icon: GraduationCap },
  { name: 'Farming', key: 'cat_farming', aliases: ['farm', 'agric'], icon: Leaf },
  { name: 'General Repair', key: 'cat_repair', aliases: ['repair', 'labor', 'general'], icon: Hammer },
];

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
};

const getInitials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();

function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      {eyebrow && <p className="text-xs font-black text-[#2563eb] uppercase tracking-[0.18em]">{eyebrow}</p>}
      <h2 className="font-display mt-2 text-2xl sm:text-3xl font-black text-[#111615]">{title}</h2>
      {description && <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600">{description}</p>}
    </div>
  );
}

function CategoryCard({ category, count }: { category: CategoryConfig; count: number }) {
  const { t } = useLanguage();
  const Icon = category.icon;
  const countLabel = count === 1 ? t('landing_worker_count_singular') : t('landing_worker_count_plural');
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-950">{t(category.key, category.name)}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{count} {countLabel}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ audience, accent, icon: Icon, steps, cta, to }: { audience: string; accent: 'blue' | 'green'; icon: LucideIcon; steps: string[]; cta: string; to: string }) {
  const styles = { icon: 'bg-blue-50 text-[#2563eb]', marker: 'bg-[#2563eb] text-white', button: 'bg-[#2563eb] text-white shadow-sm hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb]' };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-black text-slate-950">{audience}</h3>
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-sm font-medium leading-6 text-slate-650">
            <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${styles.marker}`}>{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto pt-6">
        {to === PAGE_ROUTES.register ? (
          <SignUpButton mode="modal">
            <button
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${styles.button}`}
            >
              {cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </SignUpButton>
        ) : (
          <Link
            to={to}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${styles.button}`}
          >
            {cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function FeaturedWorkerCard({ worker, reviews, onView }: { worker: User; reviews: Review[]; onView: () => void }) {
  const { t } = useLanguage();
  const workerReviews = reviews.filter(review => review.workerId === worker.id);
  const avgRating = workerReviews.length > 0
    ? (workerReviews.reduce((sum, review) => sum + review.rating, 0) / workerReviews.length).toFixed(1)
    : null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:border-[#2563eb] hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
          {getInitials(worker.name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-950">{worker.name}</h3>
          {worker.skill && <p className="mt-1 truncate text-sm font-semibold text-[#2563eb]">{worker.skill}</p>}
          {worker.location && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{worker.location}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {avgRating && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
            {avgRating} ({workerReviews.length})
          </span>
        )}
        {worker.rate && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-900"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" />{worker.rate}</span>}
        {worker.availability && <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700">{worker.availability}</span>}
      </div>
      {worker.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{worker.bio}</p>}
      <button
        onClick={onView}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-[#2563eb] hover:bg-[#2563eb] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
      >
        {t('landing_view_profile')}
      </button>
    </article>
  );
}

function JobPreviewCard({ job, onView }: { job: Job; onView: () => void }) {
  const { t } = useLanguage();
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:border-[#2563eb] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black leading-6 text-slate-950">{job.title}</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{formatDate(job.createdAt)}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-900">{job.status.replace('_', ' ')}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1"><MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{job.location}</span>
        {job.rate && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-900"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" />{job.rate}</span>}
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
      <button
        onClick={onView}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
      >
        {t('landing_view_job')}
      </button>
    </article>
  );
}

export default function Landing({ workers, jobs, reviews, workersCount, jobsCount, onNavigate, onViewWorkerProfile, currentUser, onOpenGuestModal }: LandingProps & { onOpenGuestModal?: (role?: 'worker' | 'employer', summary?: any) => void }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Pause carousel on document hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto slide loop (6 seconds)
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;

    if (deltaX > 40) {
      handleNext();
    } else if (deltaX < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const categoryCounts = useMemo(() => categoryConfig.map(category => ({
    category,
    count: workers.filter(worker => {
      const skill = (worker.skill || '').toLowerCase();
      return category.aliases.some(alias => skill.includes(alias));
    }).length,
  })), [workers]);

  const featuredWorkers = useMemo(() => workers.slice(0, 4), [workers]);
  const recentJobs = useMemo(() => [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3), [jobs]);

  return (
    <div className="bg-[#f8fafc]" id="landing-page-container">
      {/* Simplified Dual-Role Hero Section */}
      <section
        dir="ltr"
        className="relative flex min-h-[580px] sm:min-h-[640px] items-center overflow-hidden bg-[#0a192f] text-white [direction:ltr] py-10 sm:py-14"
        aria-labelledby="hero-heading"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Images Carousel */}
        <div className="absolute inset-0 z-0 bg-[#0a192f]">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={idx !== currentIndex}
            >
              <img
                src={slide.src}
                alt=""
                loading={idx === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
                style={{ objectPosition: slide.position || 'center' }}
              />
            </div>
          ))}

          {/* Vignette Overlay for High Contrast */}
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#0a192f]/90 via-[#0a192f]/95 to-[#0a192f]" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-30 mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Title & Location Badge */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/60 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-300 backdrop-blur-md shadow-xs">
              <MapPin className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>{t('hero_badge')}</span>
            </div>

            <h1 id="hero-heading" className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
              {t('hero_simple_title', 'Find Local Skilled Work or Hire Trusted Talent in Qardho')}
            </h1>

            <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-200 max-w-2xl mx-auto">
              {t('hero_simple_subtitle', 'Whether you have a trade skill or need work done, Qardho Skilled Platform connects you directly.')}
            </p>
          </div>

          {/* Dual Role Choice Cards (Worker vs Employer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto pt-2">
            {/* Role Card 1: Skilled Worker */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-7 backdrop-blur-md transition duration-300 hover:border-blue-400 hover:bg-white/15 hover:shadow-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                    <Wrench className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-300 border border-blue-400/20">
                    For Workers
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-300 transition">
                  {t('hero_card_worker_title', 'I am a Skilled Worker')}
                </h2>

                <p className="text-sm font-medium leading-relaxed text-slate-200">
                  {t('hero_card_worker_desc', 'Showcase your trade skills, get hired by local employers, and build your reputation in Qardho.')}
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser && onOpenGuestModal) {
                      onOpenGuestModal('worker');
                    } else {
                      onNavigate('profile');
                    }
                  }}
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs sm:text-sm font-black text-white hover:bg-[#1d4ed8] shadow-lg transition duration-200"
                >
                  <span>{currentUser ? 'View My Profile' : 'Create Worker Profile'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('jobs')}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 text-xs font-black text-white hover:bg-white/20 backdrop-blur-md transition duration-200"
                >
                  <span>Browse Jobs</span>
                </button>
              </div>
            </div>

            {/* Role Card 2: Employer */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-7 backdrop-blur-md transition duration-300 hover:border-emerald-400 hover:bg-white/15 hover:shadow-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                    <Briefcase className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-400/20">
                    For Employers
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition">
                  {t('hero_card_employer_title', 'I am an Employer')}
                </h2>

                <p className="text-sm font-medium leading-relaxed text-slate-200">
                  {t('hero_card_employer_desc', 'Post job offers and hire verified local electricians, solar technicians, plumbers & builders.')}
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser && onOpenGuestModal) {
                      onOpenGuestModal('employer', { type: 'post-job', title: 'Post a New Job in Qardho' });
                    } else {
                      onNavigate('post-job');
                    }
                  }}
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs sm:text-sm font-black text-white hover:bg-emerald-700 shadow-lg transition duration-200"
                >
                  <span>Post a Job Offer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('workers')}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 text-xs font-black text-white hover:bg-white/20 backdrop-blur-md transition duration-200"
                >
                  <span>Find Workers</span>
                </button>
              </div>
            </div>
          </div>

          {/* Platform Quick Stats Counter */}
          <div className="flex items-center justify-center gap-8 text-center pt-2 border-t border-white/10 max-w-2xl mx-auto">
            <div>
              <span className="block text-xl sm:text-2xl font-black text-white">{workersCount}</span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{t('hero_stat_workers')}</span>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <span className="block text-xl sm:text-2xl font-black text-white">{jobsCount}</span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{t('hero_stat_jobs')}</span>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <span className="block text-xl sm:text-2xl font-black text-white">6</span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{t('hero_stat_neighborhoods')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="category-heading">
        <div className="rounded-2xl border border-brand-950/10 bg-white/95 p-5 shadow-xl shadow-brand-950/10 backdrop-blur sm:p-6">
        <SectionHeading title={t('landing_find_by_skill_title')} description={t('landing_find_by_skill_desc')} />
        <div className="mt-7 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categoryCounts.map(({ category, count }) => (
            <React.Fragment key={category.name}>
              <CategoryCard category={category} count={count} />
            </React.Fragment>
          ))}
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="how-heading">
        <SectionHeading eyebrow={t('landing_steps_eyebrow')} title={t('landing_steps_title')} description={t('landing_steps_desc')} align="center" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <StepCard
            audience={t('landing_for_employers_title')}
            accent="blue"
            icon={Briefcase}
            steps={[t('landing_employer_step_1'), t('landing_employer_step_2'), t('landing_employer_step_3')]}
            cta={t('landing_find_workers_btn')}
            to={PAGE_ROUTES.workers}
          />
          <StepCard
            audience={t('landing_for_workers_title')}
            accent="green"
            icon={Wrench}
            steps={[t('landing_worker_step_1'), t('landing_worker_step_2'), t('landing_worker_step_3')]}
            cta={currentUser ? t('landing_open_dashboard_btn') : t('landing_join_worker_btn')}
            to={currentUser ? PAGE_ROUTES.dashboard : PAGE_ROUTES.register}
          />
        </div>
      </section>

      <section className="border-y border-brand-950/10 bg-white py-12" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: t('landing_benefit_1_title'), desc: t('landing_benefit_1_desc'), icon: ShieldCheck, color: 'bg-[#93c5fd]/35 text-[#1e40af]' },
              { title: t('landing_benefit_2_title'), desc: t('landing_benefit_2_desc'), icon: CheckCircle2, color: 'bg-brand-50 text-brand-600' },
              { title: t('landing_benefit_3_title'), desc: t('landing_benefit_3_desc'), icon: MapPin, color: 'bg-amber-50 text-amber-600' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="featured-workers-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading title={t('landing_featured_workers_title')} description={t('landing_featured_workers_desc')} />
          <button onClick={() => onNavigate('workers')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#3b82f6] hover:text-[#1e40af] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]">
            {t('landing_view_all_workers')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
        {featuredWorkers.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredWorkers.map(worker => (
              <React.Fragment key={worker.id}>
                <FeaturedWorkerCard worker={worker} reviews={reviews} onView={() => onViewWorkerProfile(worker)} />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">No worker profiles are available yet.</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="active-jobs-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading title={t('landing_available_jobs_title')} description={t('landing_available_jobs_desc')} />
          <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#3b82f6] hover:text-[#1e40af] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]">
            {t('landing_browse_all_jobs')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
        {recentJobs.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
            {recentJobs.map(job => (
              <React.Fragment key={job.id}>
                <JobPreviewCard job={job} onView={() => onNavigate('jobs')} />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Briefcase className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-black text-slate-700">No jobs are posted right now.</p>
            <p className="mt-1 text-sm text-slate-500">Check back later or create an employer account to post local work.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8" aria-labelledby="final-cta-heading">
        <div className="rounded-2xl bg-[#111615] px-5 py-8 text-white sm:px-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 id="final-cta-heading" className="text-2xl font-black tracking-tight sm:text-3xl">{t('landing_cta_title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t('landing_cta_desc')}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
            <button onClick={() => onNavigate('workers')} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#93c5fd] px-5 text-sm font-black text-[#111615] transition hover:bg-[#c8ff74] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">{t('landing_cta_find_workers')}</button>
            {currentUser ? (
              <button onClick={() => onNavigate('dashboard')} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10">{t('landing_open_dashboard_btn')}</button>
            ) : (
              <SignUpButton mode="modal">
                <button className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">{t('landing_cta_create_profile')}</button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


