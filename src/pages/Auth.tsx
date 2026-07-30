import React, { useEffect, useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { PAGE_ROUTES } from '../routes';

const AUTH_IMAGES = [
  { src: '/assets/auth-gallery-solar.webp', alt: 'Solar energy technician in Qardho' },
  { src: '/assets/auth-gallery-tailoring.webp', alt: 'Skilled tailor working in Qardho' },
  { src: '/assets/auth-gallery-construction.webp', alt: 'Construction mason building in Qardho' },
  { src: '/assets/auth-gallery-teaching-farming.webp', alt: 'Agricultural specialist in Qardho' },
];

const clerkAppearance = {
  elements: {
    card: 'shadow-none bg-transparent w-full border-0 p-0',
    headerTitle: 'font-black text-slate-900 text-xl text-center',
    headerSubtitle: 'text-xs font-medium text-slate-500 text-center',
    formButtonPrimary: 'bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-sm font-black rounded-xl py-3 shadow-md border-0 transition',
    formFieldInput: 'rounded-xl border-slate-200 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 text-sm font-semibold py-2.5',
    formFieldLabel: 'text-xs font-black uppercase text-slate-600 tracking-wider',
    footerActionLink: 'text-[#2563eb] hover:text-[#1d4ed8] font-bold text-xs underline-offset-4',
    identityPreviewText: 'font-bold text-slate-800 text-sm',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-xs font-bold text-slate-400 uppercase tracking-wider',
    socialButtonsBlockButton: 'rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 py-2.5 transition',
  },
};

export default function Auth() {
  const location = useLocation();
  const isRegister = location.pathname === PAGE_ROUTES.register;
  const [imageIndex, setImageIndex] = useState(0);
  const [guestIntent, setGuestIntent] = useState<{ role?: string; targetSummary?: any } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('guest_auth_intent');
      if (raw) {
        setGuestIntent(JSON.parse(raw));
      }
    } catch {
      // Storage fallback
    }
  }, []);

  // Auto-rotate background gallery images every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % AUTH_IMAGES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="auth-page relative min-h-[calc(100dvh-70px)] overflow-y-auto overflow-x-hidden bg-slate-950">
      {/* Background Image Carousel with Crossfade */}
      <div className="fixed inset-0 z-0">
        {AUTH_IMAGES.map((img, idx) => (
          <img
            key={img.src}
            src={img.src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === imageIndex ? 'opacity-85 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
        {/* Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-slate-950/60 via-slate-950/75 to-slate-950/90 backdrop-blur-[2px]" />
      </div>

      {/* Main Form Section */}
      <section className="relative z-30 flex min-h-[calc(100dvh-70px)] flex-col items-center justify-center px-3.5 py-8 sm:px-6 lg:px-8">
        {/* Top Back Navigation Link */}
        <div className="mb-4 w-full max-w-[28rem] flex items-center justify-between">
          <Link
            to={PAGE_ROUTES.home}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-black text-white hover:bg-white/20 backdrop-blur-md transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">
            {isRegister ? 'Register' : 'Sign In'}
          </span>
        </div>

        {/* Guest Action Context Notification Banner (if arriving from job/worker action) */}
        {guestIntent?.targetSummary && (
          <div className="mb-4 w-full max-w-[28rem] rounded-2xl bg-blue-950/80 border border-blue-400/30 p-3.5 text-white backdrop-blur-md shadow-lg flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white font-black text-xs">
              !
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">
                {isRegister ? 'Account required to continue' : 'Sign in to continue'}
              </span>
              <p className="font-bold text-white truncate">{guestIntent.targetSummary.title}</p>
            </div>
          </div>
        )}

        {/* Auth Glass Card Container */}
        <div className="w-full max-w-[28rem] min-w-0 rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-md sm:p-7 flex flex-col items-center overflow-hidden">
          <div className="w-full mb-3 text-center">
            <p className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
              <MapPin className="h-3.5 w-3.5 text-[#2563eb]" />
              Qardho local work network
            </p>
          </div>

          <div className="w-full min-w-0 flex justify-center">
            {isRegister ? (
              <SignUp
                routing="path"
                path="/register"
                signInUrl="/login"
                fallbackRedirectUrl="/onboarding"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/register"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
