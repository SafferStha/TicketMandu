import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { ordersAPI, paymentsAPI, getErrorMessage } from "../api";
import PageHeader from "../components/PageHeader";
import { formatPrice, formatDateTime } from "../utils/format.util";

const payableStatuses = new Set(["pending"]);
const completeStatuses = new Set(["confirmed", "paid"]);
const blockedStatuses = new Set(["cancelled", "expired", "refunded"]);
const paymentOptions = [
  {
    value: "mock",
    label: "Mock Payment",
    note: "Instant safe demo payment for testing.",
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    note: "Pay at venue/check-in where supported.",
  },
  {
    value: "esewa_placeholder",
    label: "eSewa placeholder",
    note: "Placeholder only — no real eSewa charge is made.",
  },
  {
    value: "khalti_placeholder",
    label: "Khalti placeholder",
    note: "Placeholder only — no real Khalti charge is made.",
  },
];

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mock");

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      setOrder(await ordersAPI.getById(orderId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load checkout"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order) Promise.resolve().then(loadOrder);
  }, [orderId]);

  const status = String(order?.status || "").toLowerCase();
  const canPay = order && payableStatuses.has(status) && !processing;
  const alreadyPaid = completeStatuses.has(status);
  const blocked = blockedStatuses.has(status);
  const currency = order?.currency || "NPR";
  const itemSummary = useMemo(
    () =>
      (order?.items || [])
        .map(
          (item) =>
            `${item.eventName} · ${item.ticketTypeName} × ${item.quantity}`,
        )
        .join(" | "),
    [order],
  );

  const handlePay = async () => {
    if (!canPay) return;
    setProcessing(true);
    try {
      await paymentsAPI.mockPay(order.id, paymentMethod);
      toast.success("Payment successful. Your tickets are ready.");
      navigate("/tickets");
    } catch (err) {
      toast.error(getErrorMessage(err, "Payment failed"));
      await loadOrder();
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <span className="tm-empty-icon">⏳</span>
          <h3>Loading checkout…</h3>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <span className="tm-empty-icon">⚠️</span>
          <h3>Checkout unavailable</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!order)
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <h3>Order not found</h3>
        </div>
      </div>
    );

  return (
    <div className="tm-page">
      <div className="tm-container">
        <PageHeader
          title="Checkout"
          subtitle="Review your order and complete a safe demo payment. Placeholder wallets do not process real charges."
        />
        <div className="flow-grid">
          <section className="tm-card flow-card">
            <div className="order-card-head" style={{ marginBottom: 12 }}>
              <div>
                <span className="tm-muted">Order</span>
                <h2 style={{ margin: 0 }}>{order.orderNumber}</h2>
                <p className="tm-muted" style={{ margin: "4px 0 0" }}>
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span className={`tm-badge ${status}`}>{status}</span>
            </div>

            <div className="flow-list">
              {(order.items || []).map((item) => (
                <div className="flow-row" key={item.id}>
                  <div>
                    <strong>{item.eventName}</strong>
                    <p className="tm-muted" style={{ margin: 0 }}>
                      {item.ticketTypeName}
                    </p>
                  </div>
                  <div>
                    {item.quantity} × {formatPrice(item.unitPrice, currency)}
                  </div>
                  <strong>{formatPrice(item.subtotal, currency)}</strong>
                </div>
              ))}
            </div>
          </section>

          <aside className="tm-card flow-card">
            <h2 style={{ marginTop: 0 }}>Payment summary</h2>
            <div className="booking-total">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(order.subtotal, currency)}</strong>
              </div>
              <div className="summary-row">
                <span>Service fee</span>
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
            <p className="tm-muted">{itemSummary || "No order items found."}</p>
            {alreadyPaid ? (
              <div className="tm-empty" style={{ padding: 12 }}>
                <strong>Payment already completed</strong>
                <Link to="/tickets" className="tm-btn-secondary">
                  View Tickets
                </Link>
              </div>
            ) : null}
            {blocked ? (
              <p className="tm-error">
                This order is {status}; payment is no longer available.
              </p>
            ) : null}
            {!alreadyPaid && !blocked ? (
              <>
                <div
                  className="payment-options"
                  role="radiogroup"
                  aria-label="Payment method"
                >
                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`payment-option ${paymentMethod === option.value ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        disabled={processing}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.note}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  className="tm-btn"
                  disabled={!canPay}
                  onClick={handlePay}
                >
                  {processing
                    ? "Processing…"
                    : `Pay with ${paymentOptions.find((o) => o.value === paymentMethod)?.label || "selected method"}`}
                </button>
              </>
            ) : null}
            <Link to={`/orders/${order.id}`} className="tm-btn-secondary">
              View order details
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
