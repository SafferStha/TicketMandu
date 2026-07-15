import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import SidebarLayout from "../components/SidebarLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ConfirmModal from "../components/ConfirmModal";
import { ADMIN_NAV, ORGANIZER_NAV, CUSTOMER_NAV } from "../utils/routes";
import { useAuth } from "../context/AuthContext";
import { resourcesAPI, getErrorMessage } from "../api";

const field = (name, label, type = "text", options = null) => ({
  name,
  label,
  type,
  options,
});

const MODULES = {
  "/admin/users": {
    title: "Manage Users",
    subtitle: "Admin control for account lifecycle and access.",
    endpoint: "/users",
    fields: [
      field("name", "Name"),
      field("email", "Email", "email"),
      field("phone", "Phone"),
      field("role", "Role", "select", ["user", "organizer", "admin"]),
      field("is_active", "Active", "boolean"),
    ],
    columns: ["id", "name", "email", "role", "is_active", "created_at"],
  },
  "/admin/events": {
    title: "Manage Events",
    subtitle: "Create, publish, cancel, and archive platform events.",
    endpoint: "/events",
    fields: [
      field("name", "Name"),
      field("date", "Date"),
      field("time", "Time"),
      field("venue", "Venue"),
      field("price", "Price", "number"),
      field("category", "Category"),
      field("status", "Status", "select", [
        "draft",
        "published",
        "cancelled",
        "completed",
      ]),
      field("featured", "Featured", "boolean"),
      field("description", "Description", "textarea"),
    ],
    columns: ["id", "name", "category", "venue", "price", "status", "featured"],
  },
  "/admin/venues": {
    title: "Manage Venues",
    subtitle: "Venue inventory and location metadata.",
    endpoint: "/venues",
    fields: [
      field("name", "Name"),
      field("address", "Address"),
      field("city", "City"),
      field("country", "Country"),
      field("capacity", "Capacity", "number"),
      field("image_url", "Image URL"),
      field("map_url", "Map URL"),
      field("status", "Status", "select", ["active", "inactive"]),
    ],
    columns: ["id", "name", "city", "country", "capacity", "status"],
  },
  "/admin/categories": {
    title: "Manage Categories",
    subtitle: "Event taxonomy, icon, and sort order.",
    endpoint: "/categories",
    fields: [
      field("name", "Name"),
      field("description", "Description", "textarea"),
      field("icon", "Icon"),
      field("sort_order", "Sort Order", "number"),
      field("is_active", "Active", "boolean"),
    ],
    columns: ["id", "name", "icon", "sort_order", "is_active"],
  },
  "/admin/organizers": {
    title: "Manage Organizers",
    subtitle: "Verification, organization profiles, and organizer access.",
    endpoint: "/organizers",
    fields: [
      field("user_id", "User ID", "number"),
      field("organization_name", "Organization Name"),
      field("description", "Description", "textarea"),
      field("website", "Website"),
      field("is_verified", "Verified", "boolean"),
      field("is_active", "Active", "boolean"),
    ],
    columns: ["id", "user_id", "organization_name", "is_verified", "is_active"],
  },
  "/admin/event-images": {
    title: "Event Images",
    subtitle: "Gallery, cover image, and event visual assets.",
    endpoint: "/event-images",
    fields: [
      field("event_id", "Event ID", "number"),
      field("url", "Image URL"),
      field("alt_text", "Alt Text"),
      field("sort_order", "Sort Order", "number"),
      field("is_cover", "Cover Image", "boolean"),
    ],
    columns: ["id", "event_id", "url", "is_cover", "sort_order"],
  },
  "/admin/ticket-types": {
    title: "Ticket Types",
    subtitle: "Pricing tiers, quantities, and sale windows.",
    endpoint: "/ticket-types",
    fields: [
      field("event_id", "Event ID", "number"),
      field("name", "Name"),
      field("description", "Description", "textarea"),
      field("price", "Price", "number"),
      field("currency", "Currency"),
      field("quantity", "Quantity", "number"),
      field("max_per_order", "Max Per Order", "number"),
      field("is_active", "Active", "boolean"),
    ],
    columns: [
      "id",
      "event_id",
      "name",
      "price",
      "quantity",
      "quantity_sold",
      "is_active",
    ],
  },
  "/admin/orders": {
    title: "Manage Orders",
    subtitle: "Booking, checkout, and order lifecycle.",
    endpoint: "/orders",
    readOnly: true,
    columns: [
      "id",
      "order_number",
      "status",
      "subtotal",
      "total_amount",
      "created_at",
    ],
  },
  "/admin/payments": {
    title: "Manage Payments",
    subtitle: "Payment status, refunds, and gateway tracking.",
    endpoint: "/payments",
    readOnly: true,
    columns: [
      "id",
      "order_id",
      "payment_method",
      "status",
      "amount",
      "created_at",
    ],
  },
  "/admin/tickets": {
    title: "Manage Tickets",
    subtitle: "Ticket issuance and verification.",
    endpoint: "/tickets",
    readOnly: true,
    columns: [
      "id",
      "ticketNumber",
      "status",
      "orderId",
      "eventId",
      "createdAt",
    ],
  },
  "/admin/reviews": {
    title: "Manage Reviews",
    subtitle: "Moderation and visibility controls.",
    endpoint: "/reviews",
    readOnly: false,
    disableCreate: true,
    fields: [
      field("rating", "Rating", "number"),
      field("body", "Review", "textarea"),
      field("is_visible", "Visible", "boolean"),
    ],
    columns: [
      "id",
      "event_name",
      "user_name",
      "rating",
      "is_visible",
      "created_at",
    ],
  },
  "/admin/coupons": {
    title: "Manage Coupons",
    subtitle: "Discount campaigns and redemptions.",
    endpoint: "/coupons",
    fields: [
      field("code", "Code"),
      field("discount_type", "Discount Type", "select", [
        "percentage",
        "fixed",
      ]),
      field("discount_value", "Discount Value", "number"),
      field("usage_limit", "Usage Limit", "number"),
      field("event_id", "Event ID", "number"),
      field("expires_at", "Expires At"),
      field("is_active", "Active", "boolean"),
    ],
    columns: [
      "id",
      "code",
      "discount_type",
      "discount_value",
      "usage_limit",
      "used_count",
      "is_active",
    ],
  },
  "/admin/notifications": {
    title: "Manage Notifications",
    subtitle: "User alerts and broadcast groundwork.",
    endpoint: "/notifications",
    readOnly: true,
    columns: ["id", "user_id", "type", "title", "is_read", "created_at"],
  },
  "/admin/seat-maps": {
    title: "Seat Maps",
    subtitle: "Venue layouts and seat map metadata.",
    endpoint: "/seat-maps",
    fields: [
      field("venue_id", "Venue ID", "number"),
      field("name", "Name"),
      field("rows", "Rows", "number"),
      field("seats_per_row", "Seats Per Row", "number"),
      field("map_config", "Map Config JSON", "json"),
    ],
    columns: ["id", "venue_id", "name", "rows", "seats_per_row"],
  },
  "/admin/seats": {
    title: "Seats",
    subtitle: "Seat inventory and availability controls.",
    endpoint: "/seats",
    fields: [
      field("seat_map_id", "Seat Map ID", "number"),
      field("row_label", "Row"),
      field("seat_number", "Seat Number", "number"),
      field("section", "Section"),
      field("category", "Category"),
      field("status", "Status", "select", [
        "available",
        "reserved",
        "booked",
        "blocked",
      ]),
      field("is_blocked", "Blocked", "boolean"),
    ],
    columns: [
      "id",
      "seat_map_id",
      "row_label",
      "seat_number",
      "section",
      "status",
      "is_blocked",
    ],
  },
  "/admin/audit-logs": {
    title: "Audit Logs",
    subtitle: "Track sensitive platform actions.",
    endpoint: "/audit-logs",
    readOnly: true,
    columns: [
      "id",
      "actor_id",
      "action",
      "resource_type",
      "resource_id",
      "created_at",
    ],
  },
  "/admin/reports": {
    title: "Reports",
    subtitle: "Revenue and operational analytics.",
    endpoint: "/orders",
    readOnly: true,
    columns: ["id", "order_number", "status", "total_amount", "created_at"],
  },
  "/organizer/events": {
    title: "My Events",
    subtitle: "Organizer-owned event inventory and editing.",
    endpoint: "/events",
    fields: [
      field("name", "Name"),
      field("date", "Date"),
      field("time", "Time"),
      field("venue", "Venue"),
      field("price", "Price", "number"),
      field("category", "Category"),
      field("status", "Status", "select", [
        "draft",
        "published",
        "cancelled",
        "completed",
      ]),
      field("description", "Description", "textarea"),
    ],
    columns: ["id", "name", "category", "venue", "status", "price"],
  },
  "/organizer/ticket-types": {
    title: "Ticket Types",
    subtitle: "Pricing tiers for your events.",
    endpoint: "/ticket-types",
    fields: [
      field("event_id", "Event ID", "number"),
      field("name", "Name"),
      field("description", "Description", "textarea"),
      field("price", "Price", "number"),
      field("currency", "Currency"),
      field("quantity", "Quantity", "number"),
      field("max_per_order", "Max Per Order", "number"),
      field("is_active", "Active", "boolean"),
    ],
    columns: [
      "id",
      "event_id",
      "name",
      "price",
      "quantity",
      "quantity_sold",
      "is_active",
    ],
  },
  "/organizer/event-images": {
    title: "Event Images",
    subtitle: "Manage visual assets for your events.",
    endpoint: "/event-images",
    fields: [
      field("event_id", "Event ID", "number"),
      field("url", "Image URL"),
      field("alt_text", "Alt Text"),
      field("sort_order", "Sort Order", "number"),
      field("is_cover", "Cover Image", "boolean"),
    ],
    columns: ["id", "event_id", "url", "is_cover", "sort_order"],
  },
  "/organizer/coupons": {
    title: "Coupons",
    subtitle: "Discount campaigns for your events.",
    endpoint: "/coupons",
    fields: [
      field("code", "Code"),
      field("discount_type", "Discount Type", "select", [
        "percentage",
        "fixed",
      ]),
      field("discount_value", "Discount Value", "number"),
      field("usage_limit", "Usage Limit", "number"),
      field("event_id", "Event ID", "number"),
      field("expires_at", "Expires At"),
      field("is_active", "Active", "boolean"),
    ],
    columns: [
      "id",
      "code",
      "discount_type",
      "discount_value",
      "usage_limit",
      "used_count",
      "is_active",
    ],
  },
  "/organizer/orders": {
    title: "Organizer Orders",
    subtitle: "Orders tied to your events.",
    endpoint: "/orders",
    readOnly: true,
    columns: ["id", "order_number", "status", "total_amount", "created_at"],
  },
  "/organizer/tickets": {
    title: "Ticket Verification",
    subtitle: "Scan and check-in support.",
    endpoint: "/tickets",
    readOnly: true,
    ticketCheck: true,
    columns: ["id", "ticketNumber", "status", "orderId", "eventId"],
  },
  "/organizer/analytics": {
    title: "Organizer Analytics",
    subtitle: "Event performance and conversions.",
    endpoint: "/orders",
    readOnly: true,
    columns: ["id", "order_number", "status", "total_amount", "created_at"],
  },
  "/organizer/profile": {
    title: "Organizer Profile",
    subtitle: "Your organization details and verification.",
    endpoint: "/organizers",
    fields: [
      field("organization_name", "Organization Name"),
      field("description", "Description", "textarea"),
      field("website", "Website"),
      field("logo_url", "Logo URL"),
    ],
    columns: ["id", "organization_name", "website", "is_verified", "is_active"],
  },
};

const getValue = (row, key) =>
  key.split(".").reduce((acc, part) => acc?.[part], row);

const formatCell = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 70);
  return String(value).length > 72
    ? `${String(value).slice(0, 72)}…`
    : String(value);
};

const emptyForm = (fields = []) =>
  fields.reduce(
    (acc, item) => ({
      ...acc,
      [item.name]: item.type === "boolean" ? false : "",
    }),
    {},
  );

export default function ManagementPage() {
  const { user } = useAuth();
  const location = useLocation();
  const config = useMemo(
    () =>
      MODULES[location.pathname] || {
        title: "Module",
        subtitle: "Professional CRUD workspace.",
        endpoint: "/events",
        readOnly: true,
        columns: ["id", "name", "status"],
      },
    [location.pathname],
  );
  const nav =
    user?.role === "admin"
      ? ADMIN_NAV
      : user?.role === "organizer"
        ? ORGANIZER_NAV
        : CUSTOMER_NAV;

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(config.fields));
  const [ticketNumber, setTicketNumber] = useState("");
  const [checking, setChecking] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canWrite = !config.readOnly;
  const canCreate = canWrite && !config.disableCreate;

  const load = async () => {
    setLoading(true);
    try {
      const result = await resourcesAPI.list(config.endpoint, {
        q,
        page,
        limit: 12,
        scope: user?.role === "admin" ? "all" : undefined,
      });
      setRows(result.rows || []);
      setPagination(result.pagination || null);
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to load ${config.title}`));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setRows([]);
      setPage(1);
      setEditing(null);
      setForm(emptyForm(config.fields));
    });
  }, [config.endpoint, config.fields, location.pathname]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [config.endpoint, page]);

  const openCreate = () => {
    setEditing({ mode: "create" });
    setForm(emptyForm(config.fields));
  };

  const openEdit = (row) => {
    setEditing({ mode: "edit", row });
    setForm(
      (config.fields || []).reduce(
        (acc, item) => ({
          ...acc,
          [item.name]:
            getValue(row, item.name) ?? (item.type === "boolean" ? false : ""),
        }),
        {},
      ),
    );
  };

  const parseForm = () => {
    const payload = {};
    for (const item of config.fields || []) {
      const raw = form[item.name];
      if (raw === "" || raw === undefined) continue;
      if (item.type === "number") payload[item.name] = Number(raw);
      else if (item.type === "boolean") payload[item.name] = Boolean(raw);
      else if (item.type === "json") {
        try {
          payload[item.name] =
            typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
        } catch {
          throw new Error(`${item.label} must be valid JSON`);
        }
      } else payload[item.name] = raw;
    }
    return payload;
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = parseForm();
      if (editing.mode === "create")
        await resourcesAPI.create(config.endpoint, payload);
      else await resourcesAPI.update(config.endpoint, editing.row.id, payload);
      toast.success(
        editing.mode === "create"
          ? "Created successfully"
          : "Updated successfully",
      );
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, err.message || "Save failed"));
    }
  };

  const remove = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await resourcesAPI.remove(config.endpoint, deleteRow.id);
      toast.success("Deleted successfully");
      setDeleteRow(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  const checkTicket = async () => {
    if (!ticketNumber.trim()) return;
    setChecking(true);
    try {
      const { ticketsAPI } = await import("../api");
      const ticket = await ticketsAPI.checkIn(ticketNumber.trim());
      toast.success(
        `Ticket checked in: ${ticket.ticketNumber || ticket.ticket_number}`,
      );
      setTicketNumber("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Ticket verification failed"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <SidebarLayout title={config.title} navItems={nav}>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Link
              to={
                user?.role === "admin"
                  ? "/admin"
                  : user?.role === "organizer"
                    ? "/organizer"
                    : "/"
              }
              style={styles.secondaryAction}
            >
              Back
            </Link>
            {canCreate ? (
              <button onClick={openCreate} style={styles.action}>
                Create New
              </button>
            ) : null}
          </>
        }
      />

      <div style={styles.grid}>
        <StatCard
          label="Rows Loaded"
          value={loading ? "…" : rows.length}
          helper="Current page"
          tone="blue"
        />
        <StatCard
          label="Total Records"
          value={pagination?.total ?? "—"}
          helper="From API pagination"
          tone="green"
        />
        <StatCard
          label="Mode"
          value={canWrite ? "CRUD" : "Read"}
          helper={
            canWrite
              ? "Create, edit, delete enabled"
              : "Protected business records"
          }
          tone="amber"
        />
      </div>

      {config.ticketCheck ? (
        <section style={styles.card}>
          <h2 style={styles.title}>Ticket Check-In</h2>
          <div style={styles.searchRow}>
            <input
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Enter ticket number or QR value"
              style={styles.input}
            />
            <button
              onClick={checkTicket}
              disabled={checking}
              style={styles.action}
            >
              {checking ? "Checking…" : "Check In"}
            </button>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <div style={styles.searchRow}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search records…"
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                load();
              }
            }}
          />
          <button
            onClick={() => {
              setPage(1);
              load();
            }}
            style={styles.secondaryAction}
          >
            Search
          </button>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {(config.columns || ["id"]).map((col) => (
                  <th key={col} style={styles.th}>
                    {col.replaceAll("_", " ")}
                  </th>
                ))}
                {canWrite ? <th style={styles.th}>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={(config.columns || []).length + 1}
                    style={styles.empty}
                  >
                    Loading records…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={(config.columns || []).length + 1}
                    style={styles.empty}
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    {(config.columns || ["id"]).map((col) => {
                      const value = getValue(row, col);
                      const isStatus = [
                        "status",
                        "is_active",
                        "featured",
                        "is_verified",
                        "is_visible",
                        "is_read",
                      ].includes(col);
                      return (
                        <td key={col} style={styles.td}>
                          {isStatus ? (
                            <span style={styles.badge}>
                              {formatCell(value)}
                            </span>
                          ) : (
                            formatCell(value)
                          )}
                        </td>
                      );
                    })}
                    {canWrite ? (
                      <td style={styles.tdActions}>
                        <button
                          onClick={() => openEdit(row)}
                          style={styles.miniBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteRow(row)}
                          style={styles.dangerBtn}
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={styles.secondaryAction}
          >
            Previous
          </button>
          <span style={styles.pageText}>
            Page {pagination?.page || page} of {pagination?.totalPages || "—"}
          </span>
          <button
            disabled={pagination && page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={styles.secondaryAction}
          >
            Next
          </button>
        </div>
      </section>

      {editing ? (
        <div style={styles.modalBackdrop}>
          <form onSubmit={submit} style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editing.mode === "create"
                ? "Create Record"
                : `Edit #${editing.row.id}`}
            </h2>
            <div style={styles.formGrid}>
              {(config.fields || []).map((item) => (
                <label key={item.name} style={styles.label}>
                  {item.label}
                  {item.type === "select" ? (
                    <select
                      value={form[item.name] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [item.name]: e.target.value }))
                      }
                      style={styles.input}
                    >
                      <option value="">Select</option>
                      {item.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : item.type === "boolean" ? (
                    <select
                      value={String(Boolean(form[item.name]))}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [item.name]: e.target.value === "true",
                        }))
                      }
                      style={styles.input}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : item.type === "textarea" ? (
                    <textarea
                      value={form[item.name] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [item.name]: e.target.value }))
                      }
                      style={{ ...styles.input, minHeight: 90 }}
                    />
                  ) : (
                    <input
                      type={
                        item.type === "number" ? "number" : item.type || "text"
                      }
                      value={form[item.name] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [item.name]: e.target.value }))
                      }
                      style={styles.input}
                    />
                  )}
                </label>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setEditing(null)}
                style={styles.secondaryAction}
              >
                Cancel
              </button>
              <button type="submit" style={styles.action}>
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <ConfirmModal
        open={!!deleteRow}
        title="Delete record?"
        message={`Delete #${deleteRow?.id}? This action may soft-delete the record and affect related workflows.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onCancel={() => setDeleteRow(null)}
        onConfirm={remove}
      />
    </SidebarLayout>
  );
}

const styles = {
  action: {
    border: "none",
    background: "#0d1b4b",
    color: "#fff",
    borderRadius: "9999px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
    textDecoration: "none",
  },
  secondaryAction: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: "9999px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    textDecoration: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
    marginBottom: "18px",
  },
  title: {
    margin: "0 0 14px",
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },
  searchRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "11px 12px",
    font: "inherit",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 720 },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  tr: { borderTop: "1px solid #e2e8f0" },
  td: { padding: "12px", color: "#0f172a", fontSize: 14, verticalAlign: "top" },
  tdActions: { padding: "12px", display: "flex", gap: 8 },
  badge: {
    display: "inline-flex",
    padding: "4px 9px",
    borderRadius: "9999px",
    background: "#f1f5f9",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: 12,
  },
  miniBtn: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "9999px",
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerBtn: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: "9999px",
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  empty: { padding: 26, textAlign: "center", color: "#64748b" },
  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  pageText: { color: "#64748b", fontWeight: 700 },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.38)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
  },
  modal: {
    width: "min(760px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 30px 80px rgba(15,23,42,0.28)",
  },
  modalTitle: {
    margin: "0 0 18px",
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  label: {
    display: "grid",
    gap: 6,
    color: "#334155",
    fontWeight: 800,
    fontSize: 13,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
};
