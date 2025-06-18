import { useEffect, useState } from "react";

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  parent?: Category;
}

export default function useCategories(): {
  categories: Category[];
  loading: boolean;
  error: Error | null;
} {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/shop/categories", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer <token ở đây>",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi khi fetch danh mục");
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { categories, loading, error }; // Thêm error vào đây
}
