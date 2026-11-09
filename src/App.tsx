import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Toasts } from './components/ui';
import { useRoute } from './lib/router';
import { runOverdueCheck, unreadNotificationCount, useAppState } from './lib/store';
import { DashboardPage } from './pages/Dashboard';
import { CustomersPage } from './pages/Customers';
import { CustomerDetailPage } from './pages/CustomerDetail';
import { DealsPage } from './pages/Deals';
import { DealDetailPage } from './pages/DealDetail';
import { PipelinePage } from './pages/Pipeline';
import { TasksPage } from './pages/Tasks';
import { ReportsPage } from './pages/Reports';
import { TeamPage } from './pages/Team';
import { RepDetailPage } from './pages/RepDetail';
import { NotificationsPage } from './pages/Notifications';

export default function App() {
  const { segments } = useRoute();
  const s = useAppState();

  // Overdue-task notifications: refresh on load and whenever tasks change
  useEffect(() => {
    runOverdueCheck();
  }, [s.tasks]);

  useEffect(() => {
    const interval = window.setInterval(runOverdueCheck, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  function renderPage() {
    const [root, id] = segments;
    if (root === undefined) return <DashboardPage />;
    switch (root) {
      case 'customers':
        return id ? <CustomerDetailPage customerId={id} /> : <CustomersPage />;
      case 'deals':
        return id ? <DealDetailPage dealId={id} /> : <DealsPage />;
      case 'pipeline':
        return <PipelinePage />;
      case 'tasks':
        return <TasksPage />;
      case 'reports':
        return <ReportsPage />;
      case 'team':
        return id ? <RepDetailPage repId={id} /> : <TeamPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return (
          <div className="load-fail">
            <h2>Page not found</h2>
            <p style={{ marginTop: 8 }}>The page “/{segments.join('/')}” doesn’t exist.</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => (window.location.hash = '/')}>
              ← Back to dashboard
            </button>
          </div>
        );
    }
  }

  return (
    <>
      <Layout unread={unreadNotificationCount(s)}>{renderPage()}</Layout>
      <Toasts />
    </>
  );
}
