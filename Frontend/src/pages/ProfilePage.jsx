import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../api";
import toast from "react-hot-toast";

const settingsItems = [
  {
    icon: "👤",
    label: "Personal Information",
    sub: "Update your profile details",
  },
  { icon: "🔔", label: "Notifications", sub: "Manage your alert preferences" },
  {
    icon: "💳",
    label: "Payment Methods",
    sub: "Add or remove payment options",
  },
  { icon: "📍", label: "Saved Locations", sub: "Manage your favourite venues" },
  {
    icon: "🔒",
    label: "Security & Privacy",
    sub: "Password and security settings",
  },
  { icon: "⚙️", label: "App Preferences", sub: "Language, theme and more" },
  { icon: "❓", label: "Help & Support", sub: "Get help and contact support" },
];

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#c0c0c0">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const getInitials = (name) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ticketsCount: 0,
    eventsCount: 0,
    favoritesCount: 0,
  });

  useEffect(() => {
    ticketsAPI
      .getStats()
      .then((res) => setStats(res.data.data?.stats || res.data.stats || {}))
      .catch(() => {}); // silently ignore – stats are cosmetic
  }, []);

  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleSettingClick = () => {
    toast("Coming soon!", { icon: "🚧" });
  };

  return (
    <div style={styles.page}>
      {/* Profile Hero */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.avatarCircle}>{getInitials(user?.name)}</div>
          <h1 style={styles.name}>{user?.name}</h1>
          <p style={styles.email}>{user?.email}</p>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{stats.eventsCount}</span>
              <span style={styles.statLabel}>Events</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statNum}>{stats.ticketsCount}</span>
              <span style={styles.statLabel}>Tickets</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statNum}>{stats.favoritesCount}</span>
              <span style={styles.statLabel}>Favorites</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div style={styles.content}>
        <div style={styles.card}>
          <p style={styles.settingsLabel}>SETTINGS</p>
          {settingsItems.map((item, i) => (
            <button
              key={i}
              style={{
                ...styles.settingRow,
                borderBottom:
                  i < settingsItems.length - 1 ? "1px solid #f0f2f8" : "none",
              }}
              onClick={handleSettingClick}
            >
              <div style={styles.settingIcon}>{item.icon}</div>
              <div style={styles.settingText}>
                <span style={styles.settingLabel}>{item.label}</span>
                <span style={styles.settingSub}>{item.sub}</span>
              </div>
              <ChevronIcon />
            </button>
          ))}
        </div>

        <button style={styles.signOutBtn} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb" },
  hero: {
    background: "linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)",
    padding: "40px 24px 48px",
  },
  heroInner: {
    maxWidth: "600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  avatarCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#1976d2",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
    border: "3px solid rgba(255,255,255,0.35)",
    marginBottom: "4px",
  },
  name: { fontSize: "22px", fontWeight: "700", color: "#ffffff", margin: 0 },
  email: { fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 },
  statsRow: {
    display: "flex",
    alignItems: "center",
    marginTop: "16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "16px 32px",
    gap: "24px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    minWidth: "56px",
  },
  statNum: { fontSize: "22px", fontWeight: "700", color: "#ffffff" },
  statLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  statDivider: {
    width: "1px",
    height: "36px",
    background: "rgba(255,255,255,0.2)",
  },
  content: {
    maxWidth: "700px",
    margin: "-20px auto 0",
    padding: "0 24px 48px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  settingsLabel: {
    fontSize: "11.5px",
    fontWeight: "700",
    color: "#9e9e9e",
    letterSpacing: "1px",
    padding: "16px 20px 8px",
    margin: 0,
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "15px 20px",
    background: "none",
    border: "none",
    width: "100%",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  settingIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#f4f6fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  settingText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  settingLabel: { fontSize: "14.5px", fontWeight: "600", color: "#1a1a2e" },
  settingSub: { fontSize: "12px", color: "#9e9e9e" },
  signOutBtn: {
    width: "100%",
    padding: "14px",
    background: "#ffffff",
    color: "#e53935",
    border: "1.5px solid #ffcdd2",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "background 0.2s",
  },
};
