import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import BookingsList from './features/operations/bookings/BookingsList';

import PaymentsList from './features/operations/payments/PaymentsList';
import PaymentView from './features/operations/payments/PaymentView';
import ExpensesList from './features/operations/expenses/ExpensesList';
import Dashboard from './features/dashboard/Dashboard';


import ExpenseView from './features/operations/expenses/ExpenseView';

const ReportsIndex = React.lazy(() => import('./features/reports/ReportsIndex'));
const CashBookReport = React.lazy(() => import('./features/reports/pages/CashBookReport'));
const LedgerReport = React.lazy(() => import('./features/reports/pages/LedgerReport'));
const OutstandingReport = React.lazy(() => import('./features/reports/pages/OutstandingReport'));

import { 
  PaymentReport, ExpenseReport, BookingReport, 
  ShopSummary, MonthlySummary, PaymentMethodSummary,
  ActivityLogReport, NotificationReport, UserActivityReport 
} from './features/reports/pages/OtherReports';

const MastersIndex = React.lazy(() => import('./features/masters/MastersIndex'));
const ShopsMaster = React.lazy(() => import('./features/masters/pages/ShopsMaster'));
const ExpenseSettings = React.lazy(() => import('./features/masters/pages/ExpenseSettings'));

const AdminIndex = React.lazy(() => import('./features/admin/AdminIndex'));
const UsersAdmin = React.lazy(() => import('./features/admin/pages/UsersAdmin'));
const RolesAdmin = React.lazy(() => import('./features/admin/pages/RolesAdmin'));
const SettingsAdmin = React.lazy(() => import('./features/admin/pages/SettingsAdmin'));
const ActivityLogsAdmin = React.lazy(() => import('./features/admin/pages/ActivityLogsAdmin'));
const NotificationsAdmin = React.lazy(() => import('./features/admin/pages/NotificationsAdmin'));

const SystemIndex = React.lazy(() => import('./features/system/SystemIndex'));
const HealthDiagnostics = React.lazy(() => import('./features/system/pages/HealthDiagnostics'));
const BackupsSystem = React.lazy(() => import('./features/system/pages/BackupsSystem'));
const QueueSystem = React.lazy(() => import('./features/system/pages/QueueSystem'));
const AppInfoSystem = React.lazy(() => import('./features/system/pages/AppInfoSystem'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<BookingsList />} />
            
            <Route path="payments">
              <Route index element={<PaymentsList />} />
              <Route path=":id" element={<PaymentView />} />
            </Route>

            <Route path="expenses">
              <Route index element={<ExpensesList />} />
              <Route path=":id" element={<ExpenseView />} />
            </Route>

            <Route path="reports">
              <Route index element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ReportsIndex /></React.Suspense>} />
              <Route path="cash-book" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><CashBookReport /></React.Suspense>} />
              <Route path="ledger" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><LedgerReport /></React.Suspense>} />
              <Route path="outstanding" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><OutstandingReport /></React.Suspense>} />
              <Route path="payments" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><PaymentReport /></React.Suspense>} />
              <Route path="expenses" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ExpenseReport /></React.Suspense>} />
              <Route path="bookings" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><BookingReport /></React.Suspense>} />
              <Route path="shop-summary" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ShopSummary /></React.Suspense>} />
              <Route path="monthly-collection" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><MonthlySummary /></React.Suspense>} />
              <Route path="payment-methods" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><PaymentMethodSummary /></React.Suspense>} />
              <Route path="activity-logs" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ActivityLogReport /></React.Suspense>} />
              <Route path="notifications" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><NotificationReport /></React.Suspense>} />
              <Route path="user-activity" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><UserActivityReport /></React.Suspense>} />
            </Route>

            <Route path="masters">
              <Route index element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><MastersIndex /></React.Suspense>} />
              
              <Route path="shops" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ShopsMaster /></React.Suspense>} />
              <Route path="shops/:id/edit" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ShopsMaster /></React.Suspense>} />
              
              <Route path="expense-settings" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ExpenseSettings /></React.Suspense>} />
            </Route>

            <Route path="admin">
              <Route index element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><AdminIndex /></React.Suspense>} />
              
              <Route path="users" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><UsersAdmin /></React.Suspense>} />
              <Route path="users/:id/edit" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><UsersAdmin /></React.Suspense>} />
              
              <Route path="roles" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><RolesAdmin /></React.Suspense>} />
              <Route path="settings" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><SettingsAdmin /></React.Suspense>} />
              <Route path="activity-logs" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><ActivityLogsAdmin /></React.Suspense>} />
              <Route path="notifications" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><NotificationsAdmin /></React.Suspense>} />
            </Route>

            <Route path="system">
              <Route index element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><SystemIndex /></React.Suspense>} />
              
              <Route path="health" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><HealthDiagnostics /></React.Suspense>} />
              <Route path="backups" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><BackupsSystem /></React.Suspense>} />
              <Route path="queue" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><QueueSystem /></React.Suspense>} />
              <Route path="info" element={<React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}><AppInfoSystem /></React.Suspense>} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
