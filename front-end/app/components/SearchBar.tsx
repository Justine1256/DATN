"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AiOutlineSearch } from "react-icons/ai";
import Image from "next/image";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

// Khai báo đúng theo dữ liệu API của bạn
interface Product {
    id: number;
    name: string;
    price: number;
    image: string[];
}

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    // Format ảnh (dành cho array image)
    const formatImageUrl = (img: string[] | null | undefined) => {
        if (Array.isArray(img) && img.length > 0) {
            const url = img[0];
            console.log("DEBUG formatImageUrl ARRAY:", url);
            return url.startsWith("http") ? url : `${STATIC_BASE_URL}/${url}`;
        }
        console.log("DEBUG formatImageUrl DEFAULT");
        return `${STATIC_BASE_URL}/products/default-product.png`;
    };

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setResults([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            axios
                .get(`${API_BASE_URL}/search?query=${encodeURIComponent(searchQuery)}`)
                .then(res => {
                    console.log("DEBUG API RESPONSE:", res.data);
                    setResults(res.data);
                })
                .catch((err) => {
                    console.error("API ERROR:", err);
                    setResults([]);
                });
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleSelect = (id: number) => {
        router.push(`/product/${id}`);
        setShowDropdown(false);
        setSearchQuery("");
    };

    return (
        <div className="relative w-[240px]">
            <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 rounded border border-gray-300"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            <AiOutlineSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black cursor-pointer"
            />

            {showDropdown && results.length > 0 && (
                <div className="absolute mt-1 w-full bg-white shadow-lg rounded z-50 max-h-[300px] overflow-y-auto">
                    {results.map(product => {
                        console.log("DEBUG PRODUCT ITEM:", product);
                        return (
                            <div
                                key={product.id}
                                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelect(product.id)}
                            >
                                <Image
                                    src={formatImageUrl(product.image)}
                                    alt={product.name}
                                    width={36}
                                    height={36}
                                    className="rounded object-cover"
                                />
                                <div className="ml-3">
                                    <div className="text-sm font-medium">{product.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {Number(product.price).toLocaleString('vi-VN')} VND
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showDropdown && searchQuery.trim() !== "" && results.length === 0 && (
                <div className="absolute mt-1 w-full bg-white shadow-lg rounded z-50 p-3 text-sm text-gray-500">
                    Không tìm thấy kết quả.
                </div>
            )}
        </div>
    );
}
