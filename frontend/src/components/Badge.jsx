import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = ''
}) {
  const variants = {
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200',
    active: 'bg-sky-100 text-sky-800 border-sky-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    student: 'bg-teal-100 text-teal-800 border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-sm font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variants[variant] || variants.neutral} ${
        sizes[size] || sizes.sm
      } ${className}`}
    >
      {children}
    </span>
  );
}
