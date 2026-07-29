import React, { useState } from 'react';
import { Wrench, Plus, X, Check } from 'lucide-react';

interface SkillSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

const POPULAR_SKILLS = [
  'Construction Worker',
  'Solar Technician',
  'Electrician',
  'IT & Tech Support',
  'Mason & Builder',
  'Professional Tailor',
  'Plumber & Pipefitter',
  'Painter',
  'Carpenter',
  'Auto Mechanic',
  'Driver',
  'Teacher / Tutor',
  'Chef & Cook',
];

export default function SkillSelector({ value = '', onChange, label = 'Primary Skill / Occupation *', error }: SkillSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  // Parse comma-separated string into list of trimmed skill tags
  const skillsList = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const updateSkills = (newList: string[]) => {
    // Deduplicate case-insensitively while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of newList) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    onChange(unique.join(', '));
  };

  const handleAddCustomSkill = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      updateSkills([...skillsList, trimmed]);
    }
    setCustomInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    updateSkills(skillsList.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const handleTogglePopularSkill = (popularSkill: string) => {
    const exists = skillsList.some((s) => s.toLowerCase() === popularSkill.toLowerCase());
    if (exists) {
      handleRemoveSkill(popularSkill);
    } else {
      updateSkills([...skillsList, popularSkill]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };

  return (
    <div className="space-y-3 min-w-0">
      <label className="block text-xs font-black uppercase text-slate-600">
        {label}
      </label>

      {/* Selected Skills Tags Display */}
      {skillsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Your Skills:</span>
          {skillsList.map((sk) => (
            <span
              key={sk}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-1 text-xs font-bold text-white shadow-2xs animate-in fade-in zoom-in-95 duration-100"
            >
              <span>{sk}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(sk)}
                className="rounded-md p-0.5 hover:bg-white/20 transition focus:outline-none"
                title={`Remove ${sk}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom Skill Input Field with Add Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Wrench className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10"
            placeholder="Type a skill (e.g. Electrician) and tap Add..."
          />
        </div>
        <button
          type="button"
          onClick={handleAddCustomSkill}
          disabled={!customInput.trim()}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Quick-Add Popular Skills Suggestions */}
      <div>
        <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
          Tap to add popular skills:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((popSkill) => {
            const isSelected = skillsList.some((s) => s.toLowerCase() === popSkill.toLowerCase());
            return (
              <button
                key={popSkill}
                type="button"
                onClick={() => handleTogglePopularSkill(popSkill)}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-blue-50 text-[#2563eb] border border-blue-200 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {isSelected ? <Check className="h-3.5 w-3.5 text-[#2563eb]" /> : <Plus className="h-3.5 w-3.5 text-slate-400" />}
                <span>{popSkill}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
