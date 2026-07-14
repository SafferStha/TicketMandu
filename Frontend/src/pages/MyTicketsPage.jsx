import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ticketsAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";

const tabs = ["active", "used", "cancelled", "refunded", "expired"];

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
      ticketsAPI
        .getMyTickets({ limit: 100 })
        .then(({ tickets }) => setTickets(tickets || []))
        .catch((err) => {
          setTickets([]);
          setError(getErrorMessage(err, "Failed to load tickets"));
        })
        .finally(() => setLoading(false));
    });
  }, []);

  const filtered = tickets.filter(
    (ticket) => String(ticket.status || "").toLowerCase() === activeTab,
  );

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title="My Tickets"
          subtitle="Access your digital tickets, QR values, status, and event details."
        />
        <div
          className="tm-card flow-card"
          style={{ marginBottom: 18, overflowX: "auto" }}
        >
          <div
            className="tm-actions"
            style={{ flexWrap: "nowrap", minWidth: 560 }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tm-btn" : "tm-btn-secondary"}
                onClick={() => setActiveTab(tab)}
              >
                {tab}{" "}
                <span>
                  (
                  {
                    tickets.filter(
                      (t) => String(t.status || "").toLowerCase() === tab,
                    ).length
                  }
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">⏳</span>
            <h3>Loading tickets…</h3>
          </div>
        ) : error ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">⚠️</span>
            <p className="tm-error">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="ticket-grid">
            {filtered.map((ticket) => (
              <article
                key={ticket.id}
                className="tm-card order-card"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="order-card-head">
                  <div>
                    <span className="tm-muted">Ticket</span>
                    <h3 style={{ margin: "4px 0" }}>{ticket.ticketNumber}</h3>
                    <p className="tm-muted" style={{ margin: 0 }}>
                      {ticket.event?.name || ticket.eventName || "Event"}
                    </p>
                  </div>
                  <span className={`tm-badge ${ticket.status}`}>
                    {ticket.status}
                  </span>
                </div>
                <div
                  className="order-meta-grid"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div className="order-meta-cell">
                    <span className="tm-muted">Date</span>
                    <strong>{ticket.event?.date || "TBA"}</strong>
                  </div>
                  <div className="order-meta-cell">
                    <span className="tm-muted">Type</span>
                    <strong>{ticket.ticketTypeName || "General"}</strong>
                  </div>
                </div>
                <Link
                  className="tm-btn-secondary"
                  to={`/tickets/${ticket.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Ticket
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">🎫</span>
            <h3>No {activeTab} tickets</h3>
            <p>
              Completed payments generate tickets automatically. Book an event
              to see tickets here.
            </p>
            <Link to="/discover" className="tm-btn">
              Discover Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
