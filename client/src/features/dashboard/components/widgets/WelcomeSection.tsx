import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, subMonths } from 'date-fns';

const today = () => new Date();
export const DATE_PRESETS = [
  {
    label: 'Today',
    start: () => format(today(), 'yyyy-MM-dd'),
    end:   () => format(today(), 'yyyy-MM-dd'),
  },
  {
    label: 'This Week',
    start: () => format(startOfWeek(today(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    end:   () => format(endOfWeek(today(),   { weekStartsOn: 0 }), 'yyyy-MM-dd'),
  },
  {
    label: 'This Month',
    start: () => format(startOfMonth(today()), 'yyyy-MM-dd'),
    end:   () => format(today(), 'yyyy-MM-dd'),
  },
  {
    label: 'Last Month',
    start: () => format(startOfMonth(subMonths(today(), 1)), 'yyyy-MM-dd'),
    end:   () => format(endOfMonth(subMonths(today(), 1)),   'yyyy-MM-dd'),
  },
  {
    label: 'This Year',
    start: () => format(startOfYear(today()), 'yyyy-MM-dd'),
    end:   () => format(today(), 'yyyy-MM-dd'),
  },
];

interface WelcomeSectionProps {
  activePresetLabel: string;
  onPresetSelect: (preset: typeof DATE_PRESETS[0]) => void;
  startDate: string;
  endDate: string;
}

export function WelcomeSection({ activePresetLabel, onPresetSelect, startDate, endDate }: WelcomeSectionProps) {
  const { user } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
      
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          Good Morning, <span className="text-primary">{user?.name?.split(' ')[0] || 'User'}!</span> 👋
        </h1>
        {/* @ts-ignore */}
        <p className="text-muted-foreground text-sm">Here's what's happening at {user?.shop?.name || 'your business'} today.</p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Calendar className="w-4 h-4" />
          <span className="font-medium whitespace-nowrap">{startDate} <span className="mx-1">→</span> {endDate}</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-card border border-border/50 hover:bg-muted/50 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-colors"
          >
            {activePresetLabel}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden z-20">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onPresetSelect(preset);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activePresetLabel === preset.label 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
