import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  linkTo?: string;
  isLoading?: boolean;
  isError?: boolean;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  linkTo, 
  isLoading, 
  isError,
  color = 'indigo'
}: StatCardProps) {
  
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    slate: 'bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white',
  };

  const content = (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between group relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 opacity-[0.03] rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300 ${
        color === 'indigo' ? 'bg-indigo-500' : 
        color === 'emerald' ? 'bg-emerald-500' : 
        color === 'rose' ? 'bg-rose-500' : 
        color === 'amber' ? 'bg-amber-500' : 'bg-slate-500'
      }`}></div>

      <div className="flex items-start justify-between mb-4 z-10">
        <h3 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{title}</h3>
        <div className={`p-3 rounded-xl transition-colors duration-300 ${colorStyles[color]}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-3 mt-auto z-10">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </div>
      ) : isError ? (
        <div className="text-sm font-medium text-rose-500 mt-auto z-10">Failed to load data</div>
      ) : (
        <div className="mt-auto z-10">
          <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
              <span className="text-xs font-medium text-slate-400">vs last period</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo && !isLoading && !isError) {
    return <Link to={linkTo} className="block h-full">{content}</Link>;
  }

  return content;
}
