import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  DatabaseBackup, 
  ListOrdered, 
  Info
} from 'lucide-react';

const systemModules = [
  { name: 'Health & Diagnostics', path: '/system/health', icon: HeartPulse, desc: 'Real-time metrics and infrastructure status.' },
  { name: 'Database Backups', path: '/system/backups', icon: DatabaseBackup, desc: 'Manage automated and manual data snapshots.' },
  { name: 'Queue Status', path: '/system/queue', icon: ListOrdered, desc: 'Monitor background jobs and retry failures.' },
  { name: 'Application Info', path: '/system/info', icon: Info, desc: 'Version, build, and environment details.' },
];

export default function SystemIndex() {
  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Operations</h1>
        <p className="text-muted-foreground">Monitor and manage technical infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemModules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <Link 
              key={idx} 
              to={module.path}
              className="bg-card p-4 rounded-lg border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group"
            >
              <div className="p-3 bg-primary/10 text-primary w-fit rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{module.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
