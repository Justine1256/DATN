"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const notifications = [
    {
        id: 1,
        image: "/images/sale-banner.jpg",
        title: "Flash Sale 50% 🎉",
        description: "Chỉ trong hôm nay, giảm 50% toàn bộ sản phẩm đồ bơi!",
    },
    {
        id: 2,
        image: "/images/new-arrivals.jpg",
        title: "Hàng mới về 👕",
        description: "Bộ sưu tập hè 2025 đã sẵn sàng, khám phá ngay!",
    },
];

export default function HeaderNotice() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative ml-3 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#DB4444] text-white text-sm px-3 py-1.5 rounded-md hover:opacity-90 transition duration-300"
            >
                Thông Báo
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="absolute right-0 mt-2 w-[300px] bg-white rounded-lg shadow-xl border border-gray-200"
                    >
                        <ul className="divide-y divide-gray-100">
                            {notifications.map((note) => (
                                <li key={note.id} className="flex gap-3 p-3 hover:bg-gray-100 transition">
                                    <div className="w-[56px] h-[56px] flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                        <Image
                                            src={note.image}
                                            alt={note.title}
                                            width={56}
                                            height={56}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-black">{note.title}</h4>
                                        <p className="text-xs text-gray-600">{note.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
