import React from 'react';
import { AppCard } from '@/components/ui/AppCard';
import { Truck, Clock, AlertTriangle, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayWorkProps {
  isLoading?: boolean;
  deliveries: number;
  pending: number;
  late: number;
  pickups: number;
}

export function TodayWorkCard({ isLoading, deliveries, pending, late, pickups }: TodayWorkProps) {
  
  const Item = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-base font-bold", colorClass.includes('rose') ? 'text-rose-600' : 'text-foreground')}>
        {value}
      </span>
    </div>
  );

  return (
    <AppCard title="Today's Work" isLoading={isLoading} noPadding>
      <div className="p-4 sm:p-5 flex flex-col gap-1">
        <Item icon={Truck} label="Today's Deliveries" value={deliveries} colorClass="text-blue-600" />
        <Item icon={Clock} label="Pending Deliveries" value={pending} colorClass="text-amber-600" />
        <Item icon={AlertTriangle} label="Late Deliveries" value={late} colorClass="text-rose-600" />
        <Item icon={PackageCheck} label="Today's Pickups" value={pickups} colorClass="text-emerald-600" />
      </div>
    </AppCard>
  );
}
