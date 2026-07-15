import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ordersAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import { formatPrice, formatDateTime } from "../utils/format.util";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await ordersAPI.getById(id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load order"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, [id]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await ordersAPI.cancel(id);
      toast.success("Order cancelled");
      setConfirmCancel(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel order"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <h3>Loading order…</h3>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <p className="tm-error">{error}</p>
        </div>
      </div>
    );
  if (!order) return null;

  const status = String(order.status || "").toLowerCase();
  const currency = order.currency || "NPR";

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title={order.orderNumber}
          subtitle={`Created ${formatDateTime(order.createdAt)}`}
          actions={
            <Link to="/orders" className="tm-btn-secondary">
              Back
            </Link>
          }
        />
        <div className="flow-grid">
          <section className="tm-card flow-card">
            <div className="order-card-head" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Order items</h2>
              <span className={`tm-badge ${status}`}>{status}</span>
            </div>
            <div className="flow-list">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flow-row">
                  <div>
                    <strong>{item.eventName}</strong>
                    <p className="tm-muted" style={{ margin: 0 }}>
                      {item.ticketTypeName}
                    </p>
                  </div>
                  <span>
                    {item.quantity} × {formatPrice(item.unitPrice, currency)}
                  </span>
                  <strong>{formatPrice(item.subtotal, currency)}</strong>
                </div>
              ))}
            </div>
          </section>
          <aside className="tm-card flow-card">
            <h2 style={{ marginTop: 0 }}>Summary</h2>
            <div className="booking-total">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(order.subtotal, currency)}</strong>
              </div>
              <div className="summary-row">
                <span>Service Fee</span>
                <strong>{formatPrice(order.serviceFee, currency)}</strong>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <strong>-{formatPrice(order.discountAmount, currency)}</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatPrice(order.totalAmount, currency)}</strong>
              </div>
            </div>
            <div className="tm-actions" style={{ marginTop: 16 }}>
              {status === "pending" ? (
                <Link to={`/checkout?orderId=${order.id}`} className="tm-btn">
                  Continue Checkout
                </Link>
              ) : null}
              {status === "pending" ? (
                <button
                  className="tm-btn-danger"
                  onClick={() => setConfirmCancel(true)}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel Order"}
                </button>
              ) : null}
              {["confirmed", "paid"].includes(status) ? (
                <Link to="/tickets" className="tm-btn">
                  View Tickets
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
      <ConfirmModal
        open={confirmCancel}
        title="Cancel this order?"
        message="Reserved ticket quantities will be released and this unpaid order cannot be paid afterwards."
        confirmLabel="Cancel order"
        destructive
        loading={cancelling}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
      />
    </div>
  );
}
