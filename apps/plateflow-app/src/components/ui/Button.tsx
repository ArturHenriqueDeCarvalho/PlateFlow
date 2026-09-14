import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const effectiveLeftIcon = icon || leftIcon;

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded-lg select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-3.5 py-2 gap-2 min-h-[38px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-zinc-100 text-zinc-950 font-semibold hover:bg-white active:bg-zinc-200 focus-visible:ring-zinc-300 shadow-sm',
    secondary:
      'bg-zinc-800 text-zinc-100 font-medium hover:bg-zinc-700 active:bg-zinc-750 border border-zinc-700 focus-visible:ring-zinc-400',
    outline:
      'border border-zinc-700 bg-transparent text-zinc-200 font-medium hover:bg-zinc-800 hover:text-white hover:border-zinc-600 focus-visible:ring-zinc-400',
    ghost:
      'bg-transparent text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 focus-visible:ring-zinc-400',
    danger:
      'bg-rose-600 text-white font-medium hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-400 shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        effectiveLeftIcon && <span className="inline-flex shrink-0">{effectiveLeftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
