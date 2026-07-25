import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PAGE_ROUTES } from '../routes';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, MapPin, Phone, ShieldCheck, User, UserPlus, Wrench } from 'lucide-react';

interface AuthProps {
  onLogin: (data: { identifier: string; password: string }) => Promise<{ success: boolean; message: string }>;
  onSignup: (data: any) => Promise<{ success: boolean; message: string }>;
}

type FieldErrors = Partial<Record<'loginIdentifier' | 'name' | 'phone' | 'password', string>>;

export default function Auth({ onLogin, onSignup }: AuthProps) {
  const location = useLocation();
  const [isLoginTab, setIsLoginTab] = useState(() => location.pathname !== PAGE_ROUTES.register);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const DEMO_PASSWORD = 'demo1234';

  const galleryImages = [
    { src: '/assets/auth-gallery-solar.png', alt: 'Solar technician inspecting rooftop panels in Qardho', className: 'object-left' },
    { src: '/assets/auth-gallery-tailoring.png', alt: 'Tailor sewing fabric in a local workshop', className: 'object-center' },
    { src: '/assets/auth-gallery-construction.png', alt: 'Mason building a concrete block wall', className: 'object-center' },
    { src: '/assets/auth-gallery-teaching-farming.png', alt: 'Teacher leading a practical farming lesson', className: 'object-center' },
  ];

  const galleryBackdrop = galleryImages[0].src;
  const inputClass = 'block h-12 w-full rounded-lg border bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10';
  const passwordInputClass = 'block h-12 w-full rounded-lg border bg-white pl-11 pr-11 text-sm font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10';
  const labelClass = 'mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-600';

  useEffect(() => {
    setIsLoginTab(location.pathname !== PAGE_ROUTES.register);
    setFeedback(null);
    setFieldErrors({});
  }, [location.pathname]);

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const withoutCountryCode = digitsOnly.startsWith('252') ? digitsOnly.slice(3) : digitsOnly;
    setPhone(withoutCountryCode.slice(0, 9));
    clearFieldError('phone');
  };

  const formatSomaliPhone = (localPhone: string) => `+252 ${localPhone.slice(0, 2)} ${localPhone.slice(2, 5)} ${localPhone.slice(5)}`.trim();
  const passwordIsLongEnough = password.length >= 8;

  const runDemoLogin = async (role: 'worker' | 'employer' | 'admin') => {
    if (loading) return;
    setFeedback(null);
    setFieldErrors({});
    setLoading(true);
    const identifier = role === 'worker' ? '+252 90 779 1234' : role === 'employer' ? 'employer1@qardho.com' : 'admin@qardho.com';
    try {
      const res = await onLogin({ identifier, password: DEMO_PASSWORD });
      if (!res.success) setFeedback({ type: 'error', message: res.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setFeedback(null);
    const nextErrors: FieldErrors = {};

    if (isLoginTab) {
      if (!loginIdentifier.trim()) nextErrors.loginIdentifier = 'Email or phone is required.';
      if (!password.trim()) nextErrors.password = 'Password is required.';
    } else {
      if (!name.trim()) nextErrors.name = 'Full name is required.';
      if (!phone.trim()) nextErrors.phone = 'Phone number is required.';
      else if (!/^\d{9}$/.test(phone)) nextErrors.phone = 'Enter a valid 9-digit Somali number after +252.';
      if (!password.trim()) nextErrors.password = 'Password is required.';
      else if (!passwordIsLongEnough) nextErrors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      if (isLoginTab) {
        const res = await onLogin({ identifier: loginIdentifier.trim(), password });
        if (!res.success) setFeedback({ type: 'error', message: res.message });
      } else {
        const formattedPhone = formatSomaliPhone(phone);
        const signupRes = await onSignup({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: formattedPhone,
          password,
          role: 'pending',
        });
        if (!signupRes.success) {
          setFeedback({ type: 'error', message: signupRes.message });
          return;
        }

        setFeedback({ type: 'success', message: 'Account created. Opening onboarding...' });
        const loginRes = await onLogin({ identifier: formattedPhone, password });
        if (!loginRes.success) {
          setFeedback({ type: 'error', message: loginRes.message || 'Account created, but automatic sign-in failed. Please sign in.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = () => {
    setFeedback({ type: 'error', message: 'Password reset is not enabled in demo mode. Use demo1234 for demo accounts.' });
  };

  const inputStateClass = (field: keyof FieldErrors) => fieldErrors[field] ? 'border-red-300 bg-red-50/40' : 'border-slate-200';

  return (
    <main className="min-h-screen bg-white text-slate-900 lg:grid lg:h-screen lg:grid-cols-[minmax(500px,49%)_1fr] lg:overflow-hidden" id="auth-page">
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8 sm:px-8 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:bg-white lg:px-12 lg:py-10 xl:px-16">
        <div className="w-full max-w-[430px]">
          <div className="mb-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3" aria-label="Xirfad Qardho">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <span className="block text-xl font-black tracking-tight text-slate-950">Xirfad</span>
                <span className="mt-1 block text-xs font-black uppercase tracking-wider text-blue-600">Qardho</span>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Local network</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Qardho skilled-trade platform
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {isLoginTab ? 'Sign in to your account' : 'Create your Xirfad account'}
            </h1>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-500">
              {isLoginTab ? 'Access your dashboard, job activity, applications, and hiring connections.' : 'Create an account and go straight to onboarding.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <Link to={PAGE_ROUTES.auth} onClick={() => setFeedback(null)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${isLoginTab ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-900'}`}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign In</span>
            </Link>
            <Link to={PAGE_ROUTES.register} onClick={() => setFeedback(null)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${!isLoginTab ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-900'}`}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Create Account</span>
            </Link>
          </div>

          {isLoginTab && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => runDemoLogin('worker')} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60">Demo Worker</button>
              <button type="button" onClick={() => runDemoLogin('employer')} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60">Demo Employer</button>
              <button type="button" onClick={() => runDemoLogin('admin')} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60">Demo Admin</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-submit-form" noValidate>
            {feedback && (
              <div className={`rounded-xl border p-3.5 text-xs font-bold ${feedback.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-800'}`}>
                {feedback.message}
              </div>
            )}

            <div className="space-y-3">
              {!isLoginTab && (
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                    <input type="text" value={name} onChange={(e) => { setName(e.target.value); clearFieldError('name'); }} placeholder="Ahmed Mohamed" className={`${inputClass} ${inputStateClass('name')}`} aria-invalid={!!fieldErrors.name} />
                  </div>
                  {fieldErrors.name && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.name}</p>}
                </div>
              )}

              {isLoginTab ? (
                <div>
                  <label className={labelClass}>Email Address or Phone Number *</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                    <input type="text" value={loginIdentifier} onChange={(e) => { setLoginIdentifier(e.target.value); clearFieldError('loginIdentifier'); }} placeholder="name@example.com or +252..." className={`${inputClass} ${inputStateClass('loginIdentifier')}`} aria-invalid={!!fieldErrors.loginIdentifier} />
                  </div>
                  {fieldErrors.loginIdentifier && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.loginIdentifier}</p>}
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`${inputClass} border-slate-200`} />
                  </div>
                </div>
              )}

              {!isLoginTab && (
                <div>
                  <label className={labelClass} htmlFor="signup-phone-local">Somali Phone Number *</label>
                  <div className={`flex h-12 w-full items-center rounded-lg border bg-white text-sm font-semibold text-slate-900 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 ${inputStateClass('phone')}`}>
                    <div className="flex h-full shrink-0 items-center gap-2 pl-3.5 pr-3 text-slate-500">
                      <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span className="font-black text-slate-700">+252</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
                    <input id="signup-phone-local" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="90 123 4567" className="h-full min-w-0 flex-1 rounded-r-lg border-0 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" maxLength={9} aria-invalid={!!fieldErrors.phone} />
                  </div>
                  {fieldErrors.phone ? <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.phone}</p> : <p className="mt-1.5 text-[11px] font-semibold text-slate-400">Saved as {phone.length === 9 ? formatSomaliPhone(phone) : '+252 90 123 4567'}.</p>}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">Password *</label>
                  {isLoginTab && <button type="button" onClick={forgotPassword} className="text-[11px] font-black text-blue-600 hover:text-blue-800">Forgot password?</button>}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }} placeholder="Enter your password" className={`${passwordInputClass} ${inputStateClass('password')}`} aria-invalid={!!fieldErrors.password} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.password ? <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.password}</p> : !isLoginTab && <p className={`mt-1 text-[11px] font-semibold ${passwordIsLongEnough ? 'text-emerald-600' : 'text-slate-400'}`}>{passwordIsLongEnough ? 'Password length is good.' : 'Use at least 8 characters.'}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/25 disabled:cursor-not-allowed disabled:opacity-50" id="btn-auth-submit">
              {loading ? <span>Processing...</span> : isLoginTab ? <><LogIn className="h-4 w-4" /><span>Sign In</span><ArrowRight className="h-4 w-4" /></> : <><UserPlus className="h-4 w-4" /><span>Create Account and Continue</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-semibold leading-5 text-slate-400">Built for workers, employers, and local job coordination in Qardho.</p>
        </div>
      </section>

      <aside className="relative hidden h-screen overflow-hidden bg-slate-950 lg:block" aria-label="Qardho skilled trade gallery">
        <img src={galleryBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" loading="eager" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.94),rgba(15,23,42,0.62)_42%,rgba(37,99,235,0.24))]" />
        <div className="relative z-10 flex h-full flex-col p-7 xl:p-9">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>Workers, jobs, and local hiring</span>
            </div>
          </div>
          <div className="my-auto grid h-[68vh] max-h-[700px] min-h-[470px] grid-cols-12 grid-rows-12 gap-4 xl:gap-5">
            {galleryImages.map((image, index) => (
              <div key={image.src} className={`${index === 0 ? 'col-span-7 row-span-8' : index === 3 ? 'col-span-7 row-span-4' : 'col-span-5 row-span-4'} overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-slate-950/35`}>
                <img src={image.src} alt={image.alt} className={`h-full w-full object-cover ${image.className}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              </div>
            ))}
          </div>
          <div className="max-w-xl pb-2">
            <div className="mb-4 flex flex-wrap gap-2">
              {['Solar', 'Construction', 'Tailoring', 'Teaching', 'Farming'].map((trade) => <span key={trade} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">{trade}</span>)}
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white xl:text-4xl">A practical way to coordinate local skilled work.</h2>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-slate-300">Sign in, choose your role, complete your profile, and continue into the right workflow.</p>
          </div>
        </div>
      </aside>
    </main>
  );
}
