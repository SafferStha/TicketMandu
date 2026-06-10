import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeaturedEventCard from '../component/FeaturedEventCard';
import EventCard from '../component/EventCard';
import CategoryChips from '../component/CategoryChips';
import { events, categories, user } from '../data/mockData';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🔥';
}

const homeCategories = categories.slice(0, 4); // All, Music, Sports, Arts

export default function HomePage() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const featuredEvents = events.filter(e => e.featured);
  const trendingEvents = events.filter(e => !e.featured);
  const allCategories = [{ id: 'all', name: 'All', icon: '✨' }, { id: 'music', name: 'Music', icon: '🎵' }, { id: 'sports', name: 'Sports', icon: '⚽' }, { id: 'arts', name: 'Arts', icon: '🎨' }];

  const filteredTrending = selectedCat === 'all'
    ? trendingEvents
    : trendingEvents.filter(e => e.category.toLowerCase() === selectedCat);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate('/discover?q=' + encodeURIComponent(searchQuery.trim()));
  };

  return (
    <div style={styles.page}>
      {/* Hero Header */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroTop}>
            <div>
              <p style={styles.greeting}>{getGreeting()}</p>
              <h1 style={styles.heroTitle}>{user.name}</h1>
            </div>
          </div>
          {/* Search */}
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <div style={styles.searchBox}>
              <SearchIcon />
              <input
                style={styles.searchInput}
                placeholder="Search events, artists, venues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Featured Events */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🔥 Featured Events</h2>
            <button style={styles.seeAll} onClick={() => navigate('/discover')}>See All</button>
          </div>
          <div style={styles.featuredScroll}>
            {featuredEvents.map(event => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* Browse Categories */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Browse Categories</h2>
          <div style={{ marginTop: '14px' }}>
            <CategoryChips categories={allCategories} selected={selectedCat} onSelect={setSelectedCat} />
          </div>
        </section>

        {/* Trending Events */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Trending Events</h2>
            <button style={styles.seeAll} onClick={() => navigate('/discover')}>See All</button>
          </div>
          <div style={styles.eventList}>
            {filteredTrending.length > 0
              ? filteredTrending.map(event => <EventCard key={event.id} event={event} />)
              : <p style={styles.empty}>No events in this category.</p>
            }
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6fb',
  },
  hero: {
    background: 'linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)',
    padding: '32px 0 40px',
  },
  heroInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 4px',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  searchForm: {
    width: '100%',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14.5px',
    color: '#1a1a2e',
    background: 'transparent',
    fontFamily: 'inherit',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 24px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {},
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },
  seeAll: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1565c0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
  },
  featuredScroll: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  empty: {
    color: '#9e9e9e',
    textAlign: 'center',
    padding: '24px',
  },
};
