import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { favoritesAPI, getErrorMessage } from '../api';
import PageHeader from '../components/PageHeader';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setFavorites(await favoritesAPI.getMy());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load favorites'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Promise.resolve().then(load); }, []);

  const remove = async (eventId) => {
    try {
      await favoritesAPI.remove(eventId);
      toast.success('Removed from favorites');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove favorite'));
    }
  };

  return (
    <div style={styles.page}>
      <PageHeader title="Favorites" subtitle="Your saved events." />
      {loading ? <p>Loading…</p> : favorites.length === 0 ? <div style={styles.empty}><h3>No favorites yet</h3></div> : <div style={styles.list}>{favorites.map((event) => <div key={event.id} style={styles.card}><Link to={`/events/${event.id}`} style={styles.link}>{event.name}</Link><button onClick={() => remove(event.id)} style={styles.remove}>Remove</button></div>)}</div>}
    </div>
  );
}

const styles = { page: { padding: '24px', maxWidth: '1100px', margin: '0 auto' }, empty: { background: '#fff', padding: '24px', borderRadius: '18px' }, list: { display: 'grid', gap: '12px' }, card: { background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '16px' }, link: { color: '#0d1b4b', fontWeight: 800, textDecoration: 'none' }, remove: { border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', borderRadius: '9999px', padding: '8px 12px', cursor: 'pointer' } };
