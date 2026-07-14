import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationsAPI, getErrorMessage } from '../api';
import PageHeader from '../components/PageHeader';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await notificationsAPI.getMy({ limit: 50 });
      setNotifications(result.notifications || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Promise.resolve().then(load); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    load();
  };

  const remove = async (id) => {
    await notificationsAPI.remove(id);
    load();
  };

  return (
    <div style={styles.page}>
      <PageHeader title="Notifications" subtitle="Order, payment, and ticket updates." />
      {loading ? <p>Loading…</p> : <div style={styles.list}>{notifications.map((n) => <div key={n.id} style={{ ...styles.card, opacity: n.is_read ? 0.7 : 1 }}><div><strong>{n.title}</strong><div style={styles.body}>{n.body}</div></div><div style={styles.actions}><button onClick={() => markRead(n.id)} style={styles.btn}>Read</button><button onClick={() => remove(n.id)} style={styles.danger}>Delete</button></div></div>)}</div>}
    </div>
  );
}

const styles = { page: { padding: '24px', maxWidth: '1100px', margin: '0 auto' }, list: { display: 'grid', gap: '12px' }, card: { background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '16px' }, body: { marginTop: '6px', color: '#475569' }, actions: { display: 'flex', gap: '8px', alignItems: 'center' }, btn: { padding: '8px 12px', borderRadius: '9999px', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer' }, danger: { padding: '8px 12px', borderRadius: '9999px', border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', cursor: 'pointer' } };
