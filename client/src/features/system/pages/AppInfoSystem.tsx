import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Code2, Tag, Server, Clock } from 'lucide-react';
import api from '@/config/api';

export default function AppInfoSystem() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => (await api.get('/system/info')).data,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading application information...</div>;
  }

  const info = data || {};

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application Information</h1>
        <p className="text-muted-foreground">Current deployment and version details.</p>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{info.company_name}</h2>
              <p className="text-muted-foreground text-sm font-medium">Business Management System</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {info.environment} Environment
            </span>
          </div>
        </div>

        <div className="p-0">
          <dl className="divide-y">
            <div className="flex px-6 py-4 hover:bg-muted/10 transition-colors">
              <dt className="w-1/3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="w-4 h-4" /> ERP Version
              </dt>
              <dd className="w-2/3 text-sm font-semibold">{info.erp_version}</dd>
            </div>
            <div className="flex px-6 py-4 hover:bg-muted/10 transition-colors">
              <dt className="w-1/3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Code2 className="w-4 h-4" /> Build Number
              </dt>
              <dd className="w-2/3 text-sm font-mono">{info.build_number}</dd>
            </div>
            <div className="flex px-6 py-4 hover:bg-muted/10 transition-colors">
              <dt className="w-1/3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Server className="w-4 h-4" /> API Version
              </dt>
              <dd className="w-2/3 text-sm font-mono">{info.api_version}</dd>
            </div>
            <div className="flex px-6 py-4 hover:bg-muted/10 transition-colors">
              <dt className="w-1/3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" /> Last Deployment
              </dt>
              <dd className="w-2/3 text-sm">
                {info.last_deployment ? new Date(info.last_deployment).toLocaleString() : 'Unknown'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
