import React from 'react';
import { cn } from '@/lib/utils';
import { AppCard } from '@/components/ui/AppCard';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trendValue?: number; // e.g. 12 (means 12%)
  trendLabel?: string; // e.g. "vs Yesterday"
  trendType?: 'positive' | 'negative' | 'neutral';
  colorTheme?: 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

export function KPICard({
  title,
  value,
  icon,
  trendValue,
  trendLabel,
  trendType = 'neutral',
  colorTheme = 'primary',
  isLoading = false,
}: KPICardProps) {
  
  // Theme styling maps
  const colorMap = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
  };

  const trendColorMap = {
    positive: 'text-emerald-500',
    negative: 'text-rose-500',
    neutral: 'text-slate-500',
  };

  const TrendArrow = () => {
    if (trendType === 'positive') return <span>↑</span>;
    if (trendType === 'negative') return <span>↓</span>;
    return <span>—</span>;
  };

  return (
    <AppCard 
      isLoading={isLoading} 
      className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer group"
      bodyClassName="p-5 flex flex-col justify-between h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", colorMap[colorTheme])}>
            {icon}
          </div>
          <h3 className="text-sm font-bold text-muted-foreground">{title}</h3>
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-2xl font-black text-foreground mb-1 tracking-tight">
          {value}
        </div>
        
        {trendValue !== undefined && (
          <div className="text-xs font-semibold flex items-center gap-1.5 mt-2">
            <span className={cn("flex items-center gap-0.5", trendColorMap[trendType])}>
              <TrendArrow /> {Math.abs(trendValue)}%
            </span>
            {trendLabel && <span className="text-muted-foreground opacity-80">{trendLabel}</span>}
          </div>
        )}
      </div>
    </AppCard>
  );
}
