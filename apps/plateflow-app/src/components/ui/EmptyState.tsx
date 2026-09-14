import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/60 my-4">
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-300 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
