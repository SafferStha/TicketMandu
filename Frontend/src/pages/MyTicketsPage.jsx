import { useState } from 'react';
import TicketCard from '../component/TicketCard';
import { tickets } from '../data/mockData';

export default function MyTicketsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const filtered = tickets.filter(t => t.status === activeTab);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>My Tickets</h1>
          {/* Tabs */}
          <div style={styles.tabs}>
            {['upcoming', 'past'].map(tab => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  color: activeTab === tab ? '#1565c0' : '#9e9e9e',
                  borderBottom: activeTab === tab ? '2px solid #1565c0' : '2px solid transparent',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div style={styles.content}>
        {filtered.length > 0 ? (
          <div style={styles.ticketList}>
            {filtered.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>🎫</span>
            <p style={styles.emptyTitle}>No {activeTab} tickets</p>
            <p style={styles.emptySub}>
              {activeTab === 'upcoming'
                ? 'Book an event to see your upcoming tickets here.'
                : 'Your past tickets will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6fb',
  },
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e0e6ed',
    padding: '24px 0 0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 16px',
  },
  tabs: {
    display: 'flex',
    gap: '0',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '12px 28px',
    fontSize: '14.5px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color 0.2s, border-color 0.2s',
    letterSpacing: '0.2px',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '28px 24px 48px',
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '72px 0',
    gap: '10px',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
    textTransform: 'capitalize',
  },
  emptySub: {
    fontSize: '14px',
    color: '#9e9e9e',
    margin: 0,
    textAlign: 'center',
    maxWidth: '300px',
  },
};
