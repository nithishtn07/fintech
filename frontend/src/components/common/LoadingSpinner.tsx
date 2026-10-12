import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }[size];

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses} rounded-full border-cyan-500/20 border-t-cyan-400 animate-spin`}
      />
      {label && <span className="text-sm text-slate-400 font-medium">{label}</span>}
    </div>
  );
};
