import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI, usersAPI, getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmModal from "../components/ConfirmModal";
import { formatPrice } from "../utils/format.util";

const tabs = [
  ["overview", "Overview"],
  ["profile", "Edit Profile"],
  ["security", "Security"],
  ["locations", "Saved Locations"],
  ["payments", "Payment Methods"],
  ["preferences", "Notifications & App"],
];

const emptyLocation = {
  label: "",
  city: "",
  area: "",
  address: "",
  is_default: false,
};
const emptyPayment = {
  method_type: "mock",
  provider: "",
  label: "",
  last4: "",
  is_default: false,
};
const methodLabels = {
  mock: "Mock Payment",
  cod: "Cash on Delivery",
  esewa_placeholder: "eSewa placeholder",
  khalti_placeholder: "Khalti placeholder",
};

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
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [locations, setLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const [statsData, prefData, locData, methodData] = await Promise.all([
        usersAPI.getStats(),
        usersAPI.getPreferences(),
        usersAPI.getLocations(),
        usersAPI.getPaymentMethods(),
      ]);
      setStats(statsData);
      setPreferences(prefData);
      setLocations(locData);
      setPaymentMethods(methodData);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load account settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const joinedDate = useMemo(() => user?.created_at || user?.createdAt, [user]);

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authAPI.updateProfile(profileForm);
      updateUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return toast.error("New passwords do not match");
    setSaving(true);
    try {
      await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed securely");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async (patch) => {
    const previous = preferences;
    const next = { ...preferences, ...patch };
    setPreferences(next);
    try {
      const updated = await usersAPI.updatePreferences(patch);
      setPreferences(updated);
      if (patch.theme) await setTheme(patch.theme, { persist: false });
      if (next.in_app_toasts) toast.success("Preference saved");
    } catch (err) {
      setPreferences(previous);
      toast.error(getErrorMessage(err, "Failed to save preference"));
    }
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLocationId)
        await usersAPI.updateLocation(editingLocationId, locationForm);
      else await usersAPI.createLocation(locationForm);
      setLocationForm(emptyLocation);
      setEditingLocationId(null);
      await loadAccount();
      toast.success("Location saved");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save location"));
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = (id) => {
    setConfirmAction({
      title: "Delete saved location?",
      message: "This location will be removed from your account.",
      confirmLabel: "Delete location",
      action: async () => {
        await usersAPI.deleteLocation(id);
        await loadAccount();
        toast.success("Location deleted");
      },
    });
  };

  const savePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...paymentForm,
        label: paymentForm.label || methodLabels[paymentForm.method_type],
      };
      if (editingPaymentId)
        await usersAPI.updatePaymentMethod(editingPaymentId, payload);
      else await usersAPI.createPaymentMethod(payload);
      setPaymentForm(emptyPayment);
      setEditingPaymentId(null);
      await loadAccount();
      toast.success("Payment method saved");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save payment method"));
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = (id) => {
    setConfirmAction({
      title: "Delete payment method?",
      message:
        "This safe demo payment method will be removed from your profile.",
      confirmLabel: "Delete method",
      action: async () => {
        await usersAPI.deletePaymentMethod(id);
        await loadAccount();
        toast.success("Payment method deleted");
      },
    });
  };

  const statCards = [
    ["Total orders", stats?.totalOrders],
    ["Total tickets", stats?.totalTickets],
    ["Upcoming tickets", stats?.upcomingTickets],
    ["Used/completed", stats?.usedCompletedTickets],
    ["Favorite events", stats?.favoriteEvents],
    ["Reviews written", stats?.reviewsWritten],
    ["Unread notifications", stats?.unreadNotifications],
    ["Total spent", formatPrice(stats?.totalAmountSpent || 0, "NPR")],
    ["Pending orders", stats?.pendingOrders],
    ["Cancelled orders", stats?.cancelledOrders],
  ];

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">
          {user?.image ? (
            <img src={`/uploads/${user.image}`} alt="Profile" />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        <div>
          <h1>{user?.name}</h1>
          <p>
            @{user?.username || "set-a-username"} · {user?.email}
          </p>
          <span className="tm-badge published">{user?.role}</span>
          <span className="tm-badge confirmed">
            {user?.is_active === false ? "inactive" : "active"}
          </span>
        </div>
      </section>

      <div className="profile-shell">
        <nav className="profile-tabs" aria-label="Profile sections">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={active === key ? "active" : ""}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ))}
          <button className="danger" onClick={handleSignOut}>
            Sign out
          </button>
        </nav>

        <section className="profile-panel tm-card">
          {loading ? (
            <div className="tm-empty">
              <h3>Loading account…</h3>
            </div>
          ) : null}

          {!loading && active === "overview" && (
            <>
              <h2>Account overview</h2>
              <div className="profile-grid two">
                <Info label="Full name" value={user?.name} />
                <Info label="Username" value={user?.username || "Not set"} />
                <Info label="Email" value={user?.email} />
                <Info label="Phone" value={user?.phone || "Not set"} />
                <Info label="Role" value={user?.role} />
                <Info
                  label="Joined"
                  value={
                    joinedDate
                      ? new Date(joinedDate).toLocaleDateString()
                      : "Unknown"
                  }
                />
              </div>
              <h2 style={{ marginTop: 28 }}>Statistics</h2>
              <div className="profile-grid stats">
                {statCards.map(([label, value]) => (
                  <Info key={label} label={label} value={value ?? 0} />
                ))}
              </div>
            </>
          )}

          {!loading && active === "profile" && (
            <form className="profile-form" onSubmit={saveProfile}>
              <h2>Edit profile</h2>
              <Field
                label="Full name"
                value={profileForm.name}
                onChange={(v) => setProfileForm({ ...profileForm, name: v })}
                required
              />
              <Field
                label="Username"
                value={profileForm.username}
                onChange={(v) =>
                  setProfileForm({ ...profileForm, username: v })
                }
                placeholder="letters, numbers, underscores"
              />
              <Field
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(v) => setProfileForm({ ...profileForm, email: v })}
                required
              />
              <Field
                label="Phone"
                value={profileForm.phone}
                onChange={(v) => setProfileForm({ ...profileForm, phone: v })}
              />
              <button className="tm-btn" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </button>
            </form>
          )}

          {!loading && active === "security" && (
            <form className="profile-form" onSubmit={changePassword}>
              <h2>Security</h2>
              <p className="tm-muted">
                Password changes require your current password. You will remain
                signed in.
              </p>
              <Field
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(v) =>
                  setPasswordForm({ ...passwordForm, currentPassword: v })
                }
                required
              />
              <Field
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(v) =>
                  setPasswordForm({ ...passwordForm, newPassword: v })
                }
                required
              />
              <Field
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(v) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: v })
                }
                required
              />
              <button className="tm-btn" disabled={saving}>
                {saving ? "Updating…" : "Change password"}
              </button>
            </form>
          )}

          {!loading && active === "locations" && (
            <CrudSection
              title="Saved locations"
              empty="No saved locations yet."
            >
              <form className="profile-form compact" onSubmit={saveLocation}>
                <Field
                  label="Label"
                  value={locationForm.label}
                  onChange={(v) =>
                    setLocationForm({ ...locationForm, label: v })
                  }
                  required
                />
                <Field
                  label="City"
                  value={locationForm.city}
                  onChange={(v) =>
                    setLocationForm({ ...locationForm, city: v })
                  }
                  required
                />
                <Field
                  label="Area"
                  value={locationForm.area}
                  onChange={(v) =>
                    setLocationForm({ ...locationForm, area: v })
                  }
                />
                <Field
                  label="Address"
                  value={locationForm.address}
                  onChange={(v) =>
                    setLocationForm({ ...locationForm, address: v })
                  }
                  required
                />
                <Toggle
                  label="Set as default"
                  checked={locationForm.is_default}
                  onChange={(v) =>
                    setLocationForm({ ...locationForm, is_default: v })
                  }
                />
                <button className="tm-btn" disabled={saving}>
                  {editingLocationId ? "Update location" : "Add location"}
                </button>
              </form>
              <div className="profile-list">
                {locations.map((loc) => (
                  <div className="profile-list-row" key={loc.id}>
                    <div>
                      <strong>{loc.label}</strong>
                      {loc.is_default && (
                        <span className="tm-badge confirmed">default</span>
                      )}
                      <p>
                        {loc.address}, {loc.area ? `${loc.area}, ` : ""}
                        {loc.city}
                      </p>
                    </div>
                    <Actions
                      onEdit={() => {
                        setEditingLocationId(loc.id);
                        setLocationForm({
                          label: loc.label,
                          city: loc.city,
                          area: loc.area || "",
                          address: loc.address,
                          is_default: loc.is_default,
                        });
                      }}
                      onDefault={() =>
                        usersAPI.setDefaultLocation(loc.id).then(loadAccount)
                      }
                      onDelete={() => deleteLocation(loc.id)}
                    />
                  </div>
                ))}
                {!locations.length && (
                  <p className="tm-muted">No saved locations yet.</p>
                )}
              </div>
            </CrudSection>
          )}

          {!loading && active === "payments" && (
            <CrudSection
              title="Payment methods"
              empty="No payment methods yet."
            >
              <p className="tm-muted">
                Safe demo methods only. TicketMandu never asks for or stores
                real card numbers here.
              </p>
              <form className="profile-form compact" onSubmit={savePayment}>
                <label>
                  Method type
                  <select
                    value={paymentForm.method_type}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        method_type: e.target.value,
                        label: methodLabels[e.target.value],
                      })
                    }
                  >
                    {Object.entries(methodLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Label"
                  value={paymentForm.label}
                  onChange={(v) => setPaymentForm({ ...paymentForm, label: v })}
                  placeholder={methodLabels[paymentForm.method_type]}
                />
                <Field
                  label="Last 4 (optional demo only)"
                  value={paymentForm.last4}
                  onChange={(v) => setPaymentForm({ ...paymentForm, last4: v })}
                />
                <Toggle
                  label="Set as default"
                  checked={paymentForm.is_default}
                  onChange={(v) =>
                    setPaymentForm({ ...paymentForm, is_default: v })
                  }
                />
                <button className="tm-btn" disabled={saving}>
                  {editingPaymentId ? "Update method" : "Add method"}
                </button>
              </form>
              <div className="profile-list">
                {paymentMethods.map((m) => (
                  <div className="profile-list-row" key={m.id}>
                    <div>
                      <strong>{m.label}</strong>
                      {m.is_default && (
                        <span className="tm-badge confirmed">default</span>
                      )}
                      <p>
                        {methodLabels[m.method_type] || m.method_type}
                        {m.last4 ? ` · **** ${m.last4}` : ""}
                      </p>
                    </div>
                    <Actions
                      onEdit={() => {
                        setEditingPaymentId(m.id);
                        setPaymentForm({
                          method_type: m.method_type,
                          provider: m.provider || "",
                          label: m.label,
                          last4: m.last4 || "",
                          is_default: m.is_default,
                        });
                      }}
                      onDefault={() =>
                        usersAPI.setDefaultPaymentMethod(m.id).then(loadAccount)
                      }
                      onDelete={() => deletePayment(m.id)}
                    />
                  </div>
                ))}
                {!paymentMethods.length && (
                  <p className="tm-muted">No payment methods yet.</p>
                )}
              </div>
            </CrudSection>
          )}

          {!loading && active === "preferences" && preferences && (
            <div className="profile-form">
              <h2>Notification settings</h2>
              {[
                ["email_notifications", "Email notifications"],
                ["booking_notifications", "Booking updates"],
                ["payment_notifications", "Payment notifications"],
                ["ticket_notifications", "Ticket notifications"],
                ["event_reminders", "Event reminders"],
                ["promotional_notifications", "Promotional notifications"],
                ["in_app_toasts", "Optional in-app success/info toasts"],
              ].map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={!!preferences[key]}
                  onChange={(v) => savePreferences({ [key]: v })}
                />
              ))}
              <h2>App preferences</h2>
              <label>
                Theme
                <select
                  value={preferences.theme || theme}
                  onChange={(e) => savePreferences({ theme: e.target.value })}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
          )}
        </section>
      </div>
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        destructive
        loading={saving}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction) return;
          setSaving(true);
          try {
            await confirmAction.action();
            setConfirmAction(null);
          } catch (err) {
            toast.error(getErrorMessage(err, "Action failed"));
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="profile-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Field({ label, value, onChange, type = "text", ...props }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="profile-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function CrudSection({ title, children }) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
function Actions({ onEdit, onDefault, onDelete }) {
  return (
    <div className="profile-actions">
      <button className="tm-btn-secondary" onClick={onEdit}>
        Edit
      </button>
      <button className="tm-btn-secondary" onClick={onDefault}>
        Default
      </button>
      <button className="tm-btn-secondary danger-text" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
