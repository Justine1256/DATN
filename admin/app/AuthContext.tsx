"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

interface AuthContextType {
  user: any | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthReady: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      Cookies.set("authToken", tokenFromUrl, { expires: 7 });
      params.delete("token");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }

    const token = tokenFromUrl || Cookies.get("authToken");

    if (token) {
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data;
          if (!["seller", "admin"].includes(user.role)) {
            console.warn("Vai trò không hợp lệ:", user.role);
            redirectToLogin();
          } else {
            setUser(user);
            setIsAuthReady(true);
          }
        })
        .catch((err) => {
          console.error("Xác thực thất bại:", err);
          redirectToLogin();
        });
    } else {
      redirectToLogin();
    }

    function redirectToLogin() {
      setIsAuthReady(true); // để tránh treo UI
      window.location.href = "http://localhost:3000/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}
