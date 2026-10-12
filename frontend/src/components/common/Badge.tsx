import type { RiskLevel } from '../../types';

interface BadgeProps {
  level?: RiskLevel | string;
  variant?: 'risk' | 'neutral' | 'accent' | 'outline';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  level,
  variant = 'risk',
  children,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  if (variant === 'risk' && level) {
    const lvlUpper = level.toUpperCase();
    if (lvlUpper === 'LOW') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {children || 'LOW RISK'}
        </span>
      );
    }
    if (lvlUpper === 'MEDIUM') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {children || 'MEDIUM RISK'}
        </span>
      );
    }
    if (lvlUpper === 'HIGH') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-950/60 text-rose-400 border border-rose-500/40 shadow-glow-danger ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          {children || 'HIGH RISK'}
        </span>
      );
    }
  }

  if (variant === 'accent') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-mono text-slate-300 border border-slate-700 bg-slate-900/50 ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-slate-800 text-slate-300 ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
