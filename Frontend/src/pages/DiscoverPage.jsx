import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventCard from "../component/EventCard";
import CategoryChips from "../component/CategoryChips";
import { eventsAPI } from "../api";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#9e9e9e">
    <path d="M13 3a9 9 0 1 0 0 18A9 9 0 0 0 13 3zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm.5-11H12v6l5.25 3.15.75-1.23-4.5-2.67V8z" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#c0c0c0">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const popCategories = [
  { id: "music", name: "Music", icon: "🎵" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "arts", name: "Arts", icon: "🎨" },
  { id: "comedy", name: "Comedy", icon: "😂" },
  { id: "family", name: "Family", icon: "👨‍👩‍👧" },
  { id: "theater", name: "Theater", icon: "🎭" },
];

const allCats = [{ id: "all", name: "All", icon: "✨" }, ...popCategories];

// ─── localStorage helpers for recent searches ─────────────────────────────────
const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem("recentSearches") || "[]");
  } catch {
    return [];
  }
};
const saveRecentSearch = (term) => {
  const existing = getRecentSearches();
  const updated = [term, ...existing.filter((s) => s !== term)].slice(0, 5);
  localStorage.setItem("recentSearches", JSON.stringify(updated));
};

export default function DiscoverPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(!!initialQ);
  const [selectedCat, setSelectedCat] = useState("all");
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  // Load all events once
  useEffect(() => {
    eventsAPI
      .getAll()
      .then((res) => setAllEvents(res.data.events))
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const results = allEvents.filter((e) => {
    const matchQ =
      !submitted || !query
        ? true
        : e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.category.toLowerCase().includes(query.toLowerCase()) ||
          e.venue.toLowerCase().includes(query.toLowerCase());
    const matchCat =
      selectedCat === "all" || e.category.toLowerCase() === selectedCat;
    return matchQ && matchCat;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    setSubmitted(true);
  };

  const clearSearch = () => {
    setQuery("");
    setSubmitted(false);
    setSelectedCat("all");
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    setSubmitted(true);
  };

  const handleCategoryClick = (catId) => {
    setSelectedCat(catId);
    setSubmitted(true);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>Discover Events</h1>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <div style={styles.searchBox}>
              <SearchIcon />
              <input
                style={styles.searchInput}
                placeholder="Search events, artists, venues..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={styles.clearBtn}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {!submitted ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Searches</h2>
                <div style={styles.recentList}>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      style={styles.recentItem}
                      onClick={() => handleRecentClick(term)}
                    >
                      <ClockIcon />
                      <span style={styles.recentText}>{term}</span>
                      <ArrowIcon />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Categories */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Popular Categories</h2>
              <div style={styles.catGrid}>
                {popCategories.map((cat) => (
                  <button
                    key={cat.id}
                    style={styles.catCard}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span style={styles.catIcon}>{cat.icon}</span>
                    <span style={styles.catName}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Filter chips */}
            <div style={styles.filterRow}>
              <CategoryChips
                categories={allCats}
                selected={selectedCat}
                onSelect={setSelectedCat}
              />
            </div>

            {/* Results */}
            <section style={styles.section}>
              <p style={styles.resultCount}>
                {loading
                  ? "Loading…"
                  : `${results.length} result${results.length !== 1 ? "s" : ""}${query ? ` for "${query}"` : ""}`}
              </p>
              <div style={styles.eventList}>
                {loading ? null : results.length > 0 ? (
                  results.map((e) => <EventCard key={e.id} event={e} />)
                ) : (
                  <div style={styles.noResults}>
                    <span style={styles.noResultsIcon}>🔍</span>
                    <p style={styles.noResultsText}>No events found</p>
                    <p style={styles.noResultsSub}>
                      Try different keywords or categories
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb" },
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e0e6ed",
    padding: "24px 0 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  headerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: { fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  searchForm: { width: "100%" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f4f6fb",
    borderRadius: "12px",
    padding: "12px 16px",
    border: "1.5px solid #e0e6ed",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14.5px",
    color: "#1a1a2e",
    background: "transparent",
    fontFamily: "inherit",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 24px 48px",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  section: {},
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a2e",
    margin: "0 0 14px",
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  recentText: { flex: 1, fontSize: "14.5px", color: "#1a1a2e" },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  catCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "20px 12px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "transform 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  },
  catIcon: { fontSize: "28px" },
  catName: { fontSize: "13px", fontWeight: "600", color: "#1a1a2e" },
  filterRow: { overflowX: "auto", paddingBottom: "4px" },
  resultCount: {
    fontSize: "13.5px",
    color: "#757575",
    margin: "0 0 16px",
    fontStyle: "italic",
  },
  eventList: { display: "flex", flexDirection: "column", gap: "12px" },
  noResults: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 0",
    gap: "8px",
  },
  noResultsIcon: { fontSize: "40px" },
  noResultsText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
    margin: 0,
  },
  noResultsSub: { fontSize: "13.5px", color: "#9e9e9e", margin: 0 },
};
