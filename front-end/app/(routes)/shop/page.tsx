"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShopTable from "@/app/components/shop/ShopTable";
import { API_BASE_URL } from "@/utils/api";

export default function ShopListPage() {
    const [shops, setShops] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/shops`)
            .then((res) => res.json())
            .then((data) => setShops(data))
            .catch(console.error);
    }, []);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-[#db4444]">Danh sách Shop</h1>
            <ShopTable shops={shops} />
            <div className="mt-6 text-right">
                <Link href="/shop/register">
                    <button className="bg-[#db4444] text-white px-4 py-2 rounded hover:bg-[#c23333]">
                        + Đăng ký Shop mới
                    </button>
                </Link>
            </div>
        </div>
    );
}
