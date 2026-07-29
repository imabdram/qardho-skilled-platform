import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  key: string;
  label: string;
  isDone: boolean;
  isCurrent?: boolean;
}

interface CompactProgressProps {
  steps: StepItem[];
}

export default function CompactProgress({ steps }: CompactProgressProps) {
  return (
    <div className="w-full">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workflow Progress</span>
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const statusBg = step.isDone
            ? 'bg-emerald-500 text-white font-extrabold border-emerald-600'
            : step.isCurrent
            ? 'bg-blue-600 text-white font-extrabold border-blue-700 ring-2 ring-blue-100'
            : 'bg-slate-100 text-slate-400 border-slate-200 font-medium';

          const textColor = step.isDone
            ? 'text-emerald-900 font-bold'
            : step.isCurrent
            ? 'text-blue-900 font-extrabold'
            : 'text-slate-400';

          return (
            <React.Fragment key={step.key || step.label}>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition ${statusBg}`}>
                  {step.isDone ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${textColor}`}>{step.label}</span>
              </div>

              {!isLast && (
                <div className={`h-0.5 min-w-4 flex-1 rounded-full transition-colors ${
                  step.isDone ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
