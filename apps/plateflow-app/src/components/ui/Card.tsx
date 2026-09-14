import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  header?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  headerAction,
  header,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm ${className}`}
      {...props}
    >
      {(header || title || description || headerAction) && (
        <div className="border-b border-zinc-800 px-5 py-4">
          {header ? (
            header
          ) : (
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
                )}
                {description && (
                  <p className="text-xs text-zinc-300 mt-0.5">{description}</p>
                )}
              </div>
              {headerAction && <div className="ml-4 shrink-0">{headerAction}</div>}
            </div>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
