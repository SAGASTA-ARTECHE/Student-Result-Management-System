import React from 'react';
import { ResultStatus } from '../../types';

interface StatusBadgeProps {
  status: ResultStatus | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXCLUDED' | 'GRADUATED' | 'A' | 'B' | 'C' | 'D' | 'F' | 'A+' | 'A-' | 'B+' | 'B-' | 'C+' | 'C-' | 'ADMINISTRATOR' | 'LECTURER' | 'STUDENT' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700';

  // Specific Grade Pills matching screenshots
  if (normalized === 'A' || normalized === 'A+' || normalized === 'A-' || normalized === 'DISTINCTION') {
    colorClasses = 'bg-emerald-100 text-emerald-700 font-bold';
  } else if (normalized === 'B' || normalized === 'B+' || normalized === 'B-' || normalized === 'PASS' || normalized === 'LECTURER') {
    colorClasses = 'bg-blue-100 text-blue-700 font-bold';
  } else if (normalized === 'C' || normalized === 'C+' || normalized === 'C-') {
    colorClasses = 'bg-amber-100 text-amber-800 font-bold';
  } else if (normalized === 'D' || normalized === 'D+' || normalized === 'D-') {
    colorClasses = 'bg-orange-100 text-orange-800 font-bold';
  } else if (normalized === 'F' || normalized === 'FAIL' || normalized === 'EXCLUSION') {
    colorClasses = 'bg-rose-100 text-rose-700 font-bold';
  } else if (normalized === 'ADMINISTRATOR') {
    colorClasses = 'bg-purple-100 text-purple-700 font-medium';
  } else if (normalized === 'STUDENT') {
    colorClasses = 'bg-emerald-100 text-emerald-700 font-medium';
  } else if (normalized === 'ACTIVE') {
    colorClasses = 'bg-emerald-50 text-emerald-600 font-medium';
  } else if (normalized === 'INACTIVE' || normalized === 'SUSPENDED') {
    colorClasses = 'bg-slate-100 text-slate-500 font-medium';
  } else if (normalized === 'GRADUATED') {
    colorClasses = 'bg-indigo-100 text-indigo-700 font-medium';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-md',
    lg: 'text-sm px-3 py-1.5 rounded-md font-semibold',
  }[size];

  return (
    <span
      id={`status-badge-${normalized.toLowerCase()}`}
      className={`inline-flex items-center justify-center tracking-normal ${sizeClasses} ${colorClasses}`}
    >
      {status}
    </span>
  );
};
