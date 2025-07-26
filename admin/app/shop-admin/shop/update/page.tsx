"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie"
import axios from "axios"
import { Camera, Store, Mail, Phone, FileText, Settings, CheckCircle, XCircle, Upload } from "lucide-react"

interface Shop {
    id: number
    name: string
    description: string
    logo: string
    phone: string
    email: string
    status: string
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
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [popupMessage, setPopupMessage] = useState("")
    const [popupType, setPopupType] = useState<"success" | "error">("success")
    const [showPopup, setShowPopup] = useState(false)
    const [imageArray, setImageArray] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const token = Cookies.get("authToken")
        if (!token) return
        axios
            .get(`${API_BASE_URL}/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                const logoUrl = `${STATIC_BASE_URL}/${res.data.shop.logo}`
                setShop(res.data.shop)
                setImagePreview(logoUrl)
                setLoading(false)
            })
            .catch((err) => {
                setError("Không thể lấy thông tin cửa hàng.")
                setLoading(false)
            })
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setShop((prevShop) => ({
            ...prevShop,
            [name]: value,
        }))
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target
        setShop((prevShop) => ({
            ...prevShop,
            [name]: value,
        }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            const fileArray = Array.from(files).map((file) => URL.createObjectURL(file))
            setImageArray(fileArray)
            setImagePreview(fileArray[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!shop.email.includes("@")) {
            setPopupMessage("Email không hợp lệ.")
            setPopupType("error")
            setShowPopup(true)
            setTimeout(() => setShowPopup(false), 3000)
            return
        }

        const token = Cookies.get("authToken")
        if (!token) {
            setPopupMessage("Bạn chưa đăng nhập.")
            setPopupType("error")
            setShowPopup(true)
            setTimeout(() => setShowPopup(false), 3000)
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`${API_BASE_URL}/shop/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(shop),
            })
            const data = await response.json()
            if (response.ok) {
                setPopupMessage("Cập nhật cửa hàng thành công!")
                setPopupType("success")
            } else {
                setPopupMessage(`Lỗi: ${data.message}`)
                setPopupType("error")
            }
            setShowPopup(true)
            setTimeout(() => setShowPopup(false), 3000)
        } catch (error) {
            setPopupMessage("Có lỗi xảy ra khi gửi yêu cầu.")
            setPopupType("error")
            setShowPopup(true)
            setTimeout(() => setShowPopup(false), 3000)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db4444] mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải thông tin cửa hàng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#db4444] rounded-full mb-3">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Cập nhật cửa hàng</h1>
                    <p className="text-gray-600">Quản lý thông tin cửa hàng của bạn</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-400 mr-3" />
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success/Error Popup */}
                {showPopup && (
                    <div
                        className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ${showPopup ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                            }`}
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white ${popupType === "success" ? "bg-green-500" : "bg-red-500"
                                }`}
                        >
                            {popupType === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            <span className="font-medium">{popupMessage}</span>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Logo Section */}
                        <div className="mb-6">
                            <div className="flex items-center mb-4">
                                <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                <h2 className="text-lg font-semibold text-gray-900">Logo cửa hàng</h2>
                            </div>

                            <div className="flex justify-center">
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />

                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview || "/placeholder.svg"}
                                                alt="Logo cửa hàng"
                                                className="w-24 h-24 object-cover rounded-full border-3 border-gray-200 shadow-md transition-all duration-300 group-hover:border-[#db4444]"
                                            />
                                            <div className="absolute inset-0 w-24 h-24 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#db4444] rounded-full flex items-center justify-center shadow-md">
                                                <Upload className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 border-3 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center text-gray-500 group-hover:border-[#db4444] group-hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                                            <Camera className="w-6 h-6 mb-1 text-gray-400 group-hover:text-[#db4444]" />
                                            <span className="text-xs font-medium">Thêm logo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Fields Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Shop Name */}
                            <div className="lg:col-span-2">
                                <label className="flex items-center mb-2">
                                    <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                    <Store className="w-4 h-4 text-gray-600 mr-2" />
                                    <span className="text-base font-semibold text-gray-900">Tên cửa hàng</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={shop.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#db4444] focus:ring-2 focus:ring-[#db4444]/10 transition-all duration-300"
                                    placeholder="Nhập tên cửa hàng của bạn"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="flex items-center mb-2">
                                    <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                    <Phone className="w-4 h-4 text-gray-600 mr-2" />
                                    <span className="text-base font-semibold text-gray-900">Số điện thoại</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={shop.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#db4444] focus:ring-2 focus:ring-[#db4444]/10 transition-all duration-300"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center mb-2">
                                    <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                    <Mail className="w-4 h-4 text-gray-600 mr-2" />
                                    <span className="text-base font-semibold text-gray-900">Email</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={shop.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#db4444] focus:ring-2 focus:ring-[#db4444]/10 transition-all duration-300"
                                    placeholder="Nhập địa chỉ email"
                                />
                            </div>

                            {/* Description */}
                            <div className="lg:col-span-2">
                                <label className="flex items-center mb-2">
                                    <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                    <FileText className="w-4 h-4 text-gray-600 mr-2" />
                                    <span className="text-base font-semibold text-gray-900">Mô tả cửa hàng</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={shop.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={3}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#db4444] focus:ring-2 focus:ring-[#db4444]/10 transition-all duration-300 resize-none"
                                    placeholder="Mô tả về cửa hàng của bạn..."
                                />
                            </div>

                            {/* Status */}
                            {/* <div className="lg:col-span-2">
                                <label className="flex items-center mb-2">
                                    <div className="w-1 h-5 bg-[#db4444] rounded-full mr-3"></div>
                                    <Settings className="w-4 h-4 text-gray-600 mr-2" />
                                    <span className="text-base font-semibold text-gray-900">Trạng thái</span>
                                </label>
                                <select
                                    name="status"
                                    value={shop.status}
                                    onChange={handleSelectChange}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#db4444] focus:ring-2 focus:ring-[#db4444]/10 transition-all duration-300 bg-white"
                                >
                                    <option value="activated">🟢 Kích hoạt</option>
                                    <option value="deactivated">🔴 Chưa kích hoạt</option>
                                </select>
                            </div> */}
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-[#db4444] to-[#c73e3e] text-white font-semibold rounded-lg hover:from-[#c73e3e] hover:to-[#b83838] focus:outline-none focus:ring-4 focus:ring-[#db4444]/30 transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Đang cập nhật...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Cập nhật cửa hàng
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Cần hỗ trợ?{" "}
                        <a href="#" className="text-[#db4444] hover:underline font-medium">
                            Liên hệ với chúng tôi
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default UpdateShop
