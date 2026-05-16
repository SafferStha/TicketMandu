const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);
const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-2-3.46V6h16v2.54z"/>
  </svg>
);

export default function TicketCard({ ticket }) {
  const isUpcoming = ticket.status === 'upcoming';
  const { event } = ticket;

  return (
    <div style={{ ...styles.card, background: isUpcoming ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' : '#2a2d3e' }}>
      {/* Top Row */}
      <div style={styles.topRow}>
        <div style={styles.iconBox}>
          <span style={styles.iconEmoji}>{event.icon}</span>
        </div>
        <div style={styles.info}>
          <div style={styles.nameRow}>
            <h3 style={styles.name}>{event.name}</h3>
            <span style={{ ...styles.statusBadge, background: isUpcoming ? '#00c853' : '#757575' }}>
              {isUpcoming ? 'UPCOMING' : 'PAST'}
            </span>
          </div>
          <div style={styles.metaRow}>
            <CalIcon />
            <span style={styles.metaText}>{event.date} • {event.time}</span>
          </div>
          <div style={styles.metaRow}>
            <PinIcon />
            <span style={styles.metaText}>{event.venue}</span>
          </div>
        </div>
      </div>

      {/* Dashed divider */}
      <div style={styles.divider} />

      {/* Bottom Row */}
      <div style={styles.bottomRow}>
        {isUpcoming ? (
          <button style={styles.viewBtn}>
            <TicketIcon />
            <span>View Ticket</span>
          </button>
        ) : (
          <button style={styles.buyAgainBtn}>Buy Again</button>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  topRow: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: '26px',
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.3',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '9999px',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'rgba(255,255,255,0.75)',
  },
  metaText: {
    fontSize: '12.5px',
    color: 'rgba(255,255,255,0.75)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  divider: {
    borderTop: '1px dashed rgba(255,255,255,0.25)',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    color: '#1565c0',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 32px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  buyAgainBtn: {
    background: 'transparent',
    color: '#ffffff',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '10px',
    padding: '10px 32px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.2s',
  },
};
