import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';

import { ReportTable } from '../../reports/components/ReportTable';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

export default function RolesAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
  });

  const columns = [
    columnHelper.accessor('name', { 
      header: 'Role Name', 
      cell: i => <span className="font-semibold">{i.getValue()}</span> 
    }),
    columnHelper.accessor('guard_name', { 
      header: 'Guard',
      cell: i => <span className="text-muted-foreground text-xs">{i.getValue()}</span>
    }),
    columnHelper.accessor('permissions', { 
      header: 'Permissions',
      cell: i => {
        const perms = i.getValue() || [];
        return (
          <div className="flex flex-wrap gap-1">
            {perms.slice(0, 5).map((p: any) => (
              <span key={p.id} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded">
                {p.name}
              </span>
            ))}
            {perms.length > 5 && (
              <span className="text-xs text-muted-foreground">+{perms.length - 5} more</span>
            )}
            {perms.length === 0 && <span className="text-muted-foreground italic text-xs">No specific permissions</span>}
          </div>
        );
      }
    }),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Roles</h1>
        <p className="text-muted-foreground">Pre-configured roles and their associated permissions (Read-only).</p>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <ReportTable 
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
