import { useState } from 'react';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#e53935' : 'none'} stroke={filled ? '#e53935' : '#9e9e9e'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
  </svg>
);

const PinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const categoryColors = {
  Music: { bg: '#e3f2fd', color: '#1565c0' },
  Sports: { bg: '#fff3e0', color: '#e65100' },
  Arts: { bg: '#f3e5f5', color: '#6a1b9a' },
  Comedy: { bg: '#fffde7', color: '#f57f17' },
  Family: { bg: '#e8f5e9', color: '#2e7d32' },
  Theater: { bg: '#fce4ec', color: '#c62828' },
};

export default function EventCard({ event }) {
  const [liked, setLiked] = useState(false);
  const catStyle = categoryColors[event.category] || { bg: '#f5f5f5', color: '#616161' };

  return (
    <div style={styles.card}>
      {/* Icon */}
      <div style={styles.iconBox}>
        <span style={styles.iconEmoji}>{event.icon}</span>
      </div>

      {/* Details */}
      <div style={styles.details}>
        <h3 style={styles.name}>{event.name}</h3>
        <div style={styles.metaRow}>
          <CalIcon />
          <span style={styles.metaText}>{event.date} • {event.time}</span>
        </div>
        <div style={styles.metaRow}>
          <PinIcon />
          <span style={{ ...styles.metaText, ...styles.venue }}>{event.venue}</span>
        </div>
        <div style={styles.bottom}>
          <span style={styles.price}>From ${event.price}</span>
          <span style={{ ...styles.chip, background: catStyle.bg, color: catStyle.color }}>
            {event.category}
          </span>
        </div>
      </div>

      {/* Heart */}
      <button style={styles.heartBtn} onClick={() => setLiked(l => !l)} aria-label="Favourite">
        <HeartIcon filled={liked} />
      </button>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    background: '#ffffff',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    border: '1px solid #edf0f7',
    transition: 'box-shadow 0.2s, transform 0.15s',
    cursor: 'pointer',
    position: 'relative',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: '26px',
  },
  details: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  name: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: '1.3',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  metaText: {
    fontSize: '12.5px',
    color: '#9e9e9e',
  },
  venue: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '260px',
  },
  bottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '2px',
  },
  price: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1565c0',
  },
  chip: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 9px',
    borderRadius: '9999px',
  },
  heartBtn: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
