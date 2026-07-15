import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { getHomeRoute } from "../utils/routes";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const session = await login(email, password);
      toast.success("Welcome back!");
      navigate(getHomeRoute(session?.user?.role));
    } catch (err) {
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🎫</span>
          <span style={styles.logoText}>TicketMandu</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "26px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0d1b4b",
    letterSpacing: "-0.3px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a2e",
    margin: "4px 0 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#9e9e9e",
    margin: "0 0 16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "8px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e0e6ed",
    background: "#ffffff",
    fontSize: "14.5px",
    color: "#1a1a2e",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  btn: {
    padding: "14px",
    background: "linear-gradient(135deg, #0d1b4b 0%, #1565c0 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "4px",
    transition: "opacity 0.2s",
  },
  switchText: {
    fontSize: "13.5px",
    color: "#9e9e9e",
    textAlign: "center",
    marginTop: "8px",
  },
  link: {
    color: "#1565c0",
    fontWeight: "600",
    textDecoration: "none",
  },
};
