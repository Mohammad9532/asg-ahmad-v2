import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface AIInsightProps {
  isLoading?: boolean;
  insights: string[];
}

export function AIInsightCard({ isLoading, insights }: AIInsightProps) {
  if (isLoading) {
    return (
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <Skeleton className="w-24 h-4 bg-indigo-200" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-full h-3 bg-indigo-100" />
          <Skeleton className="w-3/4 h-3 bg-indigo-100" />
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-indigo-900">Business Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, idx) => (
          <li key={idx} className="text-xs font-medium text-indigo-700/80 flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
