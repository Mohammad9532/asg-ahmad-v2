import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExpenseTable } from './components/ExpenseTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '@/config/api';

import { ExpenseModal } from './components/ExpenseModal';

export default function ExpensesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { page, search }],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { page, search, per_page: 25 }
      });
      return res.data;
    }
  });

  const handleEdit = (id: number) => {
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your business expenses.</p>
        </div>
        
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> New Expense
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input 
            placeholder="Search expenses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <ExpenseTable expenses={data?.data || []} isLoading={isLoading} onEdit={handleEdit} />
        
        {data?.meta && (
          <div className="p-4 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Showing {data.meta.from} to {data.meta.to} of {data.meta.total} results
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={page === data.meta.last_page}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ExpenseModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          editId={editId}
        />
      )}
    </div>
  );
}
