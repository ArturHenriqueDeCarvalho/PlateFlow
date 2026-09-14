import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-md border select-none';

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    neutral: {
      container: 'bg-zinc-800 text-zinc-200 border-zinc-700',
      dot: 'bg-zinc-300',
    },
    success: {
      container: 'bg-emerald-950 text-emerald-300 border-emerald-700/80',
      dot: 'bg-emerald-400',
    },
    warning: {
      container: 'bg-amber-950 text-amber-300 border-amber-700/80',
      dot: 'bg-amber-400',
    },
    error: {
      container: 'bg-rose-950 text-rose-300 border-rose-700/80',
      dot: 'bg-rose-400',
    },
    info: {
      container: 'bg-sky-950 text-sky-300 border-sky-700/80',
      dot: 'bg-sky-400',
    },
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant].container} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${variantStyles[variant].dot} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
