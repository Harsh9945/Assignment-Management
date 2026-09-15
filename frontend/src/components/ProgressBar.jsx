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
            <span className="font-semibold text-slate-900">
              {isZeroEligible ? 'N/A' : `${computedPercentage}%`}
            </span>
            {isCompleted && (
              <Badge variant="confirmed" size="xs">
                ✓ Completed
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
            isCompleted
              ? 'bg-emerald-500'
              : computedPercentage && computedPercentage > 0
              ? 'bg-emerald-600'
              : 'bg-slate-300'
          }`}
          style={{ width: `${isZeroEligible ? 0 : Math.min(100, Math.max(0, computedPercentage || 0))}%` }}
        />
      </div>
    </div>
  );
}
