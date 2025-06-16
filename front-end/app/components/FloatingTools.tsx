'use client';

import { useState } from 'react';
import { FaRobot, FaRegCommentDots } from 'react-icons/fa';
import Image from 'next/image';

export default function FloatingTools() {
    const [showList, setShowList] = useState(false);
    const [activeChat, setActiveChat] = useState(false);

    const mockData = {
        user: 'Nguyễn Văn Nhật',
        suggestions: [
            {
                id: 1,
                title: 'Sách Kỹ Năng Giao Tiếp Và Quy Tắc Ứng Xử - Tuyển Chọn',
                store: 'Nhà sách Nam Việt',
                image: '/book.png',
                price: '395.000 đ',
                messages: [
                    { from: 'shop', text: 'Bạn cần tư vấn gì không?' },
                    { from: 'user', text: 'Có mã giảm giá nào không?' },
                    { from: 'shop', text: 'Dạ, mã FREESHIP50K áp dụng đơn từ 100K ạ' },
                ],
            },
        ],
    };

    return (
        <>
            {/* Nút nổi cố định */}
            <div className="fixed right-4 bottom-6 z-[9999] flex flex-col items-center">
                <div className="bg-[#db4444] text-white rounded-[1rem] overflow-hidden w-14">
                    <button
                        onClick={() => {
                            setShowList(false);
                            setActiveChat(false);
                        }}
                        className="flex flex-col items-center justify-center h-16 hover:bg-[#db4444] hover:bg-[#c93333] transition w-full"
                    >
                        <FaRobot size={18} />
                        <span className="text-xs mt-1">Trợ lý</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowList(!showList);
                            setActiveChat(false);
                        }}
                        className="flex flex-col items-center justify-center h-16 bg-[#db4444] hover:bg-[#c93333] transition w-full"
                    >
                        <FaRegCommentDots size={18} />
                        <span className="text-xs mt-1">Tin mới</span>
                    </button>
                </div>
            </div>

            {/* Box danh sách + chat */}
            {showList && (
                <div className="fixed bottom-6 right-[80px] z-[9998] flex shadow-xl rounded-xl overflow-hidden">

                    {/* Cột trái luôn hiển thị */}
                    <div className="bg-white border-r flex flex-col text-black w-[320px] h-[580px]">
                        {/* ✅ Tiêu đề trái: luôn hiển thị tên + dấu × khi bảng phải không bật */}
                        <div className="w-full px-4 h-[70px] border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-200 text-green-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">VN</div>
                                <span className="font-semibold text-sm text-black">{mockData.user}</span>
                            </div>
                            {/* Ẩn nút × khi bảng phải bật */}
                            {!activeChat && (
                                <button
                                    onClick={() => {
                                        setShowList(false);
                                        setActiveChat(false);
                                    }}
                                    className="text-gray-500 hover:text-[#db4444] text-[26px] font-bold"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Thanh tìm kiếm */}
                        <div className="p-3 border-b ">
                            <input
                                type="text"
                                placeholder="Tìm theo người dùng..."
                                className="w-full px-3 py-3 text-sm border rounded bg-gray-50 focus:outline-none text-black"
                            />
                        </div>

                        {/* Danh sách gợi ý */}
                        <div className="px-4 py-2 text-sm font-semibold text-gray-700">Có thể bạn quan tâm</div>
                        <div className="flex gap-2 px-4 py-3 items-center bg-blue-50 cursor-pointer">
                            <Image src={mockData.suggestions[0].image} alt="book" width={40} height={40} className="rounded" />
                            <div className="flex-1 text-sm text-black">
                                <div className="font-semibold truncate max-w-[140px]">{mockData.suggestions[0].title}</div>
                                <div className="text-gray-500 text-xs truncate">{mockData.suggestions[0].store}</div>
                            </div>
                            <button
                                onClick={() => setActiveChat(true)}
                                className="text-[#db4444] border border-[#db4444] text-xs px-3 py-1 rounded hover:bg-[#db4444] hover:text-white transition"
                            >
                                Chat ngay
                            </button>
                        </div>
                    </div>

                    {/* Cột phải: khung chat */}
                    {activeChat && (
                        <div className="w-[420px] bg-white flex flex-col text-black h-[580px]">
                            {/* Header phải chỉ chứa nút × */}
                            <div className="flex items-center justify-end px-4 h-[70px] bg-white w-full border-b border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowList(false);
                                        setActiveChat(false);
                                    }}
                                    className="text-gray-500 hover:text-[#db4444] text-2xl font-bold"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Thông tin shop */}
                            <div className="flex items-center gap-2 px-4 py-[14px] border-b border-gray-200">
                                <Image src={mockData.suggestions[0].image} alt="chat" width={40} height={40} className="rounded" />
                                <div>
                                    <div className="font-semibold text-sm">{mockData.suggestions[0].store}</div>
                                    <div className="text-xs text-gray-500">{mockData.suggestions[0].price}</div>
                                </div>
                            </div>

                            {/* Nội dung chat */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
                                {mockData.suggestions[0].messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`px-3 py-2 rounded max-w-[75%] ${msg.from === 'user' ? 'ml-auto bg-gray-100' : 'mr-auto bg-gray-50'}`}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                            </div>

                            {/* Ô nhập tin nhắn */}
                            <div className="border-t p-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Nhập nội dung chat..."
                                    className="flex-1 border rounded px-3 py-2 text-sm outline-none"
                                />
                                <button className="bg-[#db4444] hover:bg-red-600 text-white px-4 py-2 rounded text-sm">Gửi</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
