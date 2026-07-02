import React from 'react';
import { Wrench, Briefcase, Users, ArrowRight, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

interface LandingProps {
  workersCount: number;
  jobsCount: number;
  onNavigate: (page: string) => void;
  currentUser: any;
}

export default function Landing({ workersCount, jobsCount, onNavigate, currentUser }: LandingProps) {
  return (
    <div className="bg-slate-50/50" id="landing-page-container">
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 overflow-hidden py-20 sm:py-28 text-white px-4">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative max-w-5xl mx-auto text-center z-10 space-y-6">
          <div className="inline-flex items-center space-x-1.5 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5" />
            <span>Karkaar Region • Qardho, Somalia</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none max-w-4xl mx-auto">
            Empowering Qardho's <br />
            <span className="text-blue-500 bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">Skilled Labor</span> & Industry
          </h1>
          
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            The direct community bridge connecting expert plumbers, solar technicians, builders, tailors, and teachers in Qardho with local employers.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {(!currentUser || currentUser.role === 'employer') && (
              <button
                onClick={() => onNavigate('workers')}
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all cursor-pointer"
                id="landing-cta-workers"
              >
                <Users className="h-4 w-4" />
                <span>Hire Skilled Workers</span>
                <span className="bg-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {workersCount}
                </span>
              </button>
            )}
            {(!currentUser || currentUser.role === 'worker') && (
              <button
                onClick={() => onNavigate('jobs')}
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-sm rounded-xl hover:text-white transition-all cursor-pointer"
                id="landing-cta-jobs"
              >
                <Briefcase className="h-4 w-4 text-sky-400" />
                <span>Browse Job Board</span>
                <span className="bg-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {jobsCount}
                </span>
              </button>
            )}
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-3 max-w-xl mx-auto gap-3 pt-10 text-center text-xs text-slate-400">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="block text-lg sm:text-xl font-bold text-white font-mono">{workersCount}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Tradesmen</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="block text-lg sm:text-xl font-bold text-white font-mono">{jobsCount}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Active Jobs</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="block text-lg sm:text-xl font-bold text-emerald-400 font-mono">100%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Local Focus</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600"></div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block font-mono">Simple Process</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">How Skills Hub Qardho Works</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Our platform provides direct contact and transparent local booking with no hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Employers Path */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="bg-blue-50 text-blue-600 h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs mb-2">
              💼
            </div>
            <h3 className="text-lg font-bold text-slate-900">For Homeowners & Businesses</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Need repairs, solar setups, tailoring, or agricultural construction in Qardho? Search verified local profiles or post your specific job offer.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-600">
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Search workers by specialized trade skill</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Submit free connect requests with contact info</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Publish job details and receive applications</span>
              </li>
            </ul>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('workers')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group cursor-pointer"
              >
                <span>Discover skilled workers</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Workers Path */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="bg-emerald-50 text-emerald-600 h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs mb-2">
              🛠️
            </div>
            <h3 className="text-lg font-bold text-slate-900">For Trade Professionals</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Earn more in Qardho. Showcase your services, bio, work rates, and neighborhood location to be contacted directly by clients.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-600">
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Create a detailed business trade card</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Get direct connection offers with customer phone numbers</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Browse and apply to matching local job listings</span>
              </li>
            </ul>
            <div className="pt-4">
              {currentUser ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('auth')}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
                >
                  <span>Register as a Skilled Worker</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trust Badges */}
      <section className="bg-slate-100/50 border-y border-slate-100 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-start space-x-3.5">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Verified Local Talents</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect with reputable craftsmen with roots in the Qardho community.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5">
            <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Direct Negotiations</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                No intermediate commission or fees. Deal and coordinate straight with workers.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5">
            <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Neighborhood-specific</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filter labor options in Horseed, Wadajir, Gashan, Bulsho, or Rafto to save travel time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
