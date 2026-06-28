import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const initUser = () => {
  try {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) return JSON.parse(stored);
  } catch {
    clearSession();
  }
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initUser);
  const [hydrating, setHydrating] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHydrating(false);
      return;
    }

    authAPI
      .getProfile()
      .then((res) => {
        const profile = res.data.data?.user || res.data.user;
        if (profile) {
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setHydrating(false));
  }, []);

  const _setSession = (user, accessToken, refreshToken) => {
    setUser(user);
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { user, accessToken, refreshToken } = res.data.data;
    _setSession(user, accessToken, refreshToken);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    const { user, accessToken, refreshToken } = res.data.data;
    _setSession(user, accessToken, refreshToken);
    return res.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch {
      /* always clear local state */
    } finally {
      setUser(null);
      clearSession();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, hydrating, login, register, logout, updateUser }}>
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
