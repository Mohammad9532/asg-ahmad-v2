import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Wallet, 
  AlertCircle, 
  ShoppingCart, 
  CreditCard, 
  Receipt,
  Store,
  Calendar,
  Activity,
  Bell,
  Users,
  Tags
} from 'lucide-react';

const reportGroups = [
  {
    title: 'Financial Reports',
    reports: [
      { name: 'Cash Book', path: '/reports/cash-book', icon: Wallet, desc: 'Daily cash inflows, outflows and running balances.' },
      { name: 'Ledger', path: '/reports/ledger', icon: BookOpen, desc: 'Double-entry transaction records.' },
      { name: 'Outstanding', path: '/reports/outstanding', icon: AlertCircle, desc: 'Unpaid bookings with ageing brackets.' },
    ]
  },
  {
    title: 'Operational Reports',
    reports: [
      { name: 'Bookings', path: '/reports/bookings', icon: ShoppingCart, desc: 'Detailed booking records.' },
      { name: 'Payments', path: '/reports/payments', icon: CreditCard, desc: 'Detailed payment receipts.' },
      { name: 'Expenses', path: '/reports/expenses', icon: Receipt, desc: 'Detailed operational expenses.' },
    ]
  },
  {
    title: 'Summary Reports',
    reports: [
      { name: 'Shop Summary', path: '/reports/shop-summary', icon: Store, desc: 'High-level metrics grouped by shop.' },
      { name: 'Monthly Collection', path: '/reports/monthly-collection', icon: Calendar, desc: 'Revenue grouped by month.' },
      { name: 'Payment Methods', path: '/reports/payment-methods', icon: Tags, desc: 'Revenue grouped by payment type.' },
    ]
  },
  {
    title: 'System Reports',
    reports: [
      { name: 'Activity Logs', path: '/reports/activity-logs', icon: Activity, desc: 'System-wide user actions.' },
      { name: 'Notifications', path: '/reports/notifications', icon: Bell, desc: 'System alerts and messages.' },
      { name: 'User Activity', path: '/reports/user-activity', icon: Users, desc: 'Authentication and user sessions.' },
    ]
  }
];

export default function ReportsIndex() {
  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Hub</h1>
        <p className="text-muted-foreground">Select a report below to analyze business metrics.</p>
      </div>

      <div className="space-y-8">
        {reportGroups.map((group, idx) => (
          <div key={idx}>
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.reports.map((report, rIdx) => {
                const Icon = report.icon;
                return (
                  <Link 
                    key={rIdx} 
                    to={report.path}
                    className="bg-card p-4 rounded-lg border shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
