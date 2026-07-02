import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Play, AlertCircle, CheckCircle2, ListOrdered } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import { Button } from '@/components/ui/Button';
import { ReportTable } from '../../reports/components/ReportTable';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

export default function QueueSystem() {
  const queryClient = useQueryClient();
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['system-queue'],
    queryFn: async () => (await api.get('/system/queue')).data,
    retry: false,
  });

  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      setRetryingIds(prev => new Set(prev).add(id));
      await api.post(`/system/queue/${id}/retry`);
    },
    onSuccess: () => {
      // Small delay to allow worker to pick it up before we refresh
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['system-queue'] });
        setRetryingIds(new Set());
      }, 1500);
    },
    onError: (err, id) => {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert('Failed to retry job');
    }
  });

  if (isLoading && !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading queue status...</div>;
  }

  // Assuming data structure: { connection, pending_jobs, failed_jobs: [] }
  const queue = data || { connection: 'database', pending_jobs: 0, failed_jobs: [] };

  const columns = [
    columnHelper.accessor('id', { 
      header: 'ID',
      cell: i => <span className="font-mono text-xs">{i.getValue()}</span>
    }),
    columnHelper.accessor('connection', { header: 'Connection' }),
    columnHelper.accessor('queue', { header: 'Queue' }),
    columnHelper.accessor('failed_at', { 
      header: 'Failed At',
      cell: i => <span className="text-sm whitespace-nowrap">{new Date(i.getValue()).toLocaleString()}</span>
    }),
    columnHelper.accessor('exception', { 
      header: 'Exception',
      cell: i => (
        <div className="max-w-md max-h-20 overflow-y-auto text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950 p-2 rounded whitespace-pre-wrap">
          {i.getValue().split('\n')[0]} {/* Show only first line for brevity */}
        </div>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const id = info.row.original.id;
        const isRetrying = retryingIds.has(id);
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => retryMutation.mutate(id)}
            disabled={isRetrying || retryMutation.isPending}
          >
            {isRetrying ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Play className="w-3 h-3 mr-2" />}
            Retry
          </Button>
        );
      }
    })
  ];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Status</h1>
          <p className="text-muted-foreground">Monitor background jobs and retry failures (Super Admin).</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Queue Driver</p>
            <h3 className="text-2xl font-bold uppercase">{queue.connection}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Jobs</p>
            <h3 className="text-2xl font-bold">{queue.pending_jobs}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Failed Jobs</p>
            <h3 className="text-2xl font-bold">{queue.failed_jobs?.length || 0}</h3>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Failed Jobs Queue
          </h3>
        </div>
        {queue.failed_jobs?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4 opacity-50" />
            <p>No failed jobs in the queue. Everything is running smoothly.</p>
          </div>
        ) : (
          <ReportTable 
            data={queue.failed_jobs} 
            columns={columns} 
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
}
