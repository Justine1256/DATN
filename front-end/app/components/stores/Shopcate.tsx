'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface ShopCateProps {
    categories: Category[];
    selectedCategory: string | null;
    handleCategorySelect: (categorySlug: string | null) => void;
}

const ShopCate: React.FC<ShopCateProps> = ({ categories, selectedCategory, handleCategorySelect }) => {
    const router = useRouter();

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-semibold text-brand">Danh mục sản phẩm</h2>
            <div className="space-y-2">
                <button
                    onClick={() => handleCategorySelect(null)}
                    className={`w-full text-left px-4 py-2 rounded transition-colors
            ${!selectedCategory ? "text-brand font-semibold" : "text-black hover:text-brand"}`}
                >
                    Tất Cả Sản Phẩm
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`w-full text-left px-4 py-2 rounded transition-colors
              ${cat.slug === selectedCategory ? "text-brand font-semibold" : "text-black hover:text-brand"}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ShopCate;
