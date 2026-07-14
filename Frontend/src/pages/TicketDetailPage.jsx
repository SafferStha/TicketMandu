import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ticketsAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    ticketsAPI
      .getById(id)
      .then(setTicket)
      .catch((err) => setError(getErrorMessage(err, "Failed to load ticket")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <h3>Loading ticket…</h3>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <p className="tm-error">{error}</p>
        </div>
      </div>
    );
  if (!ticket) return null;

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title="Digital Ticket"
          subtitle={ticket.ticketNumber}
          actions={
            <Link to="/tickets" className="tm-btn-secondary">
              Back
            </Link>
          }
        />
        <article className="tm-card digital-ticket">
          <div className="digital-ticket-top">
            <span className={`tm-badge ${ticket.status}`}>{ticket.status}</span>
            <h2>{ticket.event?.name || "TicketMandu Event"}</h2>
            <p style={{ margin: 0 }}>
              {ticket.event?.date || "Date TBA"} ·{" "}
              {ticket.event?.time || "Time TBA"} ·{" "}
              {ticket.event?.venue || "Venue TBA"}
            </p>
          </div>
          <div className="digital-ticket-body">
            <div className="flow-list">
              <div className="flow-row">
                <span>Ticket Number</span>
                <strong>{ticket.ticketNumber}</strong>
              </div>
              <div className="flow-row">
                <span>Ticket Type</span>
                <strong>{ticket.ticketTypeName || "General Admission"}</strong>
              </div>
              <div className="flow-row">
                <span>Seat</span>
                <strong>{ticket.seat || "General Admission"}</strong>
              </div>
              <div className="flow-row">
                <span>Order</span>
                <strong>{ticket.orderNumber || "—"}</strong>
              </div>
              <div className="flow-row">
                <span>Status</span>
                <strong>{ticket.status}</strong>
              </div>
              {ticket.checkedInAt ? (
                <div className="flow-row">
                  <span>Checked in</span>
                  <strong>{ticket.checkedInAt}</strong>
                </div>
              ) : null}
            </div>
            <div>
              <div className="qr-box">
                {ticket.qrCodeValue || ticket.ticketNumber}
              </div>
              <p
                className="tm-muted"
                style={{ textAlign: "center", marginTop: 10 }}
              >
                Show this QR value at entry. Used, cancelled, refunded, or
                expired tickets are not valid for entry.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
