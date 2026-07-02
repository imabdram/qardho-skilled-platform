import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Phone, User, Briefcase, MapPin } from 'lucide-react';

interface AuthProps {
  onLogin: (data: { identifier: string; password: string }) => Promise<{ success: boolean; message: string }>;
  onSignup: (data: any) => Promise<{ success: boolean; message: string }>;
}

export default function Auth({ onLogin, onSignup }: AuthProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone for Login
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional on Signup
  const [phone, setPhone] = useState(''); // Required on Signup
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        // Login flow
        if (!loginIdentifier.trim() || !password.trim()) {
          setFeedback({ type: 'error', message: 'Please enter your email/phone and password.' });
          setLoading(false);
          return;
        }
        const res = await onLogin({ identifier: loginIdentifier.trim(), password });
        if (!res.success) {
          setFeedback({ type: 'error', message: res.message });
        }
      } else {
        // Signup flow
        if (!name.trim() || !phone.trim() || !password.trim()) {
          setFeedback({ type: 'error', message: 'Please fill in all required fields (Full Name, Phone Number, Password).' });
          setLoading(false);
          return;
        }
        const payload = {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          password: password,
          role: 'pending' // Setup role during post-login onboarding
        };
        const res = await onSignup(payload);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Account created! Redirecting to login tab...' });
          setTimeout(() => {
            setIsLoginTab(true);
            setFeedback(null);
          }, 1500);
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in" id="auth-page">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
        
        {/* Sign in / Sign up top toggler */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setFeedback(null);
            }}
            className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
              isLoginTab
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setFeedback(null);
            }}
            className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
              !isLoginTab
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4" id="auth-submit-form">
          
          <div className="text-center pb-2">
            <h2 className="text-lg font-black text-slate-900">
              {isLoginTab ? 'Welcome Back!' : 'Join Skills Hub Qardho'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isLoginTab 
                ? 'Sign in to access your dashboard and bookings.' 
                : 'Choose your role and register to connect with the community.'}
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold border ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : 'bg-red-50 text-red-800 border-red-100'
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3">
            
            {/* Full Name (Signup only) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmed Mohamed"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            {isLoginTab ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address or Phone Number *</label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="name@example.com or +252..."
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address (Optional)</label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Somali Phone Number (Signup only) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Somali Phone Number *</label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+252 90 7XXXXXX"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-1.5 py-3 px-4 bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            id="btn-auth-submit"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isLoginTab ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In to Platform</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create New Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
