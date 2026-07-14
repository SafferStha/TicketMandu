import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  eventsAPI,
  ordersAPI,
  favoritesAPI,
  reviewsAPI,
  getErrorMessage,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format.util";

const BackIcon = () => <span aria-hidden="true">←</span>;
const HeartIcon = ({ filled }) => (
  <span aria-hidden="true">{filled ? "♥" : "♡"}</span>
);

const unavailableStatuses = new Set([
  "draft",
  "cancelled",
  "completed",
  "deleted",
  "expired",
]);

const remainingFor = (ticketType) =>
  Math.max(
    0,
    Number(ticketType?.quantity || 0) - Number(ticketType?.quantity_sold || 0),
  );
const ticketCurrency = (ticketType, event) =>
  ticketType?.currency || event?.currency || "NPR";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [reviews, setReviews] = useState({
    reviews: [],
    summary: { average_rating: 0, review_count: 0 },
  });
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const requests = [
      eventsAPI.getById(id),
      eventsAPI.getTicketTypes(id),
      reviewsAPI.getByEvent(id),
    ];
    if (user)
      requests.push(
        ordersAPI
          .getMy({ eventId: id, limit: 50 })
          .catch(() => ({ orders: [] })),
      );

    Promise.all(requests)
      .then(([eventData, types, reviewData, ordersData]) => {
        if (cancelled) return;
        const activeTypes = (types || []).sort(
          (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
        );
        setEvent(eventData);
        setTicketTypes(activeTypes);
        setReviews(
          reviewData || {
            reviews: [],
            summary: { average_rating: 0, review_count: 0 },
          },
        );
        setMyOrders(ordersData?.orders || []);
        const firstAvailable =
          activeTypes.find(
            (type) => type.is_active !== false && remainingFor(type) > 0,
          ) || activeTypes[0];
        setSelectedTicketTypeId(firstAvailable?.id || null);
        setQuantity(1);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = getErrorMessage(err, "Event not found");
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const selectedTicketType = useMemo(
    () =>
      ticketTypes.find(
        (ticketType) => ticketType.id === selectedTicketTypeId,
      ) || null,
    [ticketTypes, selectedTicketTypeId],
  );

  const remaining = remainingFor(selectedTicketType);
  const maxPerOrder = Math.max(
    1,
    Math.min(Number(selectedTicketType?.max_per_order || 1), remaining || 1),
  );
  const unitPrice = Number(selectedTicketType?.price || 0);
  const subtotal = selectedTicketType ? unitPrice * quantity : 0;
  const serviceFee = 0;
  const discount = 0;
  const total = Math.max(0, subtotal + serviceFee - discount);
  const currency = ticketCurrency(selectedTicketType, event);
  const isEventUnavailable = unavailableStatuses.has(
    String(event?.status || "published").toLowerCase(),
  );
  const isTicketUnavailable =
    !selectedTicketType ||
    selectedTicketType.is_active === false ||
    remaining <= 0;
  const invalidQuantity =
    !Number.isInteger(quantity) || quantity < 1 || quantity > maxPerOrder;
  const bookingDisabled =
    booking || isEventUnavailable || isTicketUnavailable || invalidQuantity;

  const canReview = useMemo(() => {
    if (!user) return false;
    const alreadyReviewed = (reviews.reviews || []).some(
      (review) => Number(review.user_id) === Number(user.id),
    );
    const hasConfirmedOrder = myOrders.some(
      (order) =>
        ["confirmed", "paid"].includes(order.status) &&
        (order.items || []).some(
          (item) => Number(item.eventId || item.event_id) === Number(id),
        ),
    );
    return hasConfirmedOrder && !alreadyReviewed;
  }, [id, myOrders, reviews.reviews, user]);

  const selectTicketType = (ticketType) => {
    if (ticketType.is_active === false || remainingFor(ticketType) <= 0) return;
    setSelectedTicketTypeId(ticketType.id);
    const nextMax = Math.max(
      1,
      Math.min(
        Number(ticketType.max_per_order || 1),
        remainingFor(ticketType) || 1,
      ),
    );
    setQuantity((value) => Math.min(Math.max(value, 1), nextMax));
  };

  const handleBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (bookingDisabled) {
      toast.error(
        isEventUnavailable
          ? "This event is not available for booking"
          : "Select an available ticket type and quantity",
      );
      return;
    }

    setBooking(true);
    try {
      const order = await ordersAPI.create({
        items: [
          { eventId: event.id, ticketTypeId: selectedTicketType.id, quantity },
        ],
        serviceFee,
        discountAmount: discount,
        currency,
      });
      toast.success("Order created. Continue to checkout.");
      navigate(`/checkout?orderId=${order.id}`, { state: { order } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to book ticket"));
    } finally {
      setBooking(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      if (liked) await favoritesAPI.remove(event.id);
      else await favoritesAPI.add(event.id);
      setLiked((current) => !current);
      toast.success(liked ? "Removed from favorites" : "Saved to favorites");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update favorite"));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!canReview) return;
    setReviewing(true);
    try {
      await reviewsAPI.create({
        eventId: event.id,
        rating: reviewRating,
        body: reviewBody,
      });
      const reviewData = await reviewsAPI.getByEvent(id);
      setReviews(reviewData || reviews);
      setReviewBody("");
      toast.success("Review submitted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit review"));
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <span className="tm-empty-icon">⏳</span>
          <h3>Loading event…</h3>
          <p>Fetching event details, tickets, and reviews.</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="tm-page">
        <div className="tm-container tm-empty tm-card">
          <span className="tm-empty-icon">⚠️</span>
          <h3>Event unavailable</h3>
          <p>{error || "We could not find this event."}</p>
          <button
            className="tm-btn-secondary"
            onClick={() => navigate("/discover")}
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  const heroStyle = {
    background: event.featuredBg || "linear-gradient(135deg, #0d1b4b, #1565c0)",
  };
  const rating = Number(reviews.summary?.average_rating || 0).toFixed(1);
  const reviewCount = Number(reviews.summary?.review_count || 0);

  const BookingSummary = ({ mobile = false }) => (
    <>
      <div className="booking-total">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>
            {selectedTicketType ? formatPrice(subtotal, currency) : "—"}
          </strong>
        </div>
        <div className="summary-row">
          <span>Service fee</span>
          <strong>{formatPrice(serviceFee, currency)}</strong>
        </div>
        <div className="summary-row">
          <span>Discount</span>
          <strong>-{formatPrice(discount, currency)}</strong>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <strong>
            {selectedTicketType ? formatPrice(total, currency) : "—"}
          </strong>
        </div>
      </div>
      {!mobile && (
        <button
          className="tm-btn desktop-book-btn"
          disabled={bookingDisabled}
          onClick={handleBook}
        >
          {booking ? "Creating order…" : user ? "Book Now" : "Login to Book"}
        </button>
      )}
      {isEventUnavailable ? (
        <p className="tm-error">
          This event is currently {event.status} and cannot be booked.
        </p>
      ) : null}
      {!selectedTicketType && ticketTypes.length === 0 ? (
        <p className="tm-muted">
          Tickets are not available for this event yet.
        </p>
      ) : null}
    </>
  );

  return (
    <div className="tm-page" style={{ paddingTop: 0 }}>
      <section className="event-hero" style={heroStyle}>
        {event.coverImageUrl ? (
          <img className="event-hero-media" src={event.coverImageUrl} alt="" />
        ) : null}
        <div className="tm-container event-hero-inner">
          <div className="event-hero-actions">
            <button
              className="tm-icon-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <button
              className="tm-icon-btn"
              onClick={toggleFavorite}
              aria-label="Toggle favorite"
            >
              <HeartIcon filled={liked} />
            </button>
          </div>
          <div className="event-hero-copy">
            <span className="tm-badge">{event.category || "Event"}</span>
            <h1 className="event-title">{event.name}</h1>
            <div className="event-subline">
              <span>📅 {event.date || "Date TBA"}</span>
              <span>🕒 {event.time || "Time TBA"}</span>
              <span>📍 {event.venue || "Venue TBA"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tm-container event-shell">
        <main className="event-main">
          <section className="tm-card event-panel">
            <div className="event-info-grid">
              <div className="event-info-item">
                <span>Date</span>
                <strong>{event.date || "TBA"}</strong>
              </div>
              <div className="event-info-item">
                <span>Time</span>
                <strong>{event.time || "TBA"}</strong>
              </div>
              <div className="event-info-item">
                <span>Rating</span>
                <strong>
                  ★ {rating} ({reviewCount})
                </strong>
              </div>
            </div>
          </section>

          <section className="tm-card event-panel">
            <h2>About this event</h2>
            <p className="tm-muted">
              {event.description ||
                `Join us for an unforgettable TicketMandu experience at ${event.name}.`}
            </p>
          </section>

          <section className="tm-card event-panel">
            <h2>Event details</h2>
            <div className="event-details-grid">
              <div>
                <span className="tm-muted">Venue</span>
                <h3>{event.venue || "Venue TBA"}</h3>
              </div>
              <div>
                <span className="tm-muted">Organizer</span>
                <h3>{event.organizerName || "TicketMandu Organizer"}</h3>
              </div>
              <div>
                <span className="tm-muted">Category</span>
                <h3>{event.category || "General"}</h3>
              </div>
              <div>
                <span className="tm-muted">Status</span>
                <h3>
                  <span className={`tm-badge ${event.status}`}>
                    {event.status || "published"}
                  </span>
                </h3>
              </div>
            </div>
          </section>

          <section className="tm-card event-panel">
            <h2>Reviews</h2>
            <p className="tm-muted">
              Average rating: <strong>{rating}</strong> from {reviewCount}{" "}
              review{reviewCount === 1 ? "" : "s"}.
            </p>
            {canReview ? (
              <form className="review-form" onSubmit={submitReview}>
                <select
                  className="form-control"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <textarea
                  className="form-control"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your experience"
                  rows={4}
                />
                <button
                  className="tm-btn"
                  disabled={reviewing || !reviewBody.trim()}
                >
                  {reviewing ? "Submitting…" : "Submit review"}
                </button>
              </form>
            ) : (
              <p className="tm-muted">
                Only customers with a confirmed ticket for this event can submit
                a review.
              </p>
            )}
            <div className="review-list" style={{ marginTop: 14 }}>
              {(reviews.reviews || []).length === 0 ? (
                <div className="tm-empty" style={{ padding: 18 }}>
                  <p>No reviews yet.</p>
                </div>
              ) : (
                (reviews.reviews || []).map((review) => (
                  <article className="review-card" key={review.id}>
                    <strong>{review.user_name || "Guest"}</strong>
                    <div aria-label={`${review.rating} stars`}>
                      {"★".repeat(Number(review.rating || 0))}
                    </div>
                    <p>{review.body || "No comment provided."}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="tm-card booking-card">
          <div>
            <h2>Select tickets</h2>
            <p className="tm-muted">
              Choose a ticket type and quantity to continue.
            </p>
          </div>
          <div className="ticket-type-list">
            {ticketTypes.length === 0 ? (
              <div className="tm-empty" style={{ padding: 20 }}>
                <span className="tm-empty-icon">🎟️</span>
                <h3>No tickets yet</h3>
                <p>Tickets are not available for this event yet.</p>
              </div>
            ) : (
              ticketTypes.map((ticketType) => {
                const available = remainingFor(ticketType);
                const disabled =
                  ticketType.is_active === false || available <= 0;
                const selected = selectedTicketType?.id === ticketType.id;
                return (
                  <button
                    type="button"
                    key={ticketType.id}
                    className={`ticket-type-card${selected ? " is-selected" : ""}`}
                    disabled={disabled}
                    onClick={() => selectTicketType(ticketType)}
                  >
                    <div className="ticket-type-top">
                      <div>
                        <strong>{ticketType.name}</strong>
                        <p className="ticket-desc">
                          {ticketType.description || "General admission ticket"}
                        </p>
                      </div>
                      <div className="ticket-price">
                        {formatPrice(ticketType.price, ticketType.currency)}
                      </div>
                    </div>
                    <div className="ticket-meta">
                      <span>
                        {available > 0 ? `${available} remaining` : "Sold out"}
                      </span>
                      <span>Max {ticketType.max_per_order || 1}/order</span>
                      <span>
                        {ticketType.is_active === false
                          ? "Inactive"
                          : "Available"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedTicketType ? (
            <div className="qty-row">
              <strong>Quantity</strong>
              <div className="qty-controls">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <strong>{quantity}</strong>
                <button
                  className="qty-btn"
                  disabled={quantity >= maxPerOrder}
                  onClick={() =>
                    setQuantity((q) => Math.min(maxPerOrder, q + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>
          ) : null}

          <BookingSummary />
        </aside>
      </div>

      <div className="mobile-booking-bar">
        <div>
          <strong>
            {selectedTicketType
              ? formatPrice(total, currency)
              : "Select tickets"}
          </strong>
          <p className="tm-muted" style={{ margin: 0, fontSize: 12 }}>
            {selectedTicketType
              ? `${quantity} × ${selectedTicketType.name}`
              : "No ticket selected"}
          </p>
        </div>
        <button
          className="tm-btn"
          disabled={bookingDisabled}
          onClick={handleBook}
        >
          {booking ? "…" : "Book"}
        </button>
      </div>
    </div>
  );
}
