import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/config/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';

interface RecentActivityProps {
  title: string;
  queryKey: string;
  endpoint: string;
  viewAllLink: string;
  renderItem: (item: any) => React.ReactNode;
}

export function RecentActivity({ title, queryKey, endpoint, viewAllLink, renderItem }: RecentActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Pre-load slightly before scrolling into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, 'recent'],
    queryFn: async () => {
      const res = await api.get(endpoint);
      return res.data?.data || [];
    },
    enabled: isVisible, // Only fetch when visible
  });

  return (
    <div ref={containerRef} className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
        <Link to={viewAllLink} className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-colors">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 p-0 overflow-y-auto bg-slate-50/30">
        {!isVisible || isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-100" />)}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm font-medium text-rose-500 bg-rose-50/50 m-4 rounded-xl">Failed to load {title.toLowerCase()}</div>
        ) : data?.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-slate-400">No recent {title.toLowerCase()} found.</div>
        ) : (
          <div className="divide-y divide-slate-100/60 p-2">
            {data.slice(0, 10).map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-white rounded-xl transition-colors group cursor-default">
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
