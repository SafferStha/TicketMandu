import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { favoritesAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setFavorites(await favoritesAPI.getMy());
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load favorites"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const remove = async (eventId) => {
    try {
      await favoritesAPI.remove(eventId);
      toast.success("Removed from favorites");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove favorite"));
    }
  };

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader title="Favorites" subtitle="Your saved events." />
        {loading ? (
          <div className="tm-empty tm-card">
            <h3>Loading favorites…</h3>
          </div>
        ) : favorites.length === 0 ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">♡</span>
            <h3>No favorites yet</h3>
            <p>
              Save events from Discover or Event Details and they will appear
              here.
            </p>
            <Link to="/discover" className="tm-btn">
              Discover Events
            </Link>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((event) => (
              <div key={event.id} className="tm-card favorite-row">
                <div>
                  <Link to={`/events/${event.id}`} className="favorite-link">
                    {event.name}
                  </Link>
                  <p className="tm-muted">Saved event</p>
                </div>
                <button
                  onClick={() => remove(event.id)}
                  className="tm-btn-danger"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
