import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <FolderOpen className="w-12 h-12" />,
  title = "No data available",
  description = "There is nothing to display here at the moment.",
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
