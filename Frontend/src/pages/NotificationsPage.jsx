import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { notificationsAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await notificationsAPI.getMy({ limit: 50 });
      setNotifications(result.notifications || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to mark notification read"));
    }
  };

  const remove = async (id) => {
    try {
      await notificationsAPI.remove(id);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete notification"));
    }
  };

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title="Notifications"
          subtitle="Order, payment, and ticket updates."
        />
        {loading ? (
          <div className="tm-empty tm-card">
            <h3>Loading notifications…</h3>
          </div>
        ) : notifications.length === 0 ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">🔔</span>
            <h3>No notifications</h3>
            <p>Booking, payment, and ticket updates will appear here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((n) => (
              <article
                key={n.id}
                className={`tm-card notification-row ${n.is_read ? "is-read" : ""}`}
              >
                <div>
                  <strong>{n.title}</strong>
                  <p className="tm-muted">{n.body}</p>
                </div>
                <div className="tm-actions">
                  {!n.is_read ? (
                    <button
                      onClick={() => markRead(n.id)}
                      className="tm-btn-secondary"
                    >
                      Read
                    </button>
                  ) : null}
                  <button
                    onClick={() => remove(n.id)}
                    className="tm-btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
