"use client"

import type React from "react"

import Cookies from "js-cookie"
import { useState, useEffect, useRef } from "react"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react"

// Type definitions based on API response
interface TopSellingProduct {
  id: number
  name: string
  sold: number
  stock: number
}

interface MonthlyRevenue {
  month: string
  revenue: string
}

interface DashboardData {
  total_sales: string
  total_orders: number
  completed_orders: number
  canceled_orders: number
  total_products: number
  low_stock_products: number
  top_selling_products: TopSellingProduct[]
  average_rating: number
  total_reviews: number
  total_followers: number
  monthly_revenue: MonthlyRevenue[]
}

// Custom CountUp Hook
function useCountUp(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startAnimation = () => {
    if (isAnimating) return

    setIsAnimating(true)
    startTimeRef.current = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || now)
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
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

// CountUp Component for Numbers
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
      }, 300) // Small delay for better UX

      return () => clearTimeout(timer)
    }
  }, [hasStarted, startAnimation])

  const displayValue = formatter ? formatter(count) : Math.floor(count).toString()

  return <span className={className}>{displayValue}</span>
}

// CountUp Component for Currency
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

// CountUp Component for Regular Numbers
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

// CountUp Component for Decimal Numbers (like ratings)
function CountUpDecimal({
  end,
  duration = 1500,
  className = "",
}: {
  end: number
  duration?: number
  className?: string
}) {
  const formatDecimal = (num: number) => {
    return num.toFixed(1)
  }

  return <CountUpNumber end={end} duration={duration} formatter={formatDecimal} className={className} />
}

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number.parseFloat(amount))
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("vi-VN").format(num)
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Custom Progress Bar Component
function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  )
}

// Custom Badge Component
function CustomBadge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-700 bg-white",
  }

  return <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
}

// Custom Card Components
function CustomCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
}

function CustomCardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
}

function CustomCardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

function CustomCardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = Cookies.get("authToken")
        const response = await fetch("https://api.marketo.info.vn/api/shop/dashboard/stats", {
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
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu")
        console.error("Error fetching dashboard data:", err)
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

  const completionRate = (data.completed_orders / data.total_orders) * 100
  const cancellationRate = (data.canceled_orders / data.total_orders) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Quản Trị</h1>
            <p className="text-slate-600 mt-1">Tổng quan hoạt động cửa hàng</p>
          </div>
          <div className="flex items-center space-x-2">
            <CustomBadge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Hoạt động
            </CustomBadge>
            <CustomBadge variant="secondary" className="text-xs">
              Cập nhật: {new Date().toLocaleString("vi-VN")}
            </CustomBadge>
          </div>
        </div>

        {/* Key Metrics with CountUp Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Doanh Thu</h3>
              <DollarSign className="h-4 w-4 opacity-90" />
            </div>
            <div className="text-2xl font-bold">
              <CountUpCurrency end={data.total_sales} duration={2500} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {data.monthly_revenue[0]?.month || "Tháng hiện tại"}
            </p>
          </div>

          {/* Total Orders Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng Đơn Hàng</h3>
              <ShoppingCart className="h-4 w-4 opacity-90" />
            </div>
            <div className="text-2xl font-bold">
              <CountUpRegular end={data.total_orders} duration={2000} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              <CountUpRegular end={data.completed_orders} duration={1800} /> hoàn thành
            </p>
          </div>

          {/* Total Products Card */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Sản Phẩm</h3>
              <Package className="h-4 w-4 opacity-90" />
            </div>
            <div className="text-2xl font-bold">
              <CountUpRegular end={data.total_products} duration={1800} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              <CountUpRegular end={data.low_stock_products} duration={1500} /> sắp hết hàng
            </p>
          </div>

          {/* Followers Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Người Theo Dõi</h3>
              <Users className="h-4 w-4 opacity-90" />
            </div>
            <div className="text-2xl font-bold">
              <CountUpRegular end={data.total_followers} duration={1600} />
            </div>
            <p className="text-xs opacity-90 mt-1">
              <Star className="inline h-3 w-3 mr-1" />
              <CountUpDecimal end={data.average_rating} duration={1500} />
              /5 đánh giá
            </p>
          </div>
        </div>

        {/* Order Status & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomCard className="shadow-lg">
            <CustomCardHeader>
              <CustomCardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                Trạng Thái Đơn Hàng
              </CustomCardTitle>
            </CustomCardHeader>
            <CustomCardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Hoàn thành</span>
                  <span className="text-sm text-slate-600">
                    <CountUpRegular end={data.completed_orders} duration={1500} />/{formatNumber(data.total_orders)}
                  </span>
                </div>
                <ProgressBar value={completionRate} />
                <p className="text-xs text-slate-500">{completionRate.toFixed(1)}% đơn hàng hoàn thành</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-700">Đã hủy</span>
                  <span className="text-sm text-slate-600">
                    <CountUpRegular end={data.canceled_orders} duration={1500} />/{formatNumber(data.total_orders)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cancellationRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">{cancellationRate.toFixed(1)}% đơn hàng bị hủy</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    <CountUpRegular end={data.completed_orders} duration={1500} />
                  </div>
                  <div className="text-xs text-slate-500">Hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    <CountUpRegular
                      end={data.total_orders - data.completed_orders - data.canceled_orders}
                      duration={1500}
                    />
                  </div>
                  <div className="text-xs text-slate-500">Đang xử lý</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    <CountUpRegular end={data.canceled_orders} duration={1500} />
                  </div>
                  <div className="text-xs text-slate-500">Đã hủy</div>
                </div>
              </div>
            </CustomCardContent>
          </CustomCard>

          <CustomCard className="shadow-lg">
            <CustomCardHeader>
              <CustomCardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Đánh Giá & Phản Hồi
              </CustomCardTitle>
            </CustomCardHeader>
            <CustomCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-slate-900">
                      <CountUpDecimal end={data.average_rating} duration={1500} />
                    </div>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= data.average_rating ? "text-yellow-400 fill-current" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-700">
                      <CountUpRegular end={data.total_reviews} duration={1200} />
                    </div>
                    <div className="text-sm text-slate-500">Đánh giá</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Người theo dõi</span>
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    <CountUpRegular end={data.total_followers} duration={1600} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Khách hàng quan tâm</p>
                </div>
              </div>
            </CustomCardContent>
          </CustomCard>
        </div>

        {/* Top Selling Products */}
        <CustomCard className="shadow-lg">
          <CustomCardHeader>
            <CustomCardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Sản Phẩm Bán Chạy Nhất
            </CustomCardTitle>
          </CustomCardHeader>
          <CustomCardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tên Sản Phẩm</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Đã Bán</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Tồn Kho</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_selling_products.map((product, index) => (
                    <tr key={product.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-md">
                          <p className="font-medium text-slate-900 leading-tight">{truncateText(product.name, 80)}</p>
                          <p className="text-xs text-slate-500 mt-1">ID: {product.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-semibold text-green-600">
                          <CountUpRegular end={product.sold} duration={2000 + index * 200} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-semibold text-blue-600">
                          <CountUpRegular end={product.stock} duration={2200 + index * 200} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CustomBadge
                          variant={product.stock > 1000 ? "default" : product.stock > 500 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {product.stock > 1000 ? "Còn nhiều" : product.stock > 500 ? "Còn ít" : "Sắp hết"}
                        </CustomBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CustomCardContent>
        </CustomCard>
      </div>
    </div>
  )
}
