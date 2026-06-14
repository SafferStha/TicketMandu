import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, ticketsAPI } from '../api';
import toast from 'react-hot-toast';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);
const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
  </svg>
);
const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24"
    fill={filled ? '#ef4444' : 'none'}
    stroke={filled ? '#ef4444' : '#9e9e9e'}
    strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const categoryColors = {
  Music:   { bg: '#ede9fe', text: '#7c3aed' },
  Sports:  { bg: '#fff7ed', text: '#ea580c' },
  Arts:    { bg: '#fdf4ff', text: '#a21caf' },
  Comedy:  { bg: '#fefce8', text: '#ca8a04' },
  Family:  { bg: '#f0fdf4', text: '#16a34a' },
  Theater: { bg: '#fff1f2', text: '#e11d48' },
};

const TICKET_OPTIONS = [
  { id: 'ga',        label: 'General Admission',  multiplier: 1.0 },
  { id: 'premium',   label: 'Premium',            multiplier: 1.5 },
  { id: 'vip',       label: 'VIP',               multiplier: 2.5 },
  { id: 'early',     label: 'Early Bird',         multiplier: 0.8 },
];

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState('ga');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    eventsAPI.getById(id)
      .then((res) => {
        const d = res.data;
        setEvent(d.data?.event || d.event || d);
      })
      .catch(() => {
        toast.error('Event not found');
        navigate('/discover');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleBook = async () => {
    setBooking(true);
    try {
      const ticketOption = TICKET_OPTIONS.find((t) => t.id === selectedTicket);
      const seatLabel = `${ticketOption.label} · Qty ${quantity}`;
      await ticketsAPI.bookTicket(event.id, seatLabel);
      toast.success(`🎫 ${quantity} ticket${quantity > 1 ? 's' : ''} booked! Check My Tickets.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book ticket');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.skeleton}>
          <div style={{ ...styles.skeletonBlock, height: '280px', borderRadius: 0 }} />
          <div style={styles.skeletonContent}>
            {[200, 140, 100, 160].map((w, i) => (
              <div key={i} style={{ ...styles.skeletonLine, width: w }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const catStyle = categoryColors[event.category] || { bg: '#f5f5f5', text: '#616161' };
  const ticketOption = TICKET_OPTIONS.find((t) => t.id === selectedTicket);
  const pricePerTicket = (event.price * ticketOption.multiplier).toFixed(2);
  const totalPrice = (pricePerTicket * quantity).toFixed(2);

  return (
    <div style={styles.page}>
      {/* Hero Banner */}
      <div style={{ ...styles.hero, background: event.featuredBg || 'linear-gradient(135deg, #0d1b4b, #1565c0)' }}>
        <div style={styles.heroControls}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
          <button style={styles.heartBtn} onClick={() => setLiked((l) => !l)}>
            <HeartIcon filled={liked} />
          </button>
        </div>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>{event.category}</span>
          <div style={styles.heroIcon}>{event.icon}</div>
          <h1 style={styles.heroTitle}>{event.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Quick Info Row */}
        <div style={styles.infoCard}>
          <div style={styles.infoItem}>
            <CalIcon />
            <div>
              <p style={styles.infoLabel}>Date</p>
              <p style={styles.infoValue}>{event.date}</p>
            </div>
          </div>
          <div style={styles.infoDivider} />
          <div style={styles.infoItem}>
            <ClockIcon />
            <div>
              <p style={styles.infoLabel}>Time</p>
              <p style={styles.infoValue}>{event.time}</p>
            </div>
          </div>
          <div style={styles.infoDivider} />
          <div style={styles.infoItem}>
            <PinIcon />
            <div>
              <p style={styles.infoLabel}>Venue</p>
              <p style={{ ...styles.infoValue, fontSize: '12.5px' }}>{event.venue}</p>
            </div>
          </div>
        </div>

        {/* About */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>About this Event</h2>
          <p style={styles.description}>
            {event.description ||
              `Join us for an unforgettable experience at ${event.name}. This ${event.category.toLowerCase()} event promises to be one of the highlights of the year. Featuring world-class entertainment, excellent venues, and memories that will last a lifetime. Don't miss out — tickets are selling fast!`}
          </p>
        </section>

        {/* Ticket Selection */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Select Tickets</h2>
          <div style={styles.ticketOptions}>
            {TICKET_OPTIONS.map((opt) => {
              const price = (event.price * opt.multiplier).toFixed(2);
              const isSelected = selectedTicket === opt.id;
              return (
                <button
                  key={opt.id}
                  style={{ ...styles.ticketOpt, ...(isSelected ? styles.ticketOptActive : {}) }}
                  onClick={() => setSelectedTicket(opt.id)}
                >
                  <div style={styles.ticketOptTop}>
                    <span style={styles.ticketOptName}>{opt.label}</span>
                    {isSelected && <span style={styles.checkMark}>✓</span>}
                  </div>
                  <span style={{ ...styles.ticketOptPrice, color: isSelected ? '#1565c0' : '#1a1a2e' }}>
                    ${price}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quantity */}
          <div style={styles.quantityRow}>
            <span style={styles.quantityLabel}>Quantity</span>
            <div style={styles.quantityControls}>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >−</button>
              <span style={styles.qtyValue}>{quantity}</span>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              >+</button>
            </div>
          </div>
        </section>

        {/* Category Tag */}
        <span style={{ ...styles.categoryTag, background: catStyle.bg, color: catStyle.text }}>
          {event.category}
        </span>
      </div>

      {/* Sticky Checkout Bar */}
      <div style={styles.checkoutBar}>
        <div style={styles.checkoutLeft}>
          <span style={styles.checkoutTotal}>${totalPrice}</span>
          <span style={styles.checkoutMeta}>{quantity} × ${pricePerTicket} · {ticketOption.label}</span>
        </div>
        <button
          style={{ ...styles.checkoutBtn, opacity: booking ? 0.7 : 1 }}
          onClick={handleBook}
          disabled={booking}
        >
          {booking ? 'Booking…' : `Book Now`}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f6fb', paddingBottom: '90px' },
  hero: {
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px',
    position: 'relative',
  },
  heroControls: { display: 'flex', justifyContent: 'space-between' },
  backBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  heartBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', border: 'none',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  heroContent: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px 12px' },
  heroBadge: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.25)', color: '#fff',
    fontSize: '11px', fontWeight: '700', padding: '3px 10px',
    borderRadius: '9999px', backdropFilter: 'blur(4px)',
  },
  heroIcon: { fontSize: '36px' },
  heroTitle: {
    fontSize: '22px', fontWeight: '800', color: '#fff',
    lineHeight: '1.25', margin: 0, maxWidth: '320px',
  },
  content: { padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px', margin: '0 auto' },
  infoCard: {
    background: '#fff', borderRadius: '16px',
    padding: '16px 20px', display: 'flex', alignItems: 'center',
    gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    marginTop: '-24px',
  },
  infoItem: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
  infoLabel: { fontSize: '11px', color: '#9e9e9e', margin: '0 0 2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '13px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
  infoDivider: { width: '1px', height: '36px', background: '#f0f0f0', flexShrink: 0 },
  section: {},
  sectionTitle: { fontSize: '17px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 12px' },
  description: { fontSize: '14.5px', color: '#555', lineHeight: '1.7', margin: 0 },
  ticketOptions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  ticketOpt: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '14px', borderRadius: '12px', cursor: 'pointer',
    background: '#fff', border: '2px solid #e0e6ed',
    textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  ticketOptActive: { border: '2px solid #1565c0', background: '#f0f6ff' },
  ticketOptTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ticketOptName: { fontSize: '13px', fontWeight: '600', color: '#1a1a2e' },
  checkMark: { fontSize: '13px', color: '#1565c0', fontWeight: '700' },
  ticketOptPrice: { fontSize: '15px', fontWeight: '700' },
  quantityRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fff', borderRadius: '12px', padding: '14px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  quantityLabel: { fontSize: '15px', fontWeight: '600', color: '#1a1a2e' },
  quantityControls: { display: 'flex', alignItems: 'center', gap: '16px' },
  qtyBtn: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#f0f6ff', color: '#1565c0', border: '1.5px solid #c5d9f5',
    fontSize: '20px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', transition: 'background 0.15s',
  },
  qtyValue: { fontSize: '17px', fontWeight: '700', color: '#1a1a2e', minWidth: '24px', textAlign: 'center' },
  categoryTag: {
    alignSelf: 'flex-start', fontSize: '12px', fontWeight: '700',
    padding: '4px 12px', borderRadius: '9999px',
  },
  checkoutBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#fff', borderTop: '1px solid #e0e6ed',
    padding: '14px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '16px',
    boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', zIndex: 100,
  },
  checkoutLeft: { display: 'flex', flexDirection: 'column', gap: '2px' },
  checkoutTotal: { fontSize: '20px', fontWeight: '800', color: '#1a1a2e' },
  checkoutMeta: { fontSize: '12px', color: '#9e9e9e' },
  checkoutBtn: {
    flex: 1, maxWidth: '200px', padding: '14px 24px',
    background: 'linear-gradient(135deg, #0d1b4b, #1565c0)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity 0.2s',
  },
  // Skeleton
  skeleton: { minHeight: '100vh' },
  skeletonBlock: { background: 'linear-gradient(90deg, #e0e6ed 25%, #f4f6fb 50%, #e0e6ed 75%)', backgroundSize: '200% 100%' },
  skeletonContent: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  skeletonLine: { height: '16px', borderRadius: '8px', background: '#e0e6ed' },
};
