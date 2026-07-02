import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  Settings, 
  Activity,
  Bell
} from 'lucide-react';

const adminModules = [
  { name: 'User Management', path: '/admin/users', icon: Users, desc: 'Manage users, roles, and shop access.' },
  { name: 'System Roles', path: '/admin/roles', icon: ShieldCheck, desc: 'View configured security roles and permissions.' },
  { name: 'System Settings', path: '/admin/settings', icon: Settings, desc: 'Global configurations and integrations.' },
  { name: 'Activity Logs', path: '/admin/activity-logs', icon: Activity, desc: 'Immutable system audit trails.' },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell, desc: 'Inbox for system alerts.' },
];

export default function AdminIndex() {
  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground">Manage global configurations, security, and audit logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <Link 
              key={idx} 
              to={module.path}
              className="bg-card p-4 rounded-lg border shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
