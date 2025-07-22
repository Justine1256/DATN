'use client'
import Link from "next/link";
import Image from "next/image";
import { STATIC_BASE_URL } from "@/utils/api";

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
    } | null;
}

interface Props {
    cartItems: CartItem[];
    formatImageUrl: (img: string | string[]) => string;
}

export default function CartDropdown({ cartItems, formatImageUrl }: Props) {
    return (
        <div className="relative group cursor-pointer">
            <div className="relative w-5 h-5">
                <svg className="w-5 h-5 text-black hover:text-red-500 transition" fill="none" stroke="currentColor" strokeWidth="2"
                    viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M16 17a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
                {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {cartItems.length}
                    </span>
                )}
            </div>

            <div className="absolute top-full right-0 mt-4 w-[360px] bg-white border border-gray-200 shadow-xl rounded-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-300 z-50">

                <div className="p-3 border-b text-base font-semibold">Sản Phẩm Mới Thêm</div>
                <ul className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                    {cartItems.map((item, index) => {

                        const price = item.product.sale_price ?? item.product.price;
                        return (
                            <li
                                key={`${item.product.id}-${item.variant?.id ?? 'no-variant'}-${index}`}
                                className="flex items-center p-3 hover:bg-gray-100 transition"
                            >
                                <div className="w-[48px] h-[48px] flex-shrink-0 overflow-hidden rounded border">
                                    <Image
                                        src={formatImageUrl(item.product.image)}
                                        alt={item.product.name}
                                        width={48}
                                        height={48}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="ml-3 flex-1">
                                    <div className="text-sm font-medium line-clamp-1">{item.product.name}</div>
                                    <div className="text-sm text-red-500">
                                        {Number(price).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                    {cartItems.length === 0 && (
                        <li className="p-3 text-center text-gray-500">Giỏ hàng trống.</li>
                    )}
                </ul>

                <div className="p-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-700">{cartItems.length} sản phẩm</span>
                    <Link href="/cart" className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600 transition">
                        Xem Giỏ Hàng
                    </Link>
                </div>
            </div>
        </div>
    );
}
