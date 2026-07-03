import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { AlertCircle } from 'lucide-react';

interface AppCardProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  emptyProps?: React.ComponentProps<typeof EmptyState>;
  noPadding?: boolean;
}

export function AppCard({
  title,
  icon,
  actions,
  children,
  footer,
  className,
  bodyClassName,
  isLoading = false,
  isEmpty = false,
  isError = false,
  emptyProps,
  noPadding = false,
}: AppCardProps) {
  
  // Decide content to render
  let content;
  if (isLoading) {
    content = (
      <div className={cn("p-6 space-y-4", bodyClassName)}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-3/4" />
      </div>
    );
  } else if (isError) {
    content = (
      <div className={cn("p-8 flex flex-col items-center justify-center text-center text-destructive", bodyClassName)}>
        <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
        <p className="font-medium text-sm">Failed to load data</p>
      </div>
    );
  } else if (isEmpty) {
    content = (
      <EmptyState 
        {...emptyProps} 
        className={cn("py-12", emptyProps?.className)} 
      />
    );
  } else {
    content = (
      <div className={cn(noPadding ? "" : "p-5 sm:p-6", bodyClassName)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-border/50 flex flex-col overflow-hidden transition-all duration-200", className)}>
      
      {/* Header */}
      {(title || icon || actions) && (
        <div className="px-5 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            {title && <h3 className="font-semibold text-foreground text-sm sm:text-base">{title}</h3>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col">
        {content}
      </div>

      {/* Footer */}
      {footer && !isLoading && !isEmpty && !isError && (
        <div className="px-5 sm:px-6 py-4 border-t border-border/50 bg-muted/10">
          {footer}
        </div>
      )}
      
    </div>
  );
}
