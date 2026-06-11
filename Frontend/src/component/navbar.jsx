import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);
const TicketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-2-3.46V6h16v2.54z" />
  </svg>
);
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const navLinks = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/discover", label: "Discover", Icon: SearchIcon },
  { to: "/tickets", label: "My Tickets", Icon: TicketIcon },
  { to: "/profile", label: "Profile", Icon: ProfileIcon },
];

const getInitials = (name) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Logo */}
        <NavLink to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🎫</span>
          <span style={styles.logoText}>TicketMandu</span>
        </NavLink>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {navLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <Icon />
              <span style={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right side: avatar + sign-out */}
        <div style={styles.rightSide}>
          <div
            style={styles.avatar}
            title={user?.name}
            onClick={() => navigate("/profile")}
          >
            {getInitials(user?.name)}
          </div>
          <button
            style={styles.signOutBtn}
            onClick={handleSignOut}
            title="Sign out"
          >
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    background: "linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
    textDecoration: "none",
  },
  logoIcon: { fontSize: "22px" },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flex: 1,
    justifyContent: "center",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s, background 0.2s",
    textDecoration: "none",
  },
  navLinkActive: {
    color: "#ffffff",
    background: "rgba(255,255,255,0.12)",
  },
  navLabel: { whiteSpace: "nowrap" },
  rightSide: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#1976d2",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    border: "2px solid rgba(255,255,255,0.3)",
    flexShrink: 0,
    userSelect: "none",
  },
  signOutBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.75)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    transition: "background 0.2s",
    title: "Sign out",
  },
};
