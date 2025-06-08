'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductCard, { Product } from '@/app/components/product/ProductCard';
import LandingSlider from '@/app/components/home/LandingSlider';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/category')
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!slug) return;

    fetch(`http://127.0.0.1:8000/api/category/${slug}/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data.products)) throw new Error('products is not an array');
        setProducts(data.products);
        setCategory(data.category);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleCategoryClick = (slug: string) => {
    router.push(`/category/${slug}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-10 text-black">
      <LandingSlider />

      <div className="grid grid-cols-12 gap-3 mt-10">
        {/* Sidebar danh mục */}
        <aside className="col-span-2 border-r pr-3">
          <h2 className="text-h3 font-semibold mb-4">Tất Cả Danh Mục</h2>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`cursor-pointer hover:text-brand transition ${cat.slug === slug ? 'text-brand font-semibold' : ''}`}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* Danh sách sản phẩm */}
        <section className="col-span-10">
          {/* Bộ lọc sắp xếp */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm-detail text-gray-700">Sắp xếp theo</span>
            <button className="bg-brand text-white px-3 py-1 rounded text-sm-detail">Phổ Biến</button>
            <button className="bg-white border px-3 py-1 rounded text-sm-detail">Mới Nhất</button>
            <button className="bg-white border px-3 py-1 rounded text-sm-detail">Bán Chạy</button>
            <select className="border text-sm-detail px-2 py-1 rounded">
              <option>Giá</option>
              <option>Giá: thấp đến cao</option>
              <option>Giá: cao đến thấp</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">Không có sản phẩm nào.</p>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Phân trang */}
          <div className="flex justify-center mt-10 gap-2">
            <button className="px-3 py-1 border rounded">1</button>
            <button className="px-3 py-1 border rounded">2</button>
            <button className="px-3 py-1 border rounded">3</button>
            <span className="px-2">...</span>
            <button className="px-3 py-1 border rounded">8</button>
          </div>
        </section>
      </div>
    </div>
  );
}