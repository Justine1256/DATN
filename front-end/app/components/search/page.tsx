'use client';

import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/utils/api';
import ProductCard, { Product } from '../product/ProductCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query) return;
    axios
      .get(`${API_BASE_URL}/search`, { params: { query } })
      .then((res) => {
        console.log("🎯 Kết quả tìm kiếm:", res.data); // 🟢 Thêm dòng này
        setResults(res.data);
      })
      .catch((err) => console.error('Search error:', err));
  }, [query]);


  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">
        Kết quả cho: <span className="text-red-500">"{query}"</span>
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {results.length > 0 ? (
          results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full">Không tìm thấy sản phẩm nào.</p>
        )}
      </div>
    </div>
  );
}
