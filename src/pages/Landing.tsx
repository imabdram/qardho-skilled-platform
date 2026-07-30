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
  { name: 'Plumbing', aliases: ['plumb', 'pipe'], icon: Wrench },
  { name: 'Electrical Work', aliases: ['electric'], icon: Plug },
  { name: 'Solar Installation', aliases: ['solar'], icon: SunMedium },
  { name: 'Construction', aliases: ['mason', 'builder', 'construction'], icon: Construction },
  { name: 'Tailoring', aliases: ['tailor'], icon: Scissors },
  { name: 'Teaching', aliases: ['teacher', 'tutor'], icon: GraduationCap },
  { name: 'Farming', aliases: ['farm', 'agric'], icon: Leaf },
  { name: 'General Repair', aliases: ['repair', 'labor', 'general'], icon: Hammer },
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
  const Icon = category.icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-950">{category.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{count} {count === 1 ? 'worker' : 'workers'}</p>
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
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </SignUpButton>
        ) : (
          <Link
            to={to}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${styles.button}`}
          >
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function FeaturedWorkerCard({ worker, reviews, onView }: { worker: User; reviews: Review[]; onView: () => void }) {
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
        View Profile
      </button>
    </article>
  );
}

function JobPreviewCard({ job, onView }: { job: Job; onView: () => void }) {
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
        View Job
      </button>
    </article>
  );
}

export default function Landing({ workers, jobs, reviews, workersCount, jobsCount, onNavigate, onViewWorkerProfile, currentUser }: LandingProps) {
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
      {/* Hero Section */}
      <section
        className="relative flex min-h-[600px] sm:min-h-[650px] lg:min-h-[680px] lg:max-h-[720px] items-center overflow-hidden bg-[#0a192f] text-white"
        aria-labelledby="hero-heading"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Background Images */}
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

          {/* Overlays for Text Contrast */}
          {/* Desktop Overlay: Stronger on the left, lighter on the right */}
          <div className="hidden md:block absolute inset-0 z-20 bg-gradient-to-r from-[#0a192f] via-[#0a192f]/90 to-[#0a192f]/20" />
          {/* Mobile Overlay: Even dark overlay across full image */}
          <div className="md:hidden absolute inset-0 z-20 bg-[#0a192f]/85" />
          {/* Bottom Blend */}
          <div className="absolute inset-x-0 bottom-0 h-16 z-20 bg-gradient-to-t from-[#0a192f] to-transparent" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-30 mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-6 lg:px-8 flex flex-col justify-between h-full">
          <div className="max-w-2xl lg:w-[54%] space-y-5 text-left pt-4">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/50 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-300 backdrop-blur-md shadow-xs">
              <MapPin className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>{t('hero_badge')}</span>
            </div>

            {/* Main Heading (Max 2 lines) */}
            <h1 id="hero-heading" className="font-display text-[2.2rem] sm:text-[3rem] lg:text-[3.6rem] font-black leading-[1.08] text-white tracking-tight">
              {t('hero_title')}
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-200 max-w-[540px]">
              {t('hero_subtitle')}
            </p>

            {/* Primary & Secondary Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('workers')}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-sm font-black text-white hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-lg shadow-black/30 border border-blue-500/30 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Users className="h-5 w-5" aria-hidden="true" />
                <span>{t('hero_browse_workers')}</span>
              </button>

              <button
                onClick={() => onNavigate('jobs')}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white/12 border border-white/25 px-6 text-sm font-black text-white hover:bg-white/20 active:bg-white/25 backdrop-blur-md transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                <span>{t('hero_post_job')}</span>
              </button>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-[520px] pt-3" aria-label="Platform statistics">
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black text-white leading-none">{workersCount}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-300">{t('hero_stat_workers')}</span>
              </div>
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black text-white leading-none">{jobsCount}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-300">{t('hero_stat_jobs')}</span>
              </div>
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black text-white leading-none">6</span>
                <span className="mt-1 block text-xs font-semibold text-slate-300">{t('hero_stat_neighborhoods')}</span>
              </div>
            </div>
          </div>

          {/* Carousel Indicators & Controls */}
          <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2" role="group" aria-label="Slide indicators">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.src}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-7 bg-blue-400'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === currentIndex}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/40 text-white hover:bg-white/20 backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/40 text-white hover:bg-white/20 backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="category-heading">
        <div className="rounded-2xl border border-brand-950/10 bg-white/95 p-5 shadow-xl shadow-brand-950/10 backdrop-blur sm:p-6">
        <SectionHeading title="Find help by skill" description="Browse the trade areas represented by current worker profiles." />
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
        <SectionHeading eyebrow="Simple steps" title="How Xirfad Qardho works" description="Two clear paths for hiring local help or finding work nearby." align="center" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <StepCard
            audience="For people who need work done"
            accent="blue"
            icon={Briefcase}
            steps={['Search by skill or location', 'Contact a suitable worker', 'Agree directly and complete the work']}
            cta="Find Workers"
            to={PAGE_ROUTES.workers}
          />
          <StepCard
            audience="For workers"
            accent="green"
            icon={Wrench}
            steps={['Create a worker profile', 'Show skills, location, and price', 'Receive messages and apply for jobs']}
            cta={currentUser ? 'Open Dashboard' : 'Join as Worker'}
            to={currentUser ? PAGE_ROUTES.dashboard : PAGE_ROUTES.register}
          />
        </div>
      </section>

      <section className="border-y border-brand-950/10 bg-white py-12" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: 'Local Worker Profiles', desc: 'Review skills, area, bio, price, and availability when workers provide them.', icon: ShieldCheck, color: 'bg-[#93c5fd]/35 text-[#1e40af]' },
              { title: 'Direct Negotiation', desc: 'Message workers or applicants directly and agree on scope, timing, and payment.', icon: CheckCircle2, color: 'bg-brand-50 text-brand-600' },
              { title: 'Neighborhood-Specific Results', desc: 'Find help around Kaambo, Qoryacad, Xorgoble, Xiingood, Xiddo, Sheerbi, and Waaciye.', icon: MapPin, color: 'bg-amber-50 text-amber-600' },
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
          <SectionHeading title="Featured Skilled Workers" description="A short preview of worker profiles currently available in the platform." />
          <button onClick={() => onNavigate('workers')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#3b82f6] hover:text-[#1e40af] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]">
            View all workers <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
          <SectionHeading title="Available Jobs in Qardho" description="Recent local job posts from employers in the platform." />
          <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#3b82f6] hover:text-[#1e40af] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]">
            Browse all jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
            <h2 id="final-cta-heading" className="text-2xl font-black tracking-tight sm:text-3xl">Ready to find skilled help in Qardho?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Search local profiles or create a worker account so nearby employers can contact you.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
            <button onClick={() => onNavigate('workers')} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#93c5fd] px-5 text-sm font-black text-[#111615] transition hover:bg-[#c8ff74] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Find Skilled Workers</button>
            {currentUser ? (
              <button onClick={() => onNavigate('dashboard')} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10">Open Dashboard</button>
            ) : (
              <SignUpButton mode="modal">
                <button className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Create Worker Profile</button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


