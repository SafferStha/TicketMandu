import { useState } from "react";
import { ticketsAPI } from "../api";
import toast from "react-hot-toast";

export default function FeaturedEventCard({ event }) {
  const [booking, setBooking] = useState(false);

  const handleBook = async (e) => {
    e.stopPropagation();
    setBooking(true);
    try {
      await ticketsAPI.bookTicket(event.id);
      toast.success("🎫 Ticket booked! Check My Tickets.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book ticket");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        background:
          event.featuredBg || "linear-gradient(135deg,#4a0080,#7b1fa2)",
      }}
    >
      {/* Category badge */}
      <div style={styles.badge}>{event.category}</div>

      {/* Icon */}
      <div style={styles.iconWrap}>
        <span style={styles.icon}>{event.icon}</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <h3 style={styles.name}>{event.name}</h3>
        <p style={styles.date}>
          📅 {event.date} • {event.time}
        </p>
        <p style={styles.venue}>📍 {event.venue}</p>
        <div style={styles.priceRow}>
          <p style={styles.price}>From ${event.price}</p>
          <button
            style={{ ...styles.bookBtn, opacity: booking ? 0.6 : 1 }}
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? "…" : "Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "260px",
    minWidth: "260px",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  badge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "rgba(255,255,255,0.22)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "9999px",
    backdropFilter: "blur(4px)",
    letterSpacing: "0.3px",
  },
  iconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: "28px" },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  name: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    margin: 0,
    lineHeight: "1.3",
  },
  date: { fontSize: "12px", color: "rgba(255,255,255,0.8)", margin: 0 },
  venue: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
  },
  price: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffffff",
    margin: 0,
  },
  bookBtn: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 14px",
    borderRadius: "9999px",
    background: "rgba(255,255,255,0.9)",
    color: "#1a1a2e",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
};
