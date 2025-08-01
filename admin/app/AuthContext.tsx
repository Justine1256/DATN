
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
    const token = Cookies.get("authToken");

    if (token) {
      axios
        .get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          setUser(null); // Có thể giữ user null để hiển thị UI riêng cho user chưa login
        })
        .finally(() => {
          setIsAuthReady(true);
        });
    } else {
      // Không có token vẫn đánh dấu isAuthReady để không chặn UI
      setIsAuthReady(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}

