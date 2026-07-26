import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
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
      {eyebrow && <p className="text-xs font-black text-[#008060] uppercase tracking-[0.18em]">{eyebrow}</p>}
      <h2 className="font-display mt-2 text-2xl sm:text-3xl font-black text-[#111615]">{title}</h2>
      {description && <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600">{description}</p>}
    </div>
  );
}

function HeroButton({ children, onClick, variant = 'primary' }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' }) {
  const classes = variant === 'primary'
    ? 'bg-[#b7f25c] text-[#111615] hover:bg-[#c8ff74] active:bg-[#a5df4f] shadow-lg shadow-emerald-950/20'
    : 'bg-white/10 text-white border border-white/30 hover:bg-white/16 active:bg-white/20 backdrop-blur-md';

  return (
    <button
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 sm:px-6 text-sm font-black transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f25c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${classes}`}
    >
      {children}
    </button>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-[132px] flex-1 rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-left shadow-sm backdrop-blur-md">
      <span className="block text-2xl font-black leading-none text-white">{value}</span>
      <span className="mt-1 block text-xs font-semibold text-slate-300">{label}</span>
    </div>
  );
}

function CategoryCard({ category, count }: { category: CategoryConfig; count: number }) {
  const Icon = category.icon;
  return (
    <div className="rounded-xl border border-emerald-950/10 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#008060]/30 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#b7f25c]/35 text-[#005f49]">
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
  const styles = accent === 'blue'
    ? { icon: 'bg-[#b7f25c]/35 text-[#005f49]', marker: 'bg-[#008060] text-white', button: 'bg-[#008060] text-white shadow-sm shadow-emerald-950/15 hover:bg-[#005f49] active:bg-[#004b3a] focus-visible:ring-[#008060]' }
    : { icon: 'bg-emerald-50 text-[#008060]', marker: 'bg-[#b7f25c] text-[#111615]', button: 'bg-[#111615] text-white shadow-sm shadow-slate-950/15 hover:bg-[#1d2422] active:bg-black focus-visible:ring-[#111615]' };

  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-950/10 bg-white p-5 sm:p-6 shadow-sm">
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
        <Link
          to={to}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${styles.button}`}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
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
    <article className="flex h-full flex-col rounded-xl border border-emerald-950/10 bg-white p-5 shadow-sm transition duration-200 hover:border-[#008060]/30 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
          {getInitials(worker.name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-950">{worker.name}</h3>
          {worker.skill && <p className="mt-1 truncate text-sm font-semibold text-[#008060]">{worker.skill}</p>}
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
        {worker.rate && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" />{worker.rate}</span>}
        {worker.availability && <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700">{worker.availability}</span>}
      </div>
      {worker.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{worker.bio}</p>}
      <button
        onClick={onView}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-950/10 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-[#008060]/30 hover:bg-emerald-50 hover:text-[#005f49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008060]"
      >
        View Profile
      </button>
    </article>
  );
}

function JobPreviewCard({ job, onView }: { job: Job; onView: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-emerald-950/10 bg-white p-5 shadow-sm transition duration-200 hover:border-[#008060]/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black leading-6 text-slate-950">{job.title}</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{formatDate(job.createdAt)}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">{job.status.replace('_', ' ')}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1"><MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{job.location}</span>
        {job.rate && <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" />{job.rate}</span>}
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
      <button
        onClick={onView}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-[#111615] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1d2422] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008060] focus-visible:ring-offset-2"
      >
        View Job
      </button>
    </article>
  );
}

export default function Landing({ workers, jobs, reviews, workersCount, jobsCount, onNavigate, onViewWorkerProfile, currentUser }: LandingProps) {
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
    <div className="bg-[#f6fbf8]" id="landing-page-container">
      <section
        className="relative flex min-h-[560px] overflow-hidden bg-slate-950 text-white lg:min-h-[620px]"
        aria-labelledby="hero-heading"
        style={{
          backgroundImage: "url('/assets/xirfad-qardho-tradesman-hero.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#111615] via-[#111615]/78 to-[#111615]/24" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111615]/80 via-[#111615]/10 to-[#111615]/12" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#b7f25c] backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Qardho, Karkaar Region
            </div>
            <h1 id="hero-heading" className="font-display mt-6 max-w-4xl text-[2.7rem] font-black leading-[1.02] sm:text-[3.35rem] md:text-[3.85rem] lg:text-[4.6rem]">
              Xirfad Qardho
              <span className="mt-3 block text-[1.45rem] leading-tight text-white/82 sm:text-[1.9rem] md:text-[2.2rem] lg:text-[2.5rem]">
                Local skilled work, direct connections.
              </span>
            </h1>
            <p className="mt-6 max-w-[600px] text-base font-medium leading-8 text-slate-100 sm:text-lg">
              Connect with plumbers, solar technicians, builders, tailors, teachers, and local employers across Qardho without agency barriers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HeroButton onClick={() => onNavigate('workers')}>
                <Users className="h-5 w-5" aria-hidden="true" />
                Find Skilled Workers
              </HeroButton>
              <HeroButton onClick={() => onNavigate('jobs')} variant="secondary">
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                Browse Job Board
              </HeroButton>
            </div>
            <div className="mt-10 flex max-w-2xl flex-wrap gap-3" aria-label="Platform statistics">
              <StatCard value={workersCount} label="Skilled Workers" />
              <StatCard value={jobsCount} label="Active Jobs" />
              <StatCard value="100%" label="Qardho Focus" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="category-heading">
        <div className="rounded-2xl border border-emerald-950/10 bg-white/95 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur sm:p-6">
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

      <section className="border-y border-emerald-950/10 bg-white py-12" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: 'Local Worker Profiles', desc: 'Review skills, area, bio, price, and availability when workers provide them.', icon: ShieldCheck, color: 'bg-[#b7f25c]/35 text-[#005f49]' },
              { title: 'Direct Negotiation', desc: 'Message workers or applicants directly and agree on scope, timing, and payment.', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
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
          <button onClick={() => onNavigate('workers')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#008060] hover:text-[#005f49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008060]">
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
          <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-black text-[#008060] hover:text-[#005f49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008060]">
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
            <button onClick={() => onNavigate('workers')} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#b7f25c] px-5 text-sm font-black text-[#111615] transition hover:bg-[#c8ff74] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f25c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Find Skilled Workers</button>
            <Link to={PAGE_ROUTES.register} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f25c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Create Worker Profile</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
