import { createContext, useContext, useState } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

const initUser = () => {
  try {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) return JSON.parse(stored);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initUser);

  // Persist auth state from a successful auth response
  const _setSession = (user, accessToken, refreshToken) => {
    setUser(user);
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    // Backend: { success, message, data: { user, accessToken, refreshToken } }
    const { user, accessToken, refreshToken } = res.data.data;
    _setSession(user, accessToken, refreshToken);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    // Register also returns tokens directly (201 Created)
    const { user, accessToken, refreshToken } = res.data.data;
    _setSession(user, accessToken, refreshToken);
    return res.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch {
      // Always clear local state even if the server call fails
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
