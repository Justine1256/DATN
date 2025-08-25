'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import CartDropdown from './CartDropdown';

interface CartItem {
    product: {
        id: number;
        name: string;
        image: string[] | string;
        price: number;
        sale_price?: number | null;
    };
    variant?: {
        id: number;
        price: number;
        sale_price?: number | null;
    } | null;
}

interface Props {
    cartItems: CartItem[];
    formatImageUrl: (img: string | string[]) => string;
}

function getPrice(item: CartItem) {
    let price = item.product.price;
    if (item.variant) {
        price = (item.variant.sale_price ?? item.variant.price) ?? price;
    } else if (item.product.sale_price) {
        price = item.product.sale_price;
    }
    return Number(price);
}

export default function CartDropdownResponsive({ cartItems, formatImageUrl }: Props) {
    const [openMobile, setOpenMobile] = useState(false);

    useEffect(() => {
        console.log("CartDropdownResponsive cartItems:", cartItems);
    }, [cartItems]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenMobile(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const count = cartItems.length;

    // Drawer JSX
    const drawer = openMobile && (
        <div className="fixed inset-0 z-[2147483647]">
            {/* Overlay */}
            <button
                className="absolute inset-0 bg-black/40"
                aria-label="Đóng giỏ hàng"
                onClick={() => setOpenMobile(false)}
            />

            {/* Drawer */}
            <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col animate-slideIn">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-semibold">Giỏ hàng ({count})</div>
                    <button onClick={() => setOpenMobile(false)} className="p-2 rounded hover:bg-gray-100">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="flex-1 overflow-y-auto">
                    {cartItems.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Giỏ hàng trống.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {cartItems.map((item, i) => {
                                const price = getPrice(item);
                                return (
                                    <li key={`${item.product.id}-${item.variant?.id ?? 'no-variant'}-${i}`} className="flex items-center p-4">
                                        <div className="w-[56px] h-[56px] flex-shrink-0 overflow-hidden rounded border">
                                            <Image
                                                src={formatImageUrl(item.product.image)}
                                                alt={item.product.name}
                                                width={56}
                                                height={56}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="text-sm font-medium line-clamp-2">{item.product.name}</div>
                                            <div className="mt-1 text-base font-semibold text-red-600">
                                                {price.toLocaleString('vi-VN')}đ
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4">
                    <Link
                        href="/cart"
                        onClick={() => setOpenMobile(false)}
                        className="block w-full text-center bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition"
                    >
                        Xem Giỏ Hàng
                    </Link>
                </div>
            </div>

            <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0%);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
        </div>
    );

    return (
        <>
            {/* Desktop giữ nguyên */}
            <div className="hidden md:block">
                <CartDropdown cartItems={cartItems} formatImageUrl={formatImageUrl} />
            </div>

            {/* Mobile */}
            <div className="md:hidden relative">
                <button
                    type="button"
                    onClick={() => setOpenMobile(true)}
                    aria-label="Giỏ hàng"
                    className="relative w-5 h-5"
                >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M16 17a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {count > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                            {count}
                        </span>
                    )}
                </button>
            </div>

            {/* Render drawer ra ngoài body */}
            {typeof window !== 'undefined' &&
                ReactDOM.createPortal(drawer, document.body)}
        </>
    );
}
