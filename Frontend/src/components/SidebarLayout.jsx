import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRoute } from '../utils/routes';

export default function SidebarLayout({ title, navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand} onClick={() => navigate(getHomeRoute(user?.role))}>
          <span style={styles.brandIcon}>🎫</span>
          <div>
            <div style={styles.brandName}>TicketMandu</div>
            <div style={styles.brandSub}>{title}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    background: '#f4f6fb',
  },
  sidebar: {
    padding: '24px',
    background: 'linear-gradient(180deg, #0d1b4b 0%, #10265c 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  brand: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    cursor: 'pointer',
  },
  brandIcon: { fontSize: '28px' },
  brandName: { fontSize: '18px', fontWeight: 800 },
  brandSub: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  link: {
    padding: '12px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.78)',
    background: 'rgba(255,255,255,0.04)',
  },
  linkActive: { color: '#fff', background: 'rgba(255,255,255,0.14)' },
  logoutBtn: {
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: '12px',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  main: { padding: '28px', overflow: 'auto' },
};
