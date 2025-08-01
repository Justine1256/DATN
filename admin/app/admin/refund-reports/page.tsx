"use client"

import { useState, useEffect } from "react"
import {
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    User,
    Package,
    Search,
    RefreshCw,
    FileText,
    Clock,
    X,
    Store,
    Phone,
    Mail,
} from "lucide-react"

// Constants
const STATIC_BASE_URL = "https://api.marketo.info.vn/storage"

// Helper function to format image URLs
const formatImageUrl = (img: unknown): string => {
    if (Array.isArray(img)) img = img[0]
    if (typeof img !== "string" || !img.trim()) {
        return `${STATIC_BASE_URL}/products/default-product.png`
    }
    if (img.startsWith("http")) return img
    return img.startsWith("/") ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`
}

// Interface for list view (simplified)
interface RefundReportListItem {
    report_id: number
    order_id: number
    user: {
        id: number
        name: string
    }
    shop: {
        id: number
        name: string
    }
    reason: string
    status: "Pending" | "Resolved" | "Rejected"
    created_at: string
    product_image: string[] // Array of image paths for list view
}

// Interface for detail view (full data)
interface RefundReportDetail {
    report_id: number
    order_id: number
    user: {
        id: number
        name: string
        email: string
        phone: string
        avatar: string
    }
    shop: {
        id: number
        name: string
        email: string
        logo: string | null
    }
    report_reason: string
    photos: string[]
    product_images: Array<{
        product_id: number
        product_name: string
        image: string[]
    }>
    created_at: string
    status: "Pending" | "Resolved" | "Rejected"
    admin_note?: string
    processed_at?: string
    processed_by?: number
}

export default function RefundReportsPage() {
    // Thay thế các state hiện tại bằng:
    const [allReports, setAllReports] = useState<RefundReportListItem[]>([])
    const [pendingReports, setPendingReports] = useState<RefundReportListItem[]>([])
    const [resolvedReports, setResolvedReports] = useState<RefundReportListItem[]>([])
    const [currentReports, setCurrentReports] = useState<RefundReportListItem[]>([])
    const [selectedReport, setSelectedReport] = useState<RefundReportDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [showDetailModal, setShowDetailModal] = useState(false)

    // Notification system
    const [showPopup, setShowPopup] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [popupType, setPopupType] = useState<"success" | "error" | "warning">("success")

    // Thêm state cho rejection modal:
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [rejectionNote, setRejectionNote] = useState("")
    const [selectedOrderForReject, setSelectedOrderForReject] = useState<number | null>(null)

    // Show notification
    const showNotification = (message: string, type: "success" | "error" | "warning" = "success") => {
        setPopupMessage(message)
        setPopupType(type)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 4000)
    }

    // Cập nhật hàm fetchRefundReports để phân chia data:
    const fetchRefundReports = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1]

            if (!token) {
                throw new Error("Không tìm thấy token xác thực")
            }

            const response = await fetch("https://api.marketo.info.vn/api/admin/orders/refund-reports", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                // Add timeout
                signal: AbortSignal.timeout(30000), // 30 second timeout
            })


            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText || "Lỗi từ server"}`)
            }

            const result = await response.json()

            const reports = result.data || []

            // Phân chia data theo trạng thái (chỉ còn 2 trạng thái)
            const pending = reports.filter((r: RefundReportListItem) => r.status === "Pending")
            const resolved = reports.filter((r: RefundReportListItem) => r.status === "Resolved")

            setAllReports(reports)
            setPendingReports(pending)
            setResolvedReports(resolved)

            // Set current reports based on active filter
            if (statusFilter === "all") setCurrentReports(reports)
            else if (statusFilter === "Pending") setCurrentReports(pending)
            else if (statusFilter === "Resolved") setCurrentReports(resolved)

            showNotification("Đã tải dữ liệu thành công!", "success")
        } catch (err) {

            let errorMessage = "Có lỗi xảy ra khi tải dữ liệu"

            if (err instanceof Error) {
                if (err.name === "AbortError") {
                    errorMessage = "Yêu cầu bị timeout, vui lòng thử lại"
                } else if (err.message.includes("Failed to fetch")) {
                    errorMessage = "Không thể kết nối đến server, kiểm tra kết nối mạng"
                } else {
                    errorMessage = err.message
                }
            }

            setError(errorMessage)
            showNotification(errorMessage, "error")
        } finally {
            setLoading(false)
        }
    }

    // Fetch refund report detail (full data)
    const fetchRefundReportDetail = async (orderId: number) => {
        try {
            setDetailLoading(true)

            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1]

            const response = await fetch(`https://api.marketo.info.vn/api/admin/orders/${orderId}/refund-report`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            // Handle both direct data and nested data structure
            const detailData = result.data || result
            setSelectedReport(detailData)
            setShowDetailModal(true)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải chi tiết"
            showNotification(errorMessage, "error")
        } finally {
            setDetailLoading(false)
        }
    }

    // Confirm reject refund report
    const confirmRejectRefundReport = async () => {
        if (!selectedOrderForReject || !rejectionReason.trim()) {
            showNotification("Vui lòng nhập lý do từ chối", "error")
            return
        }

        try {
            setActionLoading(true)

            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1]

            if (!token) {
                throw new Error("Không tìm thấy token xác thực")
            }


            const response = await fetch(
                `https://api.marketo.info.vn/api/admin/orders/${selectedOrderForReject}/refund-report/reject`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        rejection_reason: rejectionReason.trim(),
                        admin_note: rejectionNote.trim() || "Từ chối đơn khiếu nại",
                    }),
                    signal: AbortSignal.timeout(30000),
                },
            )


            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText || "Lỗi từ server"}`)
            }

            const data = await response.json()

            // Close modals and refresh data
            setShowRejectModal(false)
            setShowDetailModal(false)
            setSelectedReport(null)
            setSelectedOrderForReject(null)
            await fetchRefundReports()

            showNotification("Đã từ chối đơn khiếu nại!", "warning")
        } catch (err) {

            let errorMessage = "Có lỗi xảy ra khi từ chối đơn khiếu nại"

            if (err instanceof Error) {
                if (err.name === "AbortError") {
                    errorMessage = "Yêu cầu bị timeout, vui lòng thử lại"
                } else if (err.message.includes("Failed to fetch")) {
                    errorMessage = "Không thể kết nối đến server, kiểm tra kết nối mạng"
                } else {
                    errorMessage = err.message
                }
            }

            showNotification(errorMessage, "error")
        } finally {
            setActionLoading(false)
        }
    }

    // Approve refund report - Improved error handling
    const approveRefundReport = async (orderId: number) => {
        try {
            setActionLoading(true)

            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1]

            if (!token) {
                throw new Error("Không tìm thấy token xác thực")
            }


            const response = await fetch(`https://api.marketo.info.vn/api/admin/orders/${orderId}/refund-report/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    admin_note: "Đã duyệt đơn khiếu nại",
                }),
                // Add timeout and other options
                signal: AbortSignal.timeout(30000), // 30 second timeout
            })


            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText || "Lỗi từ server"}`)
            }

            const data = await response.json()


            // Refresh data
            await fetchRefundReports()
            setShowDetailModal(false)
            setSelectedReport(null)

            showNotification("Đã duyệt đơn khiếu nại thành công!", "success")
        } catch (err) {

            let errorMessage = "Có lỗi xảy ra khi duyệt đơn khiếu nại"

            if (err instanceof Error) {
                if (err.name === "AbortError") {
                    errorMessage = "Yêu cầu bị timeout, vui lòng thử lại"
                } else if (err.message.includes("Failed to fetch")) {
                    errorMessage = "Không thể kết nối đến server, kiểm tra kết nối mạng"
                } else {
                    errorMessage = err.message
                }
            }

            showNotification(errorMessage, "error")
        } finally {
            setActionLoading(false)
        }
    }

    useEffect(() => {
        fetchRefundReports()
    }, [])

    // Thêm hàm handleFilterChange:
    const handleFilterChange = (filter: string) => {
        setStatusFilter(filter)
        if (filter === "all") setCurrentReports(allReports)
        else if (filter === "Pending") setCurrentReports(pendingReports)
        else if (filter === "Resolved") setCurrentReports(resolvedReports)
    }

    // Cập nhật filteredReports để sử dụng currentReports:
    const filteredReports = currentReports.filter((report) => {
        const matchesSearch =
            report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.order_id.toString().includes(searchTerm) ||
            report.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    // Get first product image for list view
    const getFirstProductImage = (productImages: string[]) => {
        if (!productImages || productImages.length === 0) return null
        return formatImageUrl(productImages[0])
    }

    // Get product name from detail data
    const getProductName = (productImages: RefundReportDetail["product_images"]) => {
        if (!productImages || productImages.length === 0) return "Sản phẩm"
        return productImages[0]?.product_name || "Sản phẩm"
    }

    // Get all product images from detail data
    const getAllProductImages = (productImages: RefundReportDetail["product_images"]) => {
        if (!productImages || productImages.length === 0) return []
        return productImages[0]?.image || []
    }

    // Format avatar URL
    const formatAvatarUrl = (avatar: string | null) => {
        if (!avatar) return "/placeholder.svg?height=32&width=32"
        return formatImageUrl(avatar)
    }

    // Format logo URL
    const formatLogoUrl = (logo: string | null) => {
        if (!logo) return "/placeholder.svg?height=32&width=32"
        return formatImageUrl(logo)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ xử lý
                    </span>
                )
            case "Resolved":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã duyệt
                    </span>
                )
            case "Rejected":
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Đã từ chối
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        {status}
                    </span>
                )
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Cập nhật getFilterCounts:
    const getFilterCounts = () => {
        return {
            all: allReports.length,
            pending: pendingReports.length,
            resolved: resolvedReports.length,
        }
    }

    const filterCounts = getFilterCounts()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Compact Notification */}
            {showPopup && (
                <div
                    className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 ${popupType === "success"
                            ? "bg-green-500 text-white"
                            : popupType === "error"
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                        }`}
                >
                    {popupType === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : popupType === "error" ? (
                        <XCircle className="w-4 h-4" />
                    ) : (
                        <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{popupMessage}</span>
                    <button onClick={() => setShowPopup(false)} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-4">
                {/* Compact Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Khiếu Nại</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Xem và xử lý các đơn khiếu nại hoàn tiền một cách chuyên nghiệp
                        </p>
                    </div>
                    <button
                        onClick={fetchRefundReports}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Làm mới dữ liệu</span>
                    </button>
                </div>

                {/* Đồng bộ giao diện 3 tab (thay thế phần tab filters): */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-3">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => handleFilterChange("all")}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === "all" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600"
                                    }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Tất cả</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                                            }`}
                                    >
                                        {filterCounts.all}
                                    </span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleFilterChange("Pending")}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === "Pending" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600"
                                    }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Chờ xử lý</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === "Pending" ? "bg-white/20 text-white" : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {filterCounts.pending}
                                    </span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleFilterChange("Resolved")}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === "Resolved" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600"
                                    }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Đã duyệt</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === "Resolved" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                                            }`}
                                    >
                                        {filterCounts.resolved}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Compact Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo lý do khiếu nại, mã đơn hàng, tên khách hàng hoặc cửa hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compact Reports Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Sản phẩm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Cửa hàng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Lý do khiếu nại
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="h-12 w-12 text-gray-400 mb-3" />
                                                <h3 className="text-sm font-medium text-gray-600 mb-1">Không có đơn khiếu nại nào</h3>
                                                <p className="text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                                        {getFirstProductImage(report.product_image) ? (
                                                            <img
                                                                className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                                                src={getFirstProductImage(report.product_image)! || "/placeholder.svg"}
                                                                alt="Product"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                <Package className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900">#{report.order_id}</div>
                                                        <div className="text-xs text-gray-500">Đơn khiếu nại</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {report.user?.name || "N/A"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">ID: {report.user?.id || "N/A"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                            <Store className="h-4 w-4 text-purple-600" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {report.shop?.name || "N/A"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">ID: {report.shop?.id || "N/A"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                    {report.reason || "N/A"}
                                                </div>
                                            </td>
                                            {/* Fix cột trạng thái không rớt dòng: */}
                                            <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                    {formatDate(report.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => fetchRefundReportDetail(report.order_id)}
                                                    disabled={detailLoading}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Compact Detail Modal */}
                {showDetailModal && selectedReport && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-xl">
                                {/* Compact Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Chi Tiết Đơn Khiếu Nại</h3>
                                                <p className="text-blue-100 text-sm">Mã đơn hàng: #{selectedReport.order_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {getStatusBadge(selectedReport.status)}
                                            <button
                                                onClick={() => setShowDetailModal(false)}
                                                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Content */}
                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-6">
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            {/* Order Info */}
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <div className="flex items-center mb-3">
                                                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Thông Tin Đơn Hàng</h4>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                                        <span className="font-medium">#{selectedReport.order_id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Sản phẩm:</span>
                                                        <span className="font-medium truncate max-w-32">
                                                            {getProductName(selectedReport.product_images)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Ngày tạo:</span>
                                                        <span className="font-medium">{formatDate(selectedReport.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                <div className="flex items-center mb-3">
                                                    <User className="h-5 w-5 text-green-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Thông Tin Khách Hàng</h4>
                                                </div>
                                                <div className="flex items-center mb-3">
                                                    <img
                                                        src={formatAvatarUrl(selectedReport.user?.avatar) || "/placeholder.svg"}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full border-2 border-green-200 mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{selectedReport.user?.name || "N/A"}</div>
                                                        <div className="text-xs text-gray-500">ID: {selectedReport.user?.id}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span className="truncate">{selectedReport.user?.email || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span>{selectedReport.user?.phone || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shop Info */}
                                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                                <div className="flex items-center mb-3">
                                                    <Store className="h-5 w-5 text-purple-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Thông Tin Cửa Hàng</h4>
                                                </div>
                                                <div className="flex items-center mb-3">
                                                    <img
                                                        src={formatLogoUrl(selectedReport.shop?.logo) || "/placeholder.svg"}
                                                        alt="Logo"
                                                        className="w-10 h-10 rounded-full border-2 border-purple-200 mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{selectedReport.shop?.name || "N/A"}</div>
                                                        <div className="text-xs text-gray-500">ID: {selectedReport.shop?.id}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span className="truncate">{selectedReport.shop?.email || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Complaint Details */}
                                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                            <div className="flex items-center mb-3">
                                                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                                                <h4 className="font-semibold text-gray-900">Chi Tiết Khiếu Nại</h4>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-orange-200">
                                                <div className="text-sm text-gray-600 mb-1">Lý do khiếu nại:</div>
                                                <p className="font-medium text-gray-900">{selectedReport.report_reason || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* Product Images */}
                                        {getAllProductImages(selectedReport.product_images).length > 0 && (
                                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                                <div className="flex items-center mb-3">
                                                    <Package className="h-5 w-5 text-indigo-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Hình Ảnh Sản Phẩm</h4>
                                                </div>
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                    {getAllProductImages(selectedReport.product_images).map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={formatImageUrl(image) || "/placeholder.svg"}
                                                            alt={`Product ${index + 1}`}
                                                            className="w-full h-20 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Evidence Photos */}
                                        {selectedReport.photos && selectedReport.photos.length > 0 && (
                                            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                                                <div className="flex items-center mb-3">
                                                    <FileText className="h-5 w-5 text-teal-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Ảnh Minh Chứng</h4>
                                                </div>
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                    {selectedReport.photos.map((photo, index) => (
                                                        <img
                                                            key={index}
                                                            src={formatImageUrl(photo) || "/placeholder.svg"}
                                                            alt={`Evidence ${index + 1}`}
                                                            className="w-full h-20 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Note */}
                                        {selectedReport.admin_note && (
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <div className="flex items-center mb-3">
                                                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                                                    <h4 className="font-semibold text-gray-900">Ghi Chú Admin</h4>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                    <p className="text-sm text-gray-900">{selectedReport.admin_note}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Compact Actions Footer */}
                                {selectedReport.status === "Pending" && (
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrderForReject(selectedReport.order_id)
                                                    setRejectionReason("")
                                                    setRejectionNote("")
                                                    setShowRejectModal(true)
                                                }}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Từ chối khiếu nại</span>
                                            </button>
                                            <button
                                                onClick={() => approveRefundReport(selectedReport.order_id)}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                            >
                                                {actionLoading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                <span>Duyệt khiếu nại</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Reason Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-70 overflow-y-auto">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <XCircle className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Từ Chối Khiếu Nại</h3>
                                                <p className="text-red-100 text-sm">Nhập lý do từ chối</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowRejectModal(false)}
                                            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lý do từ chối <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Nhập lý do từ chối đơn khiếu nại..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">{rejectionReason.length}/500 ký tự</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú admin (tùy chọn)</label>
                                        <textarea
                                            value={rejectionNote}
                                            onChange={(e) => setRejectionNote(e.target.value)}
                                            placeholder="Ghi chú thêm cho admin..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                            rows={3}
                                            maxLength={300}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">{rejectionNote.length}/300 ký tự</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setShowRejectModal(false)}
                                            disabled={actionLoading}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            onClick={confirmRejectRefundReport}
                                            disabled={actionLoading || !rejectionReason.trim()}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                        >
                                            {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            <span>Xác nhận từ chối</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
