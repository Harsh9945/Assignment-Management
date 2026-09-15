import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-slate-200 bg-white text-sm text-slate-700 ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, className = '' }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3.5 whitespace-nowrap text-sm ${className}`}>{children}</td>;
}
