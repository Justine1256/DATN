"use client";
import { Product } from "@/types/product";
import { useEffect, useState, useRef, useCallback } from "react";
import ProductCard from "./ProductCard";
import Image from "next/image";
export default function FlashSaleSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Pointer event handlers để hỗ trợ cả touch và mouse
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grabbing";
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = x - startX.current;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  }, []);

useEffect(() => {
  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/api/topdiscountedproducts");
      const data = await res.json();

      let products: Product[] = [];

      if (Array.isArray(data.products)) {
        products = data.products.map((p: any) => ({
          ...p,
          image: typeof p.image === "string" ? [p.image] : p.image,
        }));
      }

      setProducts(products);
    } catch (error) {
      console.error("Lỗi kết nối server:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  fetchProducts();
}, []);


  return (
    <section className="px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">🔥 Flash Sales</h2>
          <p className="text-sm text-gray-500">Sản phẩm ưu đãi tốt nhất hôm nay</p>
        </div>
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
          View All Products
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Đang tải sản phẩm...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">Không có sản phẩm flash sale nào.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-hidden cursor-grab select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <style jsx>{`
        .scroll-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scroll-hidden::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
