'use client';

import React from 'react';

interface ProductDescriptionProps {
    html?: string;
    specs?: { label: string; value: string | React.ReactNode }[]; // Dữ liệu có thể chứa mọi giá trị
}

export default function ProductDescription({ html, specs }: ProductDescriptionProps) {
    const shouldRenderHTML = html && html.trim().length > 0;

    // Hàm để chuyển đổi hashtag thành thẻ a có thể click được
    const renderHashtags = (text: string) => {
        const regex = /#\w+/g; // Tìm tất cả các hashtag bắt đầu với #
        return text.split(' ').map((word, idx) => {
            if (word.match(regex)) {
                return (
                    <a
                        key={idx}
                        href={`#${word}`} // Bạn có thể thay đổi href để điều hướng đến các trang tương ứng
                        className="text-red-500 hover:text-red-700 mx-1 cursor-pointer" // Loại bỏ underline và thêm cursor-pointer để làm cho nó giống link
                    >
                        {word}
                    </a>
                );
            }
            return `${word} `; // Trả lại phần còn lại của từ không phải hashtag
        });
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 flex items-center">
                {/* Thêm hình vuông màu đỏ */}
                <div className="w-[10px] h-[22px] bg-brand rounded-tl-sm rounded-bl-sm mr-2" />
                Thông tin sản phẩm
            </h2>


            {/* ✅ Bảng chi tiết sản phẩm */}
            <div className="border border-gray-300 p-4 rounded-md mb-8">
                {specs && specs.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chi tiết sản phẩm</h3>
                        {specs.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-gray-100 px-4 py-3 rounded-md"
                            >
                                <span className="min-w-[120px] font-semibold text-gray-700">{item.label}:</span>
                                <span className="text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✅ Mô tả sản phẩm */}
                {shouldRenderHTML && (
                    <div className="mt-8">
                        
                        <article
                            className="prose prose-sm md:prose-base max-w-none text-gray-800 bg-white leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                )}
            </div>

            
        </div>
    );
}
