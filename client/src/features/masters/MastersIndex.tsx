import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Building2, 
  Tags, 
  Receipt,
  Users,
  CreditCard
} from 'lucide-react';

const masterModules = [
  { name: 'Shops', path: '/masters/shops', icon: Store, desc: 'Manage branch locations.' },
  { name: 'Departments', path: '/masters/departments', icon: Building2, desc: 'Organizational structures.' },
  { name: 'Expense Categories', path: '/masters/expense-categories', icon: Tags, desc: 'Top-level expense types.' },
  { name: 'Expense Masters', path: '/masters/expense-masters', icon: Receipt, desc: 'Specific expense items.' },
  { name: 'Employees', path: '/masters/employees', icon: Users, desc: 'Staff and personnel records.' },
  { name: 'Payment Methods', path: '/masters/payment-methods', icon: CreditCard, desc: 'Accepted payment channels.' },
];

export default function MastersIndex() {
  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Data Management</h1>
        <p className="text-muted-foreground">Configure the core entities used across the ERP.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {masterModules.map((module, idx) => {
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
