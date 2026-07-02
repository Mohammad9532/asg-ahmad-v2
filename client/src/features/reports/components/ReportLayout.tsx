import React from 'react';
import { ExportToolbar } from './ExportToolbar';

interface ReportLayoutProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function ReportLayout({ title, description, actions, children }: ReportLayoutProps) {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ExportToolbar />
        </div>
      </div>
      {children}
    </div>
  );
}
