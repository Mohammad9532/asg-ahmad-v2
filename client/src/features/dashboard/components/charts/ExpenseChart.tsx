import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AppCard } from '@/components/ui/AppCard';

interface ChartProps {
  isLoading?: boolean;
  data: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export function ExpenseChart({ isLoading, data }: ChartProps) {
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-lg rounded-lg p-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">{payload[0].name}</p>
          <p className="text-sm font-black text-rose-600">
            AED {payload[0].value.toLocaleString('en-AE')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppCard title="Expenses by Category" isLoading={isLoading} isEmpty={!data || data.length === 0}>
      <div className="flex items-center justify-between h-[250px]">
        
        {/* Chart */}
        <div className="w-1/2 h-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="w-1/2 flex flex-col justify-center gap-3 pl-4 border-l border-border/50">
          {data?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[11px] font-semibold text-muted-foreground truncate w-20">{entry.name}</span>
              </div>
              <span className="text-[11px] font-bold text-foreground">
                {entry.percent}%
              </span>
            </div>
          ))}
        </div>

      </div>
    </AppCard>
  );
}
