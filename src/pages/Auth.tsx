import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { PAGE_ROUTES } from '../routes';

const images = [
  { src: '/assets/auth-gallery-solar.webp', alt: 'Solar technician working in Qardho' },
  { src: '/assets/auth-gallery-tailoring.webp', alt: 'Tailor working in a local workshop' },
  { src: '/assets/auth-gallery-construction.webp', alt: 'Mason building a wall' },
  { src: '/assets/auth-gallery-teaching-farming.webp', alt: 'A practical farming lesson' },
];

export default function Auth() {
  const location = useLocation();
  const isRegister = location.pathname === PAGE_ROUTES.register;
  const [imageIndex] = useState(0);

  return (
    <main className="auth-page relative min-h-[calc(100dvh-70px)] overflow-y-auto overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src={images[imageIndex].src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900/80" />
      </div>

      <section className="relative z-10 flex min-h-[calc(100dvh-70px)] items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[28rem] rounded-3xl border border-white/20 glass-panel p-6 shadow-2xl lg:p-8 flex flex-col items-center">
          <div className="w-full mb-4 text-center">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#3b82f6]">
              <MapPin className="h-3.5 w-3.5" />
              Qardho local work network
            </p>
          </div>

          {isRegister ? (
            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              fallbackRedirectUrl="/onboarding"
            />
          ) : (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              fallbackRedirectUrl="/dashboard"
            />
          )}
        </div>
      </section>
    </main>
  );
}
