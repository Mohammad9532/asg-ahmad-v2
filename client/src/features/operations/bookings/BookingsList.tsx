import React, { useState, useEffect } from 'react';
import { BookingTable } from './components/BookingTable';
import { DeliveryTracking } from './components/DeliveryTracking';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingModal } from './components/BookingModal';

export default function BookingsList() {
  const { user } = useAuthStore();
  const role = user?.role?.name || '';
  const canCreate = ['Super Admin', 'Owner', 'Shop Manager', 'Cashier'].includes(role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'tracking'>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground text-sm">Manage tailoring bookings and deliveries.</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenNew}>+ New Booking</Button>
        )}
      </div>

      <div className="flex border-b border-border">
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Bookings
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'tracking' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('tracking')}
        >
          Delivery Tracking
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
          <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium mb-1 block">Search</label>
              <Input 
                placeholder="Bill No, Customer, Mobile..." 
                className="h-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs font-medium mb-1 block">Status</label>
              <Select 
                className="h-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: '0', label: 'Stock' },
                  { value: '1', label: 'Partially Paid' },
                  { value: '2', label: 'Fully Paid' },
                  { value: '3', label: 'Delivered' },
                  { value: '4', label: 'Cancelled' },
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

          <BookingTable 
            onEdit={handleEdit} 
            search={debouncedSearch}
            status={statusFilter}
            date={dateFilter}
          />
        </>
      ) : (
        <DeliveryTracking />
      )}

      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editId={editId}
      />
    </div>
  );
}
