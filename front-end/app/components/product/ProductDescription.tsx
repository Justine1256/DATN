'use client';

import React from 'react';

interface ProductDescriptionProps {
    html?: string;
    specs?: { label: string; value: string | React.ReactNode }[];
}

export default function ProductDescription({ html, specs }: ProductDescriptionProps) {
    const shouldRenderHTML = html && html.trim().length > 0;

    // Hàm để chuyển đổi hashtag thành thẻ a có thể click được
<<<<<<< HEAD

=======
    const renderHashtags = (text: string) => {
        const regex = /#\w+/g; // Tìm tất cả các hashtag bắt đầu với #
        return text.split(' ').map((word, idx) => {
            if (word.match(regex)) {
                return (
                    <a
                        key={idx}
                        href={`#${word}`}
                        className="text-red-500 hover:text-red-700 mx-1 cursor-pointer underline" // Thêm class underline cho gạch chân
                    >
                        {word}
                    </a>
                );
            }
            return `${word} `;
        });
    };
    
>>>>>>> 24914919eb516f8f5139daf5abd96f18223d7bc7

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 mt-20">
            <div className="mb-4 pb-2 flex items-center">
                {/* Thêm hình vuông màu đỏ */}
                <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm mr-2" />
                <p className="font-medium text-brand">Chi tiết sản phẩm </p>
            </div>

            {/* ✅ Bảng chi tiết sản phẩm */}
            <div className="">
                {specs && specs.length > 0 && (
                    <div className="space-y-2">

                        <h3 className="text-lg font-semibold mb-2">Chi tiết sản phẩm</h3>
                        {specs.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-md"
                            >
                                <span className="min-w-[120px] font-medium">{item.label}:</span>
                                <span className="">{item.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✅ Mô tả sản phẩm */}
                {shouldRenderHTML && (
                    <div>
                        <article
                            className=" leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
