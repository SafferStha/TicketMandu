import { createContext, useContext, useState } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

// Lazy initializer — reads from localStorage synchronously on first render.
// This avoids a useEffect + setState pattern that the React Compiler flags.
const initUser = () => {
  try {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) return JSON.parse(stored);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initUser);

  const login = async (email, password) => {
    const { data } = await authAPI.login(email, password);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  };

  const register = async (name, email, password) => {
    await authAPI.register(name, email, password);
    return login(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
