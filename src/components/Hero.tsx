import React from 'react';
import { Briefcase, Wrench, ShieldCheck, MapPin } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-slate-900 overflow-hidden rounded-2xl mb-8" id="platform-hero">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="relative max-w-5xl mx-auto px-6 py-12 sm:py-16 text-center z-10">
        <div className="inline-flex items-center space-x-1.5 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <MapPin className="h-3 w-3" />
          <span>Serving Qardho & Karkaar Region</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Hire Trusted Local <span className="text-blue-500">Skilled Workers</span> in Qardho
        </h1>
        
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
          Xirfad Qardho connects specialized carpenters, solar technicians, builders, tailors, and teachers with homeowners and local businesses.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-slate-700/50">
            <Wrench className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-slate-200">50+ Active Tradesmen</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-slate-700/50">
            <Briefcase className="h-4 w-4 text-brand-500" />
            <span className="font-medium text-slate-200">Verified Job Postings</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-slate-700/50">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-slate-200">Safe Local Connections</span>
          </div>
        </div>
      </div>
      
      {/* Decorative accent block */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-600"></div>
    </div>
  );
}


