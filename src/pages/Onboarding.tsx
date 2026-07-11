import React, { useState } from 'react';
import { User, MapPin, Briefcase, DollarSign, FileText, ArrowRight, Check } from 'lucide-react';
import { User as UserType } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface OnboardingProps {
  currentUser: UserType;
  onCompleteOnboarding: (updatedUser: UserType) => void;
}

export default function Onboarding({ currentUser, onCompleteOnboarding }: OnboardingProps) {
  const [role, setRole] = useState<'worker' | 'employer' | null>(null);
  const [skill, setSkill] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError('Please select whether you are a Worker or an Employer.');
      return;
    }

    if (role === 'worker' && !skill.trim()) {
      setError('Please specify your Trade Specialty / Skill.');
      return;
    }

    const updatedUser: UserType = {
      ...currentUser,
      role,
      location: location.trim() || undefined,
      skill: role === 'worker' ? skill.trim() : undefined,
      rate: role === 'worker' ? (rate.trim() || undefined) : undefined,
      bio: bio.trim() || undefined,
    };

    onCompleteOnboarding(updatedUser);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in" id="onboarding-page">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>Profile Setup</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome to Xirfad Qardho, {currentUser.name}!
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Let's customize your experience. Complete your profile to start connecting with employers or skilled talent in the Karkaar region.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Step 1: Select Role */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              Step 1: Choose Your Account Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Worker Card */}
              <div
                onClick={() => setRole('worker')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  role === 'worker'
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                }`}
                id="role-select-worker"
              >
                {role === 'worker' && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-2xl">🛠️</div>
                  <h3 className="font-bold text-slate-900">I am a Skilled Worker</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    I want to showcase my trade, let people contact me for work, and apply to job listings.
                  </p>
                </div>
              </div>

              {/* Employer Card */}
              <div
                onClick={() => setRole('employer')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  role === 'employer'
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                }`}
                id="role-select-employer"
              >
                {role === 'employer' && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-2xl">💼</div>
                  <h3 className="font-bold text-slate-900">I am an Employer</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    I want to search for local trade specialists, request connections, or post job listings.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Step 2: Extra details based on role */}
          {role && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Step 2: Tell Us More About You
              </h2>

              <div className="grid grid-cols-1 gap-4">
                
                {/* Neighborhood Input (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Neighborhood (Optional)
                  </label>
                  <div className="relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    >
                      <option value="">Select neighborhood</option>
                      {QARDHO_NEIGHBORHOODS.map((neighborhood) => (
                        <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter your specific Qardho neighborhood to receive offers nearby.
                  </p>
                </div>

                {/* Worker Specific Inputs */}
                {role === 'worker' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Skill */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Trade Specialty / Skill *
                        </label>
                        <div className="relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            placeholder="e.g. Plumber, Solar Electrician, Carpenter..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Daily Rate */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Expected Daily Rate (Optional)
                        </label>
                        <div className="relative rounded-md shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="e.g. $15/day, $20/day"
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Bio / Experience (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {role === 'worker' ? 'Short Bio & Work Experience' : 'About Your Household or Business'} (Optional)
                  </label>
                  <div className="relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={
                        role === 'worker'
                          ? "Write a brief sentence about your background, number of years of experience, or types of projects you work on..."
                          : "Describe your home repairs, business nature, or general projects you need help with..."
                      }
                      rows={3}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center space-x-1.5 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition-colors cursor-pointer"
            id="onboarding-submit-btn"
          >
            <span>Complete Setup & Enter Platform</span>
            <ArrowRight className="h-4 w-4" />
          </button>

        </form>
      </div>
    </div>
  );
}
