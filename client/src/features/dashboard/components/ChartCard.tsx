import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
}

export function ChartCard({ title, description, isLoading }: ChartCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm h-[350px] flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-muted/20 rounded border border-dashed border-muted-foreground/20">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded" />
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center">
            <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
            <span className="text-sm font-medium">Chart Placeholder</span>
            <span className="text-xs opacity-70 mt-1">Ready for Recharts integration</span>
          </div>
        )}
      </div>
    </div>
  );
}
