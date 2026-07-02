import React from 'react';

interface SummaryCardsProps {
  metrics: {
    label: string;
    value: string | number;
    highlight?: boolean;
  }[];
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {metrics.map((metric, i) => (
        <div key={i} className={`p-4 rounded-lg border shadow-sm ${metric.highlight ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</div>
          <div className={`text-xl font-bold tracking-tight ${metric.highlight ? 'text-primary' : 'text-foreground'}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}
