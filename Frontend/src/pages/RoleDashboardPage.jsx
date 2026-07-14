import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { ADMIN_NAV, ORGANIZER_NAV, CUSTOMER_NAV } from '../utils/routes';
import { resourcesAPI, getErrorMessage } from '../api';

const money = (value) => `NPR ${Number(value || 0).toLocaleString()}`;

export default function RoleDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      resourcesAPI.dashboard(user?.role)
        .then(setDashboard)
        .catch((err) => toast.error(getErrorMessage(err, 'Failed to load dashboard')))
        .finally(() => setLoading(false));
    });
  }, [user?.role]);

  const config = useMemo(() => {
    const stats = dashboard?.stats || {};
    if (user?.role === 'admin') {
      return {
        title: 'Admin Dashboard',
        subtitle: 'Platform operations, moderation, and revenue visibility.',
        nav: ADMIN_NAV,
        stats: [
          { label: 'Users', value: loading ? '…' : stats.total_users ?? 0, helper: 'Registered accounts', tone: 'blue' },
          { label: 'Events', value: loading ? '…' : stats.total_events ?? 0, helper: 'Draft and published inventory', tone: 'green' },
          { label: 'Revenue', value: loading ? '…' : money(stats.total_revenue), helper: 'Confirmed orders', tone: 'amber' },
          { label: 'Tickets', value: loading ? '…' : stats.total_tickets ?? 0, helper: 'Issued tickets', tone: 'blue' },
        ],
        quickLinks: [
          { to: '/admin/users', label: 'Manage Users' },
          { to: '/admin/events', label: 'Manage Events' },
          { to: '/admin/ticket-types', label: 'Ticket Types' },
          { to: '/admin/reports', label: 'Reports' },
        ],
      };
    }

    if (user?.role === 'organizer') {
      return {
        title: 'Organizer Dashboard',
        subtitle: 'Track your events, orders, and ticket performance.',
        nav: ORGANIZER_NAV,
        stats: [
          { label: 'My Events', value: loading ? '…' : stats.my_events ?? 0, helper: 'Organizer-owned events', tone: 'blue' },
          { label: 'Tickets Sold', value: loading ? '…' : stats.tickets_sold ?? 0, helper: 'Issued for your events', tone: 'green' },
          { label: 'Revenue', value: loading ? '…' : money(stats.revenue), helper: 'Confirmed order value', tone: 'amber' },
          { label: 'Check-ins', value: loading ? '…' : stats.check_ins ?? 0, helper: 'Used tickets', tone: 'blue' },
        ],
        quickLinks: [
          { to: '/organizer/events', label: 'My Events' },
          { to: '/organizer/orders', label: 'Orders' },
          { to: '/organizer/tickets', label: 'Verify Tickets' },
        ],
      };
    }

    return {
      title: 'Discover Events',
      subtitle: 'Browse and book public events with your customer account.',
      nav: CUSTOMER_NAV,
      stats: [
        { label: 'Tickets', value: loading ? '…' : stats.my_tickets ?? 0, helper: 'Your QR tickets', tone: 'blue' },
        { label: 'Favorites', value: loading ? '…' : stats.favorites ?? 0, helper: 'Saved events', tone: 'green' },
        { label: 'Orders', value: loading ? '…' : stats.my_orders ?? 0, helper: 'Checkout history', tone: 'amber' },
        { label: 'Unread', value: loading ? '…' : stats.unread_notifications ?? 0, helper: 'Notifications', tone: 'blue' },
      ],
      quickLinks: [
        { to: '/discover', label: 'Discover' },
        { to: '/orders', label: 'My Orders' },
        { to: '/tickets', label: 'My Tickets' },
      ],
    };
  }, [user, dashboard, loading]);

  return (
    <SidebarLayout title={config.title} navItems={config.nav}>
      <PageHeader title={config.title} subtitle={config.subtitle} />
      <div style={styles.grid}>
        {config.stats.map((item) => <StatCard key={item.label} {...item} />)}
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Links</h2>
        <div style={styles.links}>{config.quickLinks.map((item) => <Link key={item.to} to={item.to} style={styles.link}>{item.label}</Link>)}</div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        {dashboard?.recentOrders?.length ? (
          <div style={styles.activityList}>{dashboard.recentOrders.map((order) => <div key={order.id} style={styles.activityRow}><strong>{order.order_number}</strong><span>{order.status}</span><span>{money(order.total_amount)}</span></div>)}</div>
        ) : dashboard?.topEvents?.length ? (
          <div style={styles.activityList}>{dashboard.topEvents.map((event) => <div key={event.id} style={styles.activityRow}><strong>{event.name}</strong><span>{event.tickets_sold} tickets</span><span>{money(event.revenue)}</span></div>)}</div>
        ) : (
          <p style={styles.helper}>No activity yet. Current route: {location.pathname}</p>
        )}
      </section>
    </SidebarLayout>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  section: { background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0', marginBottom: '16px' },
  sectionTitle: { margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' },
  links: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' },
  link: { display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: '9999px', background: '#0d1b4b', color: '#fff', textDecoration: 'none', fontWeight: 700 },
  helper: { color: '#64748b', marginTop: '10px' },
  activityList: { display: 'grid', gap: '10px', marginTop: '14px' },
  activityRow: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#334155' },
};
