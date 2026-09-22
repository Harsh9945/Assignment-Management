import React from 'react';
import Badge from './Badge';

export default function ProgressBar({
  confirmed = 0,
  eligible = 0,
  percentage = null,
  showDetails = true,
  className = ''
}) {
  const isZeroEligible = eligible === 0;
  const computedPercentage = percentage !== null && percentage !== undefined
    ? percentage
    : (!isZeroEligible ? Math.round((confirmed / eligible) * 100) : null);

  const isCompleted = computedPercentage === 100;

  return (
    <div className={`w-full ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            Group Progress:
            <span className="font-semibold text-slate-900">
              {isZeroEligible ? 'N/A' : `${confirmed} / ${eligible} confirmed`}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              {isZeroEligible ? 'N/A' : `${computedPercentage}%`}
            </span>
            {isCompleted && (
              <Badge variant="confirmed" size="xs" className="animate-in zoom-in duration-300">
                <svg className="w-3 h-3 text-emerald-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                100% Completed
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-in-out ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-200'
              : computedPercentage && computedPercentage > 0
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
              : 'bg-slate-300'
          }`}
          style={{ width: `${isZeroEligible ? 0 : Math.min(100, Math.max(0, computedPercentage || 0))}%` }}
        />
      </div>
    </div>
  );
}
