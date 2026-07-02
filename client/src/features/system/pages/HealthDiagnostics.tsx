import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeartPulse, Database, HardDrive, ListOrdered, ShieldAlert, Cpu } from 'lucide-react';
import api from '@/config/api';

const HealthCard = ({ title, status, details, icon: Icon }: any) => {
  const getColors = (stat: string) => {
    switch (stat) {
      case 'operational':
      case 'connected':
      case 'ok':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
      case 'degraded':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'failed':
      case 'disconnected':
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const colors = getColors(status);

  return (
    <div className={`p-4 rounded-xl border ${colors} flex items-start gap-4 transition-all hover:shadow-md`}>
      <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm font-medium uppercase mt-0.5 opacity-80">{status}</p>
        {details && (
          <div className="mt-2 text-xs opacity-70 space-y-1 font-mono">
            {Object.entries(details).map(([k, v]) => {
              if (k === 'status') return null;
              return (
                <div key={k} className="flex justify-between">
                  <span>{k.replace(/_/g, ' ')}:</span>
                  <span className="font-semibold text-right">{String(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function HealthDiagnostics() {
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => (await api.get('/system/health')).data,
    refetchInterval: 60000, // Auto refresh every 60s
  });

  const { data: diagnostics, isLoading: isDiagLoading } = useQuery({
    queryKey: ['system-diagnostics'],
    queryFn: async () => (await api.get('/system/diagnostics')).data,
    retry: false, // Don't retry auth errors if not Super Admin
  });

  if (isHealthLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading system metrics...</div>;
  }

  const diag = diagnostics || {};
  const isHealthy = health?.status === 'ok';

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Status: {isHealthy ? 'Operational' : 'Degraded'}</h1>
            <p className="text-muted-foreground text-sm">Last checked: {new Date(health?.timestamp || Date.now()).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {diagnostics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <HealthCard 
              title="Database" 
              status={diag.database?.status} 
              details={diag.database}
              icon={Database} 
            />
            <HealthCard 
              title="Cache Server" 
              status={diag.cache?.status} 
              details={diag.cache}
              icon={Cpu} 
            />
            <HealthCard 
              title="Storage Disk" 
              status={diag.disk?.status} 
              details={{
                used: `${diag.disk?.used_percentage}%`,
                free: `${(diag.disk?.free_bytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
                total: `${(diag.disk?.total_bytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
              }}
              icon={HardDrive} 
            />
            <HealthCard 
              title="Background Queue" 
              status={diag.queue?.status} 
              details={diag.queue}
              icon={ListOrdered} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" /> Software Versions
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">PHP Version</span>
                  <span>{diag.versions?.php}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Laravel Framework</span>
                  <span>{diag.versions?.laravel}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="uppercase">{diag.environment}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Debug Mode</span>
                  <span className={diag.debug_mode ? 'text-red-500 font-bold' : 'text-green-500'}>
                    {diag.debug_mode ? 'ENABLED (DANGER)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {diag.warnings && diag.warnings.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" /> Security Warnings
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-red-700 dark:text-red-300">
                  {diag.warnings.map((warn: string, idx: number) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {isDiagLoading && <div className="text-sm text-muted-foreground text-center animate-pulse">Running deep diagnostics...</div>}
    </div>
  );
}
