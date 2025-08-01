"use client"

import React from "react"

import type { ReactNode } from "react"
import Cookies from "js-cookie"
import { useState, useEffect } from "react"
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Percent,
  Tag,
  Gift,
  AlertTriangle,
  Shield,
  TrendingUp,
  Loader2,
  Activity,
} from "lucide-react"

// Type definitions based on API response
interface AdminDashboardData {
  total_users: number
  total_shops: number
  total_products: number
  total_orders: number
  total_revenue: string
  total_commission: number
  total_vouchers: number
  total_categories: number
  warning_users: number
  danger_users: number
  warning_shops: number
  danger_shops: number
}

// Custom CountUp Hook (reusing from previous dashboard)
function useCountUp(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = React.createRef<number>()
  const startTimeRef = React.createRef<number>()

  const startAnimation = () => {
    if (isAnimating) return

    setIsAnimating(true)
    startTimeRef.current = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || now)
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = start + (end - start) * easeOutQuart

      setCount(currentCount)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setCount(end)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return { count, startAnimation, isAnimating }
}

// CountUp Components
function CountUpNumber({
  end,
  duration = 2000,
  formatter,
  className = "",
}: {
  end: number
  duration?: number
  formatter?: (num: number) => string
  className?: string
}) {
  const { count, startAnimation } = useCountUp(end, duration)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!hasStarted) {
      const timer = setTimeout(() => {
        startAnimation()
        setHasStarted(true)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [hasStarted, startAnimation])

  const displayValue = formatter ? formatter(count) : Math.floor(count).toString()

  return <span className={className}>{displayValue}</span>
}

function CountUpCurrency({
  end,
  duration = 2500,
  className = "",
}: {
  end: string
  duration?: number
  className?: string
}) {
  const numericEnd = Number.parseFloat(end)

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  return <CountUpNumber end={numericEnd} duration={duration} formatter={formatCurrency} className={className} />
}

function CountUpRegular({
  end,
  duration = 2000,
  className = "",
}: {
  end: number
  duration?: number
  className?: string
}) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.floor(num))
  }

  return <CountUpNumber end={end} duration={duration} formatter={formatNumber} className={className} />
}

// Custom Card Components
function CustomCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
}

function CustomCardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
}

function CustomCardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

function CustomCardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

// Custom Badge Component
function CustomBadge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode
  variant?: "default" | "warning" | "danger" | "success"
  className?: string
}) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
  }

  return <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = Cookies.get("authToken")
        const response = await fetch("https://api.marketo.info.vn/api/admin/dashboard/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Đang tải dữ liệu...</h2>
              <p className="text-slate-500">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <CustomCard className="w-full max-w-md">
              <CustomCardHeader>
                <CustomCardTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Lỗi tải dữ liệu
                </CustomCardTitle>
              </CustomCardHeader>
              <CustomCardContent>
                <p className="text-slate-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </CustomCardContent>
            </CustomCard>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <CustomCard className="w-full max-w-md">
              <CustomCardContent className="text-center py-8">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 mb-2">Không có dữ liệu</h2>
                <p className="text-slate-500">Không thể tải dữ liệu dashboard</p>
              </CustomCardContent>
            </CustomCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin Tổng</h1>
            <p className="text-slate-600 mt-1">Tổng quan hệ thống MarketO</p>
          </div>
          <div className="flex items-center space-x-2">
            <CustomBadge variant="success" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Hệ thống hoạt động
            </CustomBadge>
            <CustomBadge variant="default" className="text-xs">
              Cập nhật: {new Date().toLocaleString("vi-VN")}
            </CustomBadge>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Người Dùng</h3>
              <Users className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-3xl font-bold">
              <CountUpRegular end={data.total_users} duration={2000} />
            </div>
            <div className="flex items-center mt-2 space-x-2">
              {data.warning_users > 0 && (
                <CustomBadge variant="warning" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {data.warning_users} cảnh báo
                </CustomBadge>
              )}
              {data.danger_users > 0 && (
                <CustomBadge variant="danger" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {data.danger_users} nguy hiểm
                </CustomBadge>
              )}
            </div>
          </div>

          {/* Total Shops */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Cửa Hàng</h3>
              <Store className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-3xl font-bold">
              <CountUpRegular end={data.total_shops} duration={2000} />
            </div>
            <div className="flex items-center mt-2 space-x-2">
              {data.warning_shops > 0 && (
                <CustomBadge variant="warning" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {data.warning_shops} cảnh báo
                </CustomBadge>
              )}
              {data.danger_shops > 0 && (
                <CustomBadge variant="danger" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {data.danger_shops} nguy hiểm
                </CustomBadge>
              )}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Doanh Thu</h3>
              <DollarSign className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-2xl font-bold">
              <CountUpCurrency end={data.total_revenue} duration={2500} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Từ {data.total_orders} đơn hàng
            </p>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Sản Phẩm</h3>
              <Package className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-3xl font-bold">
              <CountUpRegular end={data.total_products} duration={2000} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <Tag className="inline h-3 w-3 mr-1" />
              {data.total_categories} danh mục
            </p>
          </div>
        </div>

        {/* Secondary Metrics - Luxury Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Orders - Luxury */}
          <div className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium opacity-80">ORDERS</div>
                  <div className="w-8 h-1 bg-white/30 rounded-full mt-1"></div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                <CountUpRegular end={data.total_orders} duration={1800} />
              </div>
              <div className="flex items-center text-sm opacity-90">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Đơn hàng đã xử lý
              </div>
            </div>
          </div>

          {/* Total Commission - Luxury */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-14 translate-x-14"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Percent className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium opacity-80">COMMISSION</div>
                  <div className="w-8 h-1 bg-white/30 rounded-full mt-1"></div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                <CountUpRegular end={data.total_commission} duration={1500} />
              </div>
              <div className="flex items-center text-sm opacity-90">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                VNĐ hoa hồng
              </div>
            </div>
          </div>

          {/* Total Vouchers - Luxury */}
          <div className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 text-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-30 h-30 bg-white/10 rounded-full -translate-y-15 translate-x-15"></div>
            <div className="absolute bottom-0 left-0 w-22 h-22 bg-white/5 rounded-full translate-y-11 -translate-x-11"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium opacity-80">VOUCHERS</div>
                  <div className="w-8 h-1 bg-white/30 rounded-full mt-1"></div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                <CountUpRegular end={data.total_vouchers} duration={1600} />
              </div>
              <div className="flex items-center text-sm opacity-90">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
                Voucher đã tạo
              </div>
            </div>
          </div>

          {/* Total Categories - Luxury */}
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 text-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-26 h-26 bg-white/10 rounded-full -translate-y-13 translate-x-13"></div>
            <div className="absolute bottom-0 left-0 w-18 h-18 bg-white/5 rounded-full translate-y-9 -translate-x-9"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium opacity-80">CATEGORIES</div>
                  <div className="w-8 h-1 bg-white/30 rounded-full mt-1"></div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                <CountUpRegular end={data.total_categories} duration={1400} />
              </div>
              <div className="flex items-center text-sm opacity-90">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                Danh mục sản phẩm
              </div>
            </div>
          </div>
        </div>

        {/* Warning & Danger Status - Luxury Version */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Status - Luxury */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center text-white">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Trạng Thái Người Dùng</h3>
                  <p className="text-blue-100 text-sm">Phân tích chi tiết</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-4 shadow-lg"></div>
                  <div>
                    <span className="font-bold text-green-800 text-lg">Bình thường</span>
                    <p className="text-green-600 text-sm">Hoạt động tốt</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-green-600">
                    <CountUpRegular end={data.total_users - data.warning_users - data.danger_users} duration={1500} />
                  </span>
                  <p className="text-green-500 text-sm">người dùng</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-xl mr-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <span className="font-bold text-yellow-800 text-lg">Cảnh báo</span>
                    <p className="text-yellow-600 text-sm">Cần theo dõi</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-yellow-600">
                    <CountUpRegular end={data.warning_users} duration={1200} />
                  </span>
                  <p className="text-yellow-500 text-sm">người dùng</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-xl mr-4">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="font-bold text-red-800 text-lg">Nguy hiểm</span>
                    <p className="text-red-600 text-sm">Cần xử lý ngay</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-red-600">
                    <CountUpRegular end={data.danger_users} duration={1000} />
                  </span>
                  <p className="text-red-500 text-sm">người dùng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Status - Luxury */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
              <div className="flex items-center text-white">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Trạng Thái Cửa Hàng</h3>
                  <p className="text-green-100 text-sm">Giám sát hoạt động</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-4 shadow-lg"></div>
                  <div>
                    <span className="font-bold text-green-800 text-lg">Hoạt động tốt</span>
                    <p className="text-green-600 text-sm">Vận hành bình thường</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-green-600">
                    <CountUpRegular end={data.total_shops - data.warning_shops - data.danger_shops} duration={1500} />
                  </span>
                  <p className="text-green-500 text-sm">cửa hàng</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-xl mr-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <span className="font-bold text-yellow-800 text-lg">Cần theo dõi</span>
                    <p className="text-yellow-600 text-sm">Có vấn đề nhỏ</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-yellow-600">
                    <CountUpRegular end={data.warning_shops} duration={1200} />
                  </span>
                  <p className="text-yellow-500 text-sm">cửa hàng</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-xl mr-4">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="font-bold text-red-800 text-lg">Vi phạm</span>
                    <p className="text-red-600 text-sm">Cần xử lý khẩn cấp</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-red-600">
                    <CountUpRegular end={data.danger_shops} duration={1000} />
                  </span>
                  <p className="text-red-500 text-sm">cửa hàng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
