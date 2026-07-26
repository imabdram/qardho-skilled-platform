import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, Loader2, Lock,
  Mail, MapPin, Phone, User, UserPlus,
} from 'lucide-react';
import { PAGE_ROUTES } from '../routes';

interface AuthProps {
  onLogin: (data: { identifier: string; password: string }) => Promise<{ success: boolean; message: string }>;
  onSignup: (data: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
}

type Feedback = { type: 'success' | 'error'; message: string };

const images = [
  { src: '/assets/auth-gallery-solar.webp', alt: 'Solar technician working in Qardho' },
  { src: '/assets/auth-gallery-tailoring.webp', alt: 'Tailor working in a local workshop' },
  { src: '/assets/auth-gallery-construction.webp', alt: 'Mason building a wall' },
  { src: '/assets/auth-gallery-teaching-farming.webp', alt: 'A practical farming lesson' },
];

export default function Auth({ onLogin, onSignup }: AuthProps) {
  const location = useLocation();
  const mode = location.pathname === PAGE_ROUTES.register ? 'register' : location.pathname === PAGE_ROUTES['forgot-password'] ? 'forgot' : location.pathname === PAGE_ROUTES['reset-password'] ? 'reset' : 'login';
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetToken = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const sanitizeNationalPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('252') && digits.length > 12 ? digits.slice(3) : digits;
  };

  useEffect(() => {
    setFeedback(null);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setImageIndex((current) => {
        const next = (current + 1) % images.length;
        const preload = new Image();
        preload.src = images[(next + 1) % images.length].src;
        return next;
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const validate = () => {
    const next: Record<string, string> = {};
    if (mode === 'login') {
      if (!identifier.trim()) next.identifier = 'Email or phone is required.';
      if (!password) next.password = 'Password is required.';
    } else if (mode === 'register') {
      if (!name.trim()) next.name = 'Full name is required.';

      if (!/^\d{8,12}$/.test(phone.replace(/\D/g, ''))) next.phone = 'Enter 8 to 12 phone digits.';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
      if (whatsappPhone && /^\d{8,12}$/.test(sanitizeNationalPhone(whatsappPhone))) next.whatsappPhone = 'Enter 8 to 12 WhatsApp digits, or leave it blank.';
      if (password.length < 8) next.password = 'Use at least 8 characters.';
    } else if (mode === 'forgot') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    } else {
      if (!resetToken) next.token = 'This reset link is missing its token.';
      if (password.length < 8) next.password = 'Use at least 8 characters.';
      if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    setFeedback(null);
    try {
      if (mode === 'login') {
        const result = await onLogin({ identifier: identifier.trim(), password });
        if (!result.success) setFeedback({ type: 'error', message: result.message });
      } else if (mode === 'register') {
        const normalizedPhone = '+252' + sanitizeNationalPhone(phone);
        const normalizedWhatsapp = whatsappPhone ? '+252' + sanitizeNationalPhone(whatsappPhone) : undefined;
        const signup = await onSignup({ name: name.trim(), email: email.trim() || undefined, phone: normalizedPhone, whatsappPhone: normalizedWhatsapp, password, role: 'pending' });
        if (!signup.success) setFeedback({ type: 'error', message: signup.message });
        else {
          const login = await onLogin({ identifier: normalizedPhone, password });
          if (!login.success) setFeedback({ type: 'success', message: 'Account created. Sign in with your new details.' });
        }
      } else if (mode === 'forgot') {
        const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
        const data = await response.json();
        setFeedback({ type: 'success', message: data.message });
        if (data.developmentResetUrl) window.setTimeout(() => window.location.assign(data.developmentResetUrl), 1200);
      } else {
        const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, password }) });
        const data = await response.json();
        if (!response.ok) setFeedback({ type: 'error', message: data.error || 'Could not reset password.' });
        else setFeedback({ type: 'success', message: data.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'The server could not be reached. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (identifierValue: string) => {
    if (loading) return;
    setIdentifier(identifierValue);
    setPassword('demo1234');
    setLoading(true);
    setFeedback(null);
    try {
      const result = await onLogin({ identifier: identifierValue, password: 'demo1234' });
      if (!result.success) setFeedback({ type: 'error', message: result.message });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (key: string) => `min-h-12 w-full rounded-xl border bg-white/95 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#008060] focus:ring-4 focus:ring-emerald-500/10 ${errors[key] ? 'border-rose-300' : 'border-slate-200'}`;
  const title = mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password';
  const description = mode === 'login' ? 'Sign in to manage jobs, applications, hiring requests, and work progress.' : mode === 'register' ? 'Start with your contact details, then complete a short role-based setup.' : mode === 'forgot' ? 'Enter your email. The response stays the same whether or not an account exists.' : 'Reset links expire after 30 minutes and can be used only once.';

  return (
    <main className="auth-page relative min-h-[calc(100dvh-70px)] overflow-hidden bg-slate-950 lg:grid lg:grid-cols-[minmax(28rem,46%)_1fr]">
      <img key={images[imageIndex].src} src={images[imageIndex].src} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-700 motion-reduce:transition-none lg:hidden" width="1200" height="900" loading={imageIndex === 0 ? 'eager' : 'lazy'} decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/75 to-slate-950/90 lg:hidden" />

      <section className="relative z-10 flex min-h-[calc(100dvh-70px)] items-center justify-center px-4 py-8 sm:px-8 lg:bg-[#f6fbf8] lg:px-12">
        <div className="w-full max-w-md rounded-3xl border border-white/15 auth-card p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:border-emerald-950/10 ">
          <div className="mt-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#008060]"><MapPin className="h-3.5 w-3.5" />Qardho local work network</p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p>
          </div>

          {feedback && <div className={`mt-5 rounded-xl border p-3 text-sm font-bold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="status">{feedback.message}</div>}
          {errors.token && <p className="mt-4 text-sm font-bold text-rose-700">{errors.token}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'register' && <div><label htmlFor="auth-name" className="mb-1.5 block text-sm font-bold">Full name</label><div className="relative"><User className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" /><input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} className={`${fieldClass('name')} pl-11`} autoComplete="name" placeholder="Amina Yusuf" /></div>{errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}</div>}

            {mode === 'login' && <div><label htmlFor="auth-identifier" className="mb-1.5 block text-sm font-bold">Email or phone</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" /><input id="auth-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={`${fieldClass('identifier')} pl-11`} autoComplete="username" placeholder="name@example.com or +252..." /></div>{errors.identifier && <p className="mt-1 text-xs font-bold text-rose-600">{errors.identifier}</p>}</div>}

            {(mode === 'register' || mode === 'forgot') && <div><label htmlFor="auth-email" className="mb-1.5 block text-sm font-bold">Email {mode === 'register' && <span className="font-medium text-slate-400">(optional)</span>}</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" /><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldClass('email')} pl-11`} autoComplete="email" placeholder="name@example.com" /></div>{errors.email && <p className="mt-1 text-xs font-bold text-rose-600">{errors.email}</p>}</div>}

            {mode === 'register' && <>
              <div><label htmlFor="auth-phone">Phone number</label><div className="phone-input"><span className="phone-prefix">+252</span><input id="auth-phone" type="tel" inputMode="numeric" maxLength={12} value={phone} onChange={(e)=>setPhone(sanitizeNationalPhone(e.target.value))} /></div></div>
              <div><label htmlFor="auth-whatsapp">WhatsApp number (optional)</label><div className="phone-input"><span className="phone-prefix">+252</span><input id="auth-whatsapp" type="tel" inputMode="numeric" maxLength={12} value={whatsappPhone} onChange={(e)=>setWhatsappPhone(sanitizeNationalPhone(e.target.value))} /></div></div>
            </>}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="auth-password" className="text-sm font-bold">{mode === 'reset' ? 'New password' : 'Password'}</label>{mode === 'login' && <Link to={PAGE_ROUTES['forgot-password']} className="text-xs font-black text-[#00715a] hover:underline">Forgot password?</Link>}</div><div className="relative"><Lock className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" /><input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldClass('password')} px-11`} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{errors.password && <p className="mt-1 text-xs font-bold text-rose-600">{errors.password}</p>}</div>}

            {mode === 'reset' && <div><label htmlFor="auth-confirm" className="mb-1.5 block text-sm font-bold">Confirm new password</label><input id="auth-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass('confirmPassword')} autoComplete="new-password" />{errors.confirmPassword && <p className="mt-1 text-xs font-bold text-rose-600">{errors.confirmPassword}</p>}</div>}

            <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#008060] px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 hover:bg-[#006b50] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Please wait...</> : mode === 'login' ? <>Sign In<ArrowRight className="h-4 w-4" /></> : mode === 'register' ? <><UserPlus className="h-4 w-4" />Create account</> : mode === 'forgot' ? <>Send reset link<Mail className="h-4 w-4" /></> : <><CheckCircle2 className="h-4 w-4" />Update password</>}</button>
          </form>

          <div className="mt-6 text-center text-sm font-semibold text-slate-600">
            {mode === 'login' && <>Don't have an account? <Link to={PAGE_ROUTES.register} className="font-black text-[#00715a] hover:underline">Create an account</Link></>}
            {mode === 'register' && <>Already have an account? <Link to={PAGE_ROUTES.auth} className="font-black text-[#00715a] hover:underline">Sign in</Link></>}
            {(mode === 'forgot' || mode === 'reset') && <Link to={PAGE_ROUTES.auth} className="font-black text-[#00715a] hover:underline">Back to sign in</Link>}
          </div>
          {mode === 'login' && (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Demo quick sign in</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" disabled={loading} onClick={() => quickLogin('+252 90 779 1234')} className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">Worker</button>
                <button type="button" disabled={loading} onClick={() => quickLogin('employer1@qardho.com')} className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">Employer</button>
                <button type="button" disabled={loading} onClick={() => quickLogin('admin@qardho.com')} className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">Admin</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="relative hidden min-h-[calc(100dvh-70px)] overflow-hidden lg:block">
        <img key={images[imageIndex].src} src={images[imageIndex].src} alt={images[imageIndex].alt} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none" width="1400" height="1050" loading={imageIndex === 0 ? 'eager' : 'lazy'} decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black backdrop-blur-md"><BriefcaseBusiness className="h-4 w-4 text-[#b7f25c]" />Workers, jobs, and safer local contact</span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight">Review the details before you make the connection.</h2>
          <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-white/75">Private contact details unlock only after an application or hiring request is accepted.</p>
        </div>
      </aside>
    </main>
  );
}






