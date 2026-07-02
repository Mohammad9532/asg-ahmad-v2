import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';

import { ReportTable } from '../../reports/components/ReportTable'; // Reusing our generic table
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import api from '@/config/api';

interface MasterLayoutProps {
  title: string;
  description: string;
  endpoint: string;
  queryKey: string;
  columns: any[];
  FormComponent: React.FC<{
    initialData?: any;
    onSubmit: (data: any, action: 'save' | 'save_new') => void;
    isPending: boolean;
    onCancel: () => void;
  }>;
}

export function MasterLayout({ title, description, endpoint, queryKey, columns, FormComponent }: MasterLayoutProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch list
  const { data: listData, isLoading: isListLoading } = useQuery({
    queryKey: [queryKey, search],
    queryFn: async () => {
      const res = await api.get(endpoint, { params: { search, per_page: 50 } });
      return res.data;
    },
  });

  // Fetch single record if editing
  const { data: editData, isLoading: isEditLoading } = useQuery({
    queryKey: [queryKey, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`${endpoint}/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (id) {
        return api.put(`${endpoint}/${id}`, data);
      }
      return api.post(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] }); // Critical: Invalidate global lookups
    }
  });

  const handleSubmit = (data: any, action: 'save' | 'save_new') => {
    mutation.mutate(data, {
      onSuccess: () => {
        if (action === 'save_new') {
          navigate(`/masters/${queryKey.replace('_', '-')}`);
        } else {
          // Stay on the edit page (if it was an edit) or go back to list if it was a create but 'save'
          navigate(`/masters/${queryKey.replace('_', '-')}`);
        }
      }
    });
  };

  const handleCancel = () => {
    navigate(`/masters/${queryKey.replace('_', '-')}`);
  };

  const handleRowClick = (row: any) => {
    navigate(`/masters/${queryKey.replace('_', '-')}/${row.id}/edit`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Form Section */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        {isEditLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <FormComponent 
            initialData={editData} 
            onSubmit={handleSubmit} 
            isPending={mutation.isPending} 
            onCancel={handleCancel} 
          />
        )}
      </div>

      {/* List Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Records</h2>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ReportTable 
          columns={columns}
          data={listData?.data || []}
          isLoading={isListLoading}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
