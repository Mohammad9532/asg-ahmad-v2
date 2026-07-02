import React, { useState, useEffect } from 'react';
import { PaymentTable } from './components/PaymentTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PaymentModal } from './components/PaymentModal';

export default function PaymentsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleOpenNew = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments History</h1>
        <Button onClick={handleOpenNew}>+ Add Entry</Button>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium mb-1 block">Search</label>
          <Input 
            placeholder="Bill No, Customer, Remarks..." 
            className="h-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="text-xs font-medium mb-1 block">Payment Method</label>
          <Select 
            className="h-10"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Methods' },
              { value: '1', label: 'Cash' },
              { value: '2', label: 'Card' },
              { value: '3', label: 'Bank Transfer' },
            ]} 
          />
        </div>
        <div className="w-full md:w-48">
          <label className="text-xs font-medium mb-1 block">Date</label>
          <Input 
            type="date" 
            className="h-10" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <PaymentTable 
        onEdit={handleEdit}
        search={debouncedSearch}
        method={methodFilter}
        date={dateFilter}
      />
      
      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editId={editId}
      />
    </div>
  );
}
