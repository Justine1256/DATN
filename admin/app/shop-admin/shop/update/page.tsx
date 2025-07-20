"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"; // API Base URL của bạn
import Cookies from "js-cookie";
import axios from "axios";

interface Shop {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    email: string;
    status: string;
}

const UpdateShop = () => {
    const [shop, setShop] = useState<Shop>({
        id: 0,
        name: "",
        description: "",
        logo: "",
        phone: "",
        email: "",
        status: "activated",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<"success" | "error">("success");
    const [showPopup, setShowPopup] = useState(false);
    const [imageArray, setImageArray] = useState<string[]>([]); // Mảng ảnh

    useEffect(() => {
        const token = Cookies.get("authToken");

        if (!token) return;

        axios
            .get(`${API_BASE_URL}/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                const logoUrl = `${STATIC_BASE_URL}/${res.data.shop.logo}`;
                setShop(res.data.shop);
                setImagePreview(logoUrl); // Cập nhật đường dẫn ảnh đầy đủ
                setLoading(false);
            })
            .catch((err) => {
                setError("Không thể lấy thông tin cửa hàng.");
                setLoading(false);
            });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShop((prevShop) => ({
            ...prevShop,
            [name]: value,
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShop((prevShop) => ({
            ...prevShop,
            [name]: value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files).map((file) => URL.createObjectURL(file));
            setImageArray(fileArray);
            setImagePreview(fileArray[0]); // Hiển thị ảnh đầu tiên
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shop.email.includes('@')) {
            setPopupMessage("Email không hợp lệ.");
            setPopupType("error");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/shop/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(shop),
            });

            const data = await response.json();
            if (response.ok) {
                setPopupMessage("Cập nhật cửa hàng thành công!");
                setPopupType("success");
            } else {
                setPopupMessage(`Lỗi: ${data.message}`);
                setPopupType("error");
            }
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
        } catch (error) {
            setPopupMessage("Có lỗi xảy ra khi gửi yêu cầu.");
            setPopupType("error");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-8">Cập nhật thông tin cửa hàng</h1>

            {/* Hiển thị thông báo lỗi nếu có */}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

            {/* Hiển thị popup thông báo */}
            {showPopup && (
                <div
                    className={`fixed top-6 right-6 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-in ${popupType === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                >
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={popupType === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                        />
                    </svg>
                    <span className="text-sm font-medium">{popupMessage}</span>
                </div>
            )}

            {/* Hiển thị thông tin cửa hàng */}
            {loading ? (
                <div className="text-gray-500">Đang tải thông tin cửa hàng...</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded shadow-lg">
                    {/* Logo với tiêu đề */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Logo cửa hàng
                        </label>

                        <div className="flex justify-center mb-6">
                            <div className="relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />

                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Logo cửa hàng"
                                            className="w-32 h-32 object-cover rounded-full border-2 border-[#db4444] transition-all duration-300"
                                        />
                                        <div className="absolute inset-0 w-32 h-32 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <svg
                                                className="w-8 h-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex justify-center items-center text-gray-500 group-hover:border-[#db4444] group-hover:bg-gray-50 transition-all duration-300">
                                            <div className="text-center">
                                                <svg
                                                    className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-[#db4444]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                    />
                                                </svg>
                                                <span className="text-xs">Thêm ảnh</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tên cửa hàng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Tên cửa hàng
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={shop.name}
                            onChange={handleInputChange} // Sử dụng handleInputChange
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={shop.description}
                            onChange={handleInputChange} // Sử dụng handleInputChange
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Số điện thoại
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={shop.phone}
                            onChange={handleInputChange} // Sử dụng handleInputChange
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={shop.email}
                            onChange={handleInputChange} // Sử dụng handleInputChange
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Trạng thái */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></span> Trạng thái
                        </label>
                        <select
                            name="status"
                            value={shop.status}
                            onChange={handleSelectChange} // Sử dụng handleSelectChange
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="activated">Kích hoạt</option>
                            <option value="deactivated">Chưa kích hoạt</option>
                        </select>
                    </div>

                    {/* Nút submit */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-[#db4444] text-white rounded-md hover:bg-[#d33f40] transition"
                    >
                        Cập nhật cửa hàng
                    </button>
                </form>
            )}
        </div>
    );
};

export default UpdateShop;
