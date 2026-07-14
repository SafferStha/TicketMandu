import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ordersAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";
import { formatPrice, formatDateTime } from "../utils/format.util";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersAPI.getMy({ limit: 50 });
      setOrders(result.orders || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  const cancelOrder = async (id) => {
    if (
      !window.confirm(
        "Cancel this pending order? Reserved ticket quantities will be released.",
      )
    )
      return;
    try {
      await ordersAPI.cancel(id);
      toast.success("Order cancelled");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel order"));
    }
  };

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title="My Orders"
          subtitle="Track bookings, payments, and ticket purchases."
        />
        {loading ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">⏳</span>
            <h3>Loading orders…</h3>
          </div>
        ) : error ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">⚠️</span>
            <p className="tm-error">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="tm-empty tm-card">
            <span className="tm-empty-icon">🧾</span>
            <h3>No orders yet</h3>
            <p>Book an event to create your first TicketMandu order.</p>
            <Link to="/discover" className="tm-btn">
              Discover Events
            </Link>
          </div>
        ) : (
          <div className="flow-list">
            {orders.map((order) => {
              const status = String(order.status || "").toLowerCase();
              const quantity = (order.items || []).reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              );
              const primaryItem = order.items?.[0];
              return (
                <article className="tm-card order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <span className="tm-muted">Order</span>
                      <h2 style={{ margin: "2px 0" }}>
                        <Link to={`/orders/${order.id}`}>
                          {order.orderNumber}
                        </Link>
                      </h2>
                      <p className="tm-muted" style={{ margin: 0 }}>
                        {primaryItem?.eventName || "Multiple events"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: 22 }}>
                        {formatPrice(order.totalAmount, order.currency)}
                      </strong>
                      <div>
                        <span className={`tm-badge ${status}`}>{status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="order-meta-grid">
                    <div className="order-meta-cell">
                      <span className="tm-muted">Date</span>
                      <strong>{formatDateTime(order.createdAt)}</strong>
                    </div>
                    <div className="order-meta-cell">
                      <span className="tm-muted">Quantity</span>
                      <strong>{quantity}</strong>
                    </div>
                    <div className="order-meta-cell">
                      <span className="tm-muted">Ticket</span>
                      <strong>{primaryItem?.ticketTypeName || "—"}</strong>
                    </div>
                    <div className="order-meta-cell">
                      <span className="tm-muted">Status</span>
                      <strong>{status}</strong>
                    </div>
                  </div>
                  <div className="tm-actions">
                    <Link
                      to={`/orders/${order.id}`}
                      className="tm-btn-secondary"
                    >
                      View Details
                    </Link>
                    {status === "pending" ? (
                      <Link
                        to={`/checkout?orderId=${order.id}`}
                        className="tm-btn"
                      >
                        Continue Checkout
                      </Link>
                    ) : null}
                    {status === "pending" ? (
                      <button
                        className="tm-btn-danger"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel Order
                      </button>
                    ) : null}
                    {["confirmed", "paid"].includes(status) ? (
                      <Link to="/tickets" className="tm-btn">
                        View Tickets
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
