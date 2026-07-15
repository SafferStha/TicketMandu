import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./component/navbar";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import FavoritesPage from "./pages/FavoritesPage";
import NotificationsPage from "./pages/NotificationsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventDetailPage from "./pages/EventDetailPage";
import RoleDashboardPage from "./pages/RoleDashboardPage";
import ManagementPage from "./pages/ManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import { getHomeRoute } from "./utils/routes";
import "./App.css";

function AppLayout() {
  const { user, hydrating } = useAuth();

  if (hydrating) {
    return (
      <div
        className="app-layout"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#9e9e9e" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {user?.role === "user" && <Navbar />}
      <main className={user?.role === "user" ? "page-content" : ""}>
        <Routes>
          {/* Guest-only routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <RegisterPage />}
          />

          {/* Role-aware landing */}
          <Route
            path="/"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === "user" ? (
                <HomePage />
              ) : (
                <Navigate to={getHomeRoute(user.role)} replace />
              )
            }
          />

          {/* Customer routes */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <RoleDashboardPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/venues"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/organizers"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/event-images"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/ticket-types"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/seat-maps"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/seats"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleBasedRoute roles={["admin"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          {/* Organizer routes */}
          <Route
            path="/organizer"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <RoleDashboardPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/organizer/ticket-types"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/organizer/event-images"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/organizer/coupons"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/organizer/orders"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/organizer/tickets"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/organizer/analytics"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/organizer/profile"
            element={
              <RoleBasedRoute roles={["organizer"]}>
                <ManagementPage />
              </RoleBasedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={user ? getHomeRoute(user.role) : "/login"}
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <AppLayout />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
