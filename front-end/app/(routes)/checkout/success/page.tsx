"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, Button, Tag, Descriptions, Result, Spin, Divider } from "antd"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import Link from "next/link"

interface OrderInfo {
  cartItems: Array<{
    id: string
    quantity: number
    product: {
      id: number
      name: string
      price: number
      sale_price?: number | null
    }
    variant?: {
      id: number | null
      price?: number
      sale_price?: number | null
    }
  }>
  paymentInfo: {
    summary: {
      total: number
      subTotal: number
      discount: number
      shipping: number
    }
  }
  addressInfo: any
  timestamp: number
  txnRef: string
  expectedReturnUrl: string
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams()
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const vnpResponseCode = searchParams.get("vnp_ResponseCode")
  const vnpTransactionStatus = searchParams.get("vnp_TransactionStatus")
  const vnpTxnRef = searchParams.get("vnp_TxnRef")
  const vnpAmount = searchParams.get("vnp_Amount")
  const vnpOrderInfo = searchParams.get("vnp_OrderInfo")
  const vnpPayDate = searchParams.get("vnp_PayDate")
  const vnpSecureHash = searchParams.get("vnp_SecureHash")
  const vnpBankCode = searchParams.get("vnp_BankCode")
  const vnpCardType = searchParams.get("vnp_CardType")

  // Legacy parameters for backward compatibility
  const status = searchParams.get("status")
  const reason = searchParams.get("reason")
  const orderIds = searchParams.get("order_ids")
  const amount = searchParams.get("amount")
  const transactionCode = searchParams.get("code")

  useEffect(() => {
    const allParams = {
      // VNPay parameters
      vnp_ResponseCode: vnpResponseCode,
      vnp_TransactionStatus: vnpTransactionStatus,
      vnp_TxnRef: vnpTxnRef,
      vnp_Amount: vnpAmount,
      vnp_OrderInfo: vnpOrderInfo,
      vnp_PayDate: vnpPayDate,
      vnp_SecureHash: vnpSecureHash,
      vnp_BankCode: vnpBankCode,
      vnp_CardType: vnpCardType,
      // Legacy parameters
      status: status,
      reason: reason,
      orderIds: orderIds,
      amount: amount,
      transactionCode: transactionCode,
      // All search params for debugging
      allSearchParams: Object.fromEntries(searchParams.entries()),
    }

    console.log("[v0] Payment result page loaded with parameters:", allParams)

    if (vnpSecureHash && vnpTxnRef) {
      console.log("[v0] VNPay signature validation needed:", {
        txnRef: vnpTxnRef,
        responseCode: vnpResponseCode,
        transactionStatus: vnpTransactionStatus,
        hasSecureHash: !!vnpSecureHash,
      })
    }

    // Retrieve stored order and customer info
    const storedOrderInfo = localStorage.getItem("vnpay_order_info")
    const storedCustomerInfo = localStorage.getItem("vnpay_customer_info")

    if (storedOrderInfo) {
      try {
        const parsed = JSON.parse(storedOrderInfo)
        console.log("[v0] Retrieved stored order info:", {
          hasCartItems: !!parsed.cartItems?.length,
          hasPaymentInfo: !!parsed.paymentInfo,
          timestamp: parsed.timestamp,
          txnRef: parsed.txnRef,
          expectedReturnUrl: parsed.expectedReturnUrl,
        })
        setOrderInfo(parsed)
      } catch (error) {
        console.error("[v0] Error parsing stored order info:", error)
      }
    } else {
      console.warn("[v0] No stored order info found in localStorage")
    }

    if (storedCustomerInfo) {
      try {
        setCustomerInfo(JSON.parse(storedCustomerInfo))
      } catch (error) {
        console.error("[v0] Error parsing stored customer info:", error)
      }
    }

    const isSuccess = vnpResponseCode === "00" && vnpTransactionStatus === "00"
    console.log("[v0] Payment result analysis:", {
      isVNPaySuccess: isSuccess,
      isLegacySuccess: status === "success",
      finalStatus: isSuccess || status === "success" ? "success" : "failed",
    })

    if (isSuccess || status === "success") {
      setTimeout(() => {
        localStorage.removeItem("vnpay_order_info")
        localStorage.removeItem("vnpay_customer_info")
        console.log("[v0] Cleaned up localStorage after successful payment")
      }, 10000)
    }

    setIsLoading(false)
  }, [vnpResponseCode, vnpTransactionStatus, status, searchParams])

  const getStatusInfo = () => {
    // VNPay response codes
    if (vnpResponseCode && vnpTransactionStatus) {
      if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
        return {
          status: "success" as const,
          title: "Thanh toán thành công!",
          subTitle: "Giao dịch của bạn đã được xử lý thành công.",
          icon: <CheckCircleOutlined />,
        }
      } else {
        return {
          status: "error" as const,
          title: "Thanh toán thất bại",
          subTitle: getVNPayFailureReason(vnpResponseCode),
          icon: <CloseCircleOutlined />,
        }
      }
    }

    // Legacy status handling
    switch (status) {
      case "success":
        return {
          status: "success" as const,
          title: "Payment Successful!",
          subTitle: "Your payment has been processed successfully.",
          icon: <CheckCircleOutlined />,
        }
      case "failed":
        return {
          status: "error" as const,
          title: "Payment Failed",
          subTitle: getFailureReason(reason),
          icon: <CloseCircleOutlined />,
        }
      default:
        return {
          status: "warning" as const,
          title: "Đang xử lý thanh toán",
          subTitle: "Không thể xác định trạng thái thanh toán.",
          icon: <ExclamationCircleOutlined />,
        }
    }
  }

  const getVNPayFailureReason = (responseCode: string) => {
    const errorCodes: { [key: string]: string } = {
      "01": "Giao dịch chưa hoàn tất",
      "02": "Giao dịch bị lỗi",
      "04": "Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)",
      "05": "VNPAY đang xử lý giao dịch này (GD hoàn tiền)",
      "06": "VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)",
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "GD Hoàn trả bị từ chối",
      "10": "Đã giao hàng",
      "11": "Đã hủy giao hàng",
      "12": "Đã xác nhận thông tin",
      "24": "Khách hàng hủy giao dịch",
      "51": "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
      "65": "Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
      "75": "Ngân hàng thanh toán đang bảo trì",
      "79": "KH nhập sai mật khẩu thanh toán quá số lần quy định",
      "99": "Lỗi không xác định",
    }

    return errorCodes[responseCode] || `Lỗi thanh toán với mã: ${responseCode}`
  }

  const getFailureReason = (reason: string | null) => {
    switch (reason) {
      case "invalid_hash":
        return "Payment verification failed. Please contact support."
      case "mapping_not_found":
        return "Transaction record not found. Please contact support."
      case "db_error":
        return "Database error occurred. Please contact support."
      case "24":
        return "Transaction was cancelled by user."
      case "51":
        return "Insufficient account balance."
      case "65":
        return "Transaction limit exceeded."
      default:
        return reason ? `Payment failed with code: ${reason}` : "Payment was not completed."
    }
  }

  const statusInfo = getStatusInfo()
  const isSuccess = (vnpResponseCode === "00" && vnpTransactionStatus === "00") || status === "success"

  const formatVNPayDate = (dateStr: string | null) => {
    if (!dateStr) return new Date().toLocaleString("vi-VN")

    try {
      // VNPay date format: yyyyMMddHHmmss
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      const hour = dateStr.substring(8, 10)
      const minute = dateStr.substring(10, 12)
      const second = dateStr.substring(12, 14)

      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
      return date.toLocaleString("vi-VN")
    } catch {
      return new Date().toLocaleString("vi-VN")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <Result
            status={statusInfo.status}
            title={statusInfo.title}
            subTitle={statusInfo.subTitle}
            extra={[
              <div key="content" className="space-y-6 text-left">
                {(isSuccess || vnpTxnRef) && (
                  <Card title="Chi tiết giao dịch" size="small" className="mb-4">
                    <Descriptions column={1} size="small">
                      {vnpTxnRef && (
                        <Descriptions.Item label="Mã giao dịch">
                          <code>{vnpTxnRef}</code>
                        </Descriptions.Item>
                      )}
                      {(vnpAmount || amount) && (
                        <Descriptions.Item label="Số tiền">
                          <strong>
                            {vnpAmount
                              ? (Number.parseInt(vnpAmount) / 100).toLocaleString("vi-VN")
                              : Number.parseInt(amount || "0").toLocaleString("vi-VN")}{" "}
                            ₫
                          </strong>
                        </Descriptions.Item>
                      )}
                      {vnpBankCode && (
                        <Descriptions.Item label="Ngân hàng">
                          <Tag color="blue">{vnpBankCode.toUpperCase()}</Tag>
                        </Descriptions.Item>
                      )}
                      {vnpCardType && (
                        <Descriptions.Item label="Loại thẻ">
                          <Tag color="green">{vnpCardType.toUpperCase()}</Tag>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Thời gian">{formatVNPayDate(vnpPayDate)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                {orderInfo && (
                  <Card title="Tóm tắt đơn hàng" size="small" className="mb-4">
                    <div className="space-y-2">
                      {orderInfo.cartItems.map((item) => {
                        const price =
                          item.variant?.sale_price ??
                          item.variant?.price ??
                          item.product.sale_price ??
                          item.product.price
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.product.name} (x{item.quantity})
                            </span>
                            <span>{(price * item.quantity).toLocaleString("vi-VN")} ₫</span>
                          </div>
                        )
                      })}
                      <Divider />
                      <div className="flex justify-between font-semibold">
                        <span>Tổng cộng</span>
                        <span>{orderInfo.paymentInfo.summary.total.toLocaleString("vi-VN")} ₫</span>
                      </div>
                    </div>
                  </Card>
                )}

                {customerInfo && (
                  <Card title="Thông tin khách hàng" size="small" className="mb-4">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Tên">{customerInfo.name}</Descriptions.Item>
                      <Descriptions.Item label="Email">{customerInfo.email}</Descriptions.Item>
                      {customerInfo.phone && (
                        <Descriptions.Item label="Điện thoại">{customerInfo.phone}</Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                )}

                <div className="text-center mb-4">
                  <Tag color={isSuccess ? "success" : "error"} className="px-4 py-2 text-sm">
                    {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
                  </Tag>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/" className="flex-1">
                    <Button icon={<HomeOutlined />} size="large" className="w-full">
                      Về trang chủ
                    </Button>
                  </Link>

                  {!isSuccess && (
                    <Link href="/checkout" className="flex-1">
                      <Button type="primary" size="large" className="w-full">
                        Thử lại
                      </Button>
                    </Link>
                  )}

                  {isSuccess && (
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()} size="large" className="flex-1">
                      In hóa đơn
                    </Button>
                  )}
                </div>

                <div className="text-center text-sm text-gray-600 pt-4 border-t">
                  <p>Cần hỗ trợ? Liên hệ đội ngũ hỗ trợ của chúng tôi</p>
                  <p>Email: support@yourcompany.com | Điện thoại: 1900-xxxx</p>
                </div>
              </div>,
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
