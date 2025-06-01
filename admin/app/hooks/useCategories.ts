// hooks/useCategories.ts
import { useEffect, useState } from "react";

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  // Các trường khác nếu có
}

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
}

export default function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken") || "";

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập.");
      }

      const res = await fetch("http://127.0.0.1:8000/api/shop/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lỗi khi fetch categories: ${text}`);
      }

      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  fetchCategories();
}, []);


  return { categories, loading, error };
}
