import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getInitials } from "../utils/format.util";

const HomeIcon = () => <span aria-hidden="true">⌂</span>;
const SearchIcon = () => <span aria-hidden="true">⌕</span>;
const TicketIcon = () => <span aria-hidden="true">🎫</span>;
const HeartIcon = () => <span aria-hidden="true">♡</span>;
const BellIcon = () => <span aria-hidden="true">🔔</span>;
const ProfileIcon = () => <span aria-hidden="true">👤</span>;

const navLinks = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/discover", label: "Discover", Icon: SearchIcon },
  { to: "/orders", label: "Orders", Icon: TicketIcon },
  { to: "/tickets", label: "My Tickets", Icon: TicketIcon },
  { to: "/favorites", label: "Favorites", Icon: HeartIcon },
  { to: "/notifications", label: "Notifications", Icon: BellIcon },
  { to: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function Navbar() {
  const { user } = useAuth();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const cycleTheme = async () => {
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    await setTheme(next);
  };

  const themeLabel = theme === "system" ? `System (${effectiveTheme})` : theme;

  return (
    <header className="tm-navbar">
      <div className="tm-navbar-inner">
        <NavLink
          to="/"
          className="tm-logo"
          onClick={closeMenu}
          aria-label="TicketMandu home"
        >
          <span className="tm-logo-icon">🎫</span>
          <span className="tm-logo-text">TicketMandu</span>
        </NavLink>

        <nav
          id="customer-navigation"
          className={`tm-nav-links ${open ? "is-open" : ""}`}
          aria-label="Customer navigation"
        >
          {navLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `tm-nav-link${isActive ? " active" : ""}`
              }
              onClick={closeMenu}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tm-nav-right">
          <button
            type="button"
            className="tm-avatar"
            title={user?.name || "Profile"}
            onClick={() => {
              closeMenu();
              navigate("/profile");
            }}
          >
            {getInitials(user?.name)}
          </button>
          <button
            type="button"
            className="tm-icon-btn"
            onClick={cycleTheme}
            title={`Theme: ${themeLabel}`}
            aria-label={`Theme: ${themeLabel}`}
          >
            {theme === "system" ? "◐" : theme === "dark" ? "☾" : "☀"}
          </button>
          <button
            type="button"
            className="tm-icon-btn tm-menu-toggle"
            aria-expanded={open}
            aria-controls="customer-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
