import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./component/navbar";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";

function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <main className={user ? "page-content" : ""}>
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

          {/* Protected routes */}
          <Route
            path="/"
            element={!user ? <Navigate to="/login" replace /> : <HomePage />}
          />
          <Route
            path="/discover"
            element={
              !user ? <Navigate to="/login" replace /> : <DiscoverPage />
            }
          />
          <Route
            path="/tickets"
            element={
              !user ? <Navigate to="/login" replace /> : <MyTicketsPage />
            }
          />
          <Route
            path="/profile"
            element={!user ? <Navigate to="/login" replace /> : <ProfilePage />}
          />

          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
