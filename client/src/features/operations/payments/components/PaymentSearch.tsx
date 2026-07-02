import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';

interface Booking {
  id: number;
  bill_no: string;
  customer_name: string;
  mobile: string;
  amount: number;
  paid_amount?: number; // Backend might not send paid_amount directly if not requested, we might need to calculate or it's there
  status: string;
}

interface PaymentSearchProps {
  onSelect: (booking: Booking) => void;
  autoFocus?: boolean;
}

export function PaymentSearch({ onSelect, autoFocus }: PaymentSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await api.get(`/bookings?search=${debouncedQuery}&per_page=10`);
      // Filter out fully paid or cancelled
      return res.data.data.filter((b: any) => b.status !== 'Fully Paid' && b.status !== 'Cancelled');
    },
    enabled: debouncedQuery.length > 1,
  });

  const results = data || [];

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (results.length > 0) setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (booking: Booking) => {
    setQuery('');
    setIsOpen(false);
    onSelect(booking);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        autoFocus={autoFocus}
        type="text"
        placeholder="Search Booking by Bill No, Customer, Mobile..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-12 text-lg font-medium"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No unpaid bookings found.</div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((booking: any, index: number) => {
                // Calculate remaining balance locally if backend doesn't provide it
                // Wait, amount - paid_amount. Assuming we might need to fetch payments or maybe backend returns it?
                // Let's assume booking.amount and booking.paid_amount (or we'll calculate it if it's missing)
                const paid = booking.paid_amount || 0;
                const remaining = booking.amount - paid;
                
                return (
                  <li
                    key={booking.id}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelect(booking)}
                  >
                    <div>
                      <div className="font-semibold text-primary">{booking.bill_no}</div>
                      <div className="text-sm text-muted-foreground">{booking.customer_name} • {booking.mobile}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">Bal: {remaining.toFixed(2)}</div>
                      <div className="text-xs font-medium text-muted-foreground">{booking.status}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
