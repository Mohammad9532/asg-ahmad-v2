import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface FilterPanelProps {
  filters: string[];
}

export function FilterPanel({ filters }: FilterPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleClear = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-end mb-6">
      
      {filters.includes('search') && (
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
          <Input 
            placeholder="Search reference, names..." 
            value={searchParams.get('search') || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
      )}

      {filters.includes('date_range') && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
            <Input 
              type="date"
              value={searchParams.get('start_date') || ''}
              onChange={(e) => handleChange('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
            <Input 
              type="date"
              value={searchParams.get('end_date') || ''}
              onChange={(e) => handleChange('end_date', e.target.value)}
            />
          </div>
        </>
      )}

      {filters.includes('shop') && (
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Shop</label>
          <Select 
            value={searchParams.get('shop_id') || ''}
            onChange={(e) => handleChange('shop_id', e.target.value)}
            options={[{value: '', label: 'All Shops'}, ...(lookups?.shops?.map((s:any) => ({value: String(s.id), label: s.name})) || [])]}
          />
        </div>
      )}

      {filters.includes('payment_method') && (
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method</label>
          <Select 
            value={searchParams.get('payment_method_id') || ''}
            onChange={(e) => handleChange('payment_method_id', e.target.value)}
            options={[{value: '', label: 'All Methods'}, ...(lookups?.payment_methods?.map((m:any) => ({value: String(m.id), label: m.name})) || [])]}
          />
        </div>
      )}

      {filters.includes('department') && (
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
          <Select 
            value={searchParams.get('department_id') || ''}
            onChange={(e) => handleChange('department_id', e.target.value)}
            options={[{value: '', label: 'All Departments'}, ...(lookups?.departments?.map((d:any) => ({value: String(d.id), label: d.name})) || [])]}
          />
        </div>
      )}
      
      {filters.includes('transaction_type') && (
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
          <Select 
            value={searchParams.get('transaction_type') || ''}
            onChange={(e) => handleChange('transaction_type', e.target.value)}
            options={[
              {value: '', label: 'All Types'},
              {value: 'Booking', label: 'Booking'},
              {value: 'Payment', label: 'Payment'},
              {value: 'Expense', label: 'Expense'}
            ]}
          />
        </div>
      )}

      {Array.from(searchParams.keys()).length > 0 && (
        <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
          Clear Filters
        </Button>
      )}

    </div>
  );
}
