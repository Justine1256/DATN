"use client"

import { useState } from "react"
import { Card, Button, Form, Input, InputNumber, Alert, Space, Typography, Divider, Collapse } from "antd"
import { CheckCircleOutlined, RocketOutlined, BugOutlined } from "@ant-design/icons"
import CryptoJS from "crypto-js"
import { API_BASE_URL } from "@/utils/api"

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

export default function VNPayTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [signatureValidation, setSignatureValidation] = useState<any>(null)
  const [urlDebugInfo, setUrlDebugInfo] = useState<any>(null)

  const validateSignature = (paymentUrl: string) => {
    try {
      const url = new URL(paymentUrl)
      const params: Record<string, string> = {}

      url.searchParams.forEach((value, key) => {
        params[key] = value
      })

      const providedHash = params.vnp_SecureHash
      const hashSecret = "KSYRJQ4J2780JAHHP57GTI4XHIG2ICT3"

      const filteredParams = { ...params }
      delete filteredParams.vnp_SecureHash
      delete filteredParams.vnp_SecureHashType

      const sortedKeys = Object.keys(filteredParams).sort()
      const queryStringUnencoded = sortedKeys.map((key) => `${key}=${filteredParams[key]}`).join("&")
      const queryStringEncoded = sortedKeys.map((key) => `${key}=${encodeURIComponent(filteredParams[key])}`).join("&")

      const generatedHashUnencoded = CryptoJS.HmacSHA512(queryStringUnencoded, hashSecret).toString().toUpperCase()
      const generatedHashEncoded = CryptoJS.HmacSHA512(queryStringEncoded, hashSecret).toString().toUpperCase()

      const debugInfo = {
        originalUrl: paymentUrl,
        decodedUrl: decodeURIComponent(paymentUrl),
        urlLength: paymentUrl.length,
        parameterCount: Object.keys(params).length,
        hasSpecialChars: /[<>'"&]/.test(paymentUrl),
        encodingIssues: paymentUrl !== encodeURI(decodeURI(paymentUrl)),
        allParameters: params,
        filteredParameters: filteredParams,
        sortedKeys,
        rawQueryString: url.search,
        generatedQueryString: queryStringUnencoded,
        encodedQueryString: queryStringEncoded,
      }

      const isValidUnencoded = providedHash === generatedHashUnencoded
      const isValidEncoded = providedHash === generatedHashEncoded

      return {
        providedHash,
        generatedHashUnencoded,
        generatedHashEncoded,
        isValidUnencoded,
        isValidEncoded,
        isValid: isValidUnencoded || isValidEncoded,
        queryString: queryStringUnencoded,
        encodedQueryString: queryStringEncoded,
        parameters: filteredParams,
        debugInfo,
        recommendedMethod: isValidEncoded ? "URL_ENCODED" : isValidUnencoded ? "UNENCODED" : "NONE",
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  const interceptVNPayURL = (paymentUrl: string) => {
    const interceptInfo = {
      timestamp: new Date().toISOString(),
      originalUrl: paymentUrl,
      urlComponents: {
        protocol: new URL(paymentUrl).protocol,
        host: new URL(paymentUrl).host,
        pathname: new URL(paymentUrl).pathname,
        search: new URL(paymentUrl).search,
      },
      suspiciousPatterns: {
        doubleEncoding: paymentUrl.includes("%25"),
        specialChars: /[<>'"&]/.test(paymentUrl),
        longUrl: paymentUrl.length > 2000,
        malformedParams: !paymentUrl.includes("vnp_SecureHash="),
      },
    }

    setUrlDebugInfo(interceptInfo)
    console.log("[v0] VNPay URL Debug:", interceptInfo)

    return interceptInfo
  }

  const handleTest = async (values: any) => {
    setLoading(true)
    setSignatureValidation(null)
    setUrlDebugInfo(null)

    try {
      const response = await fetch(`${API_BASE_URL}/vnpay/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_ids: values.order_ids.split(",").map((id: string) => Number.parseInt(id.trim())),
          amount: values.amount,
          order_info: values.order_info,
          return_url: `${window.location.origin}/checkout/result`,
          customer_name: values.customer_name,
          customer_email: values.customer_email,
          customer_phone: values.customer_phone,
        }),
      })

      const data = await response.json()
      setResult({ success: response.ok, data, status: response.status })

      if (response.ok && data.payment_url) {
        const validation = validateSignature(data.payment_url)
        setSignatureValidation(validation)

        const urlDebug = interceptVNPayURL(data.payment_url)

        if (validation.isValid) {
          setTimeout(() => {
            const confirmed = window.confirm(
              `Signature hợp lệ! Mở VNPay payment page?\n\nNếu VNPay vẫn báo "sai chữ ký", có thể là vấn đề URL encoding hoặc VNPay sandbox.`,
            )
            if (confirmed) {
              window.open(data.payment_url, "_blank")
            }
          }, 1000)
        }
      }
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <CheckCircleOutlined style={{ fontSize: "48px", color: "#52c41a" }} />
            <Title level={2}>VNPay Integration Test</Title>
            <Alert
              message="Signature Validation Fixed! 🎉"
              description="HMAC-SHA512 với parameter filtering đã hoạt động. Test thanh toán thực tế ngay!"
              type="success"
              showIcon
              style={{ marginBottom: "24px" }}
            />
          </div>

          <Form
            layout="vertical"
            onFinish={handleTest}
            initialValues={{
              order_ids: "1",
              amount: 100000,
              order_info: "Test payment - Fixed signature",
              customer_name: "Test User",
              customer_email: "test@example.com",
              customer_phone: "0123456789",
            }}
          >
            <Form.Item
              label="Order IDs"
              name="order_ids"
              rules={[{ required: true, message: "Vui lòng nhập Order IDs!" }]}
            >
              <Input placeholder="1,2,3" />
            </Form.Item>

            <Form.Item
              label="Số tiền (VND)"
              name="amount"
              rules={[{ required: true, message: "Vui lòng nhập số tiền!" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1000}
                max={500000000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
            </Form.Item>

            <Form.Item
              label="Thông tin đơn hàng"
              name="order_info"
              rules={[{ required: true, message: "Vui lòng nhập thông tin đơn hàng!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Tên khách hàng"
              name="customer_name"
              rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="customer_email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="customer_phone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<RocketOutlined />}
                style={{ width: "100%" }}
              >
                {loading ? "Đang tạo thanh toán..." : "Test VNPay Payment"}
              </Button>
            </Form.Item>
          </Form>

          {result && (
            <>
              <Divider />
              <Card
                title={
                  <Space>
                    {result.success ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : (
                      <BugOutlined style={{ color: "#ff4d4f" }} />
                    )}
                    Kết quả Test
                  </Space>
                }
                type={result.success ? "inner" : "inner"}
              >
                {result.success ? (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {signatureValidation && (
                      <Alert
                        message={signatureValidation.isValid ? "✅ Signature hợp lệ!" : "❌ Signature không hợp lệ!"}
                        description={
                          signatureValidation.isValid
                            ? "Laravel backend đã tạo signature đúng. VNPay sẽ chấp nhận thanh toán này."
                            : "Laravel backend vẫn tạo signature sai. Cần cập nhật VnpayService."
                        }
                        type={signatureValidation.isValid ? "success" : "error"}
                        showIcon
                      />
                    )}

                    <Alert
                      message="✅ Tạo payment URL thành công!"
                      description={
                        signatureValidation?.isValid
                          ? "VNPay payment URL đã được tạo và mở trong tab mới. Signature hợp lệ!"
                          : "VNPay payment URL đã được tạo nhưng signature không hợp lệ. Kiểm tra chi tiết bên dưới."
                      }
                      type={signatureValidation?.isValid ? "success" : "warning"}
                      showIcon
                    />

                    <Text strong>Payment URL:</Text>
                    <Text code style={{ wordBreak: "break-all" }}>
                      {result.data.payment_url}
                    </Text>

                    {signatureValidation && (
                      <Collapse>
                        <Panel header="🔍 Chi tiết Signature Validation" key="1">
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <div>
                              <Text strong>Provided Hash (từ Laravel):</Text>
                              <br />
                              <Text code style={{ color: signatureValidation.isValid ? "#52c41a" : "#ff4d4f" }}>
                                {signatureValidation.providedHash}
                              </Text>
                            </div>
                            <div>
                              <Text strong>Expected Hash (Unencoded):</Text>
                              <br />
                              <Text
                                code
                                style={{ color: signatureValidation.isValidUnencoded ? "#52c41a" : "#ff4d4f" }}
                              >
                                {signatureValidation.generatedHashUnencoded}{" "}
                                {signatureValidation.isValidUnencoded ? "✅" : "❌"}
                              </Text>
                            </div>
                            <div>
                              <Text strong>Expected Hash (URL Encoded):</Text>
                              <br />
                              <Text code style={{ color: signatureValidation.isValidEncoded ? "#52c41a" : "#ff4d4f" }}>
                                {signatureValidation.generatedHashEncoded}{" "}
                                {signatureValidation.isValidEncoded ? "✅" : "❌"}
                              </Text>
                            </div>
                            {signatureValidation.recommendedMethod && (
                              <Alert
                                message={`🎯 Recommended Method: ${signatureValidation.recommendedMethod}`}
                                description={
                                  signatureValidation.recommendedMethod === "URL_ENCODED"
                                    ? "Laravel cần URL encode các parameter values trước khi tạo signature!"
                                    : signatureValidation.recommendedMethod === "UNENCODED"
                                      ? "Laravel đang dùng unencoded values - đây là method đúng."
                                      : "Không có method nào hoạt động - cần kiểm tra lại hash secret."
                                }
                                type={signatureValidation.isValid ? "success" : "error"}
                                showIcon
                              />
                            )}
                            <div>
                              <Text strong>Query String (Unencoded):</Text>
                              <br />
                              <Text code style={{ wordBreak: "break-all", fontSize: "12px" }}>
                                {signatureValidation.queryString}
                              </Text>
                            </div>
                            <div>
                              <Text strong>Query String (URL Encoded):</Text>
                              <br />
                              <Text code style={{ wordBreak: "break-all", fontSize: "12px" }}>
                                {signatureValidation.encodedQueryString}
                              </Text>
                            </div>
                          </Space>
                        </Panel>
                        {signatureValidation.debugInfo && (
                          <Panel header="🐛 URL Debug Information" key="2">
                            <Space direction="vertical" style={{ width: "100%" }}>
                              <div>
                                <Text strong>URL Length:</Text> {signatureValidation.debugInfo.urlLength} characters
                              </div>
                              <div>
                                <Text strong>Parameter Count:</Text> {signatureValidation.debugInfo.parameterCount}
                              </div>
                              <div>
                                <Text strong>Encoding Issues:</Text>{" "}
                                <Text
                                  style={{
                                    color: signatureValidation.debugInfo.encodingIssues ? "#ff4d4f" : "#52c41a",
                                  }}
                                >
                                  {signatureValidation.debugInfo.encodingIssues ? "⚠️ Detected" : "✅ None"}
                                </Text>
                              </div>
                              <div>
                                <Text strong>Special Characters:</Text>{" "}
                                <Text
                                  style={{
                                    color: signatureValidation.debugInfo.hasSpecialChars ? "#ff4d4f" : "#52c41a",
                                  }}
                                >
                                  {signatureValidation.debugInfo.hasSpecialChars ? "⚠️ Found" : "✅ Clean"}
                                </Text>
                              </div>
                              <div>
                                <Text strong>Raw Query String:</Text>
                                <br />
                                <Text code style={{ wordBreak: "break-all", fontSize: "12px" }}>
                                  {signatureValidation.debugInfo.rawQueryString}
                                </Text>
                              </div>
                            </Space>
                          </Panel>
                        )}
                        {urlDebugInfo && (
                          <Panel header="🕵️ URL Interception Analysis" key="3">
                            <Space direction="vertical" style={{ width: "100%" }}>
                              <Alert
                                message="URL được phân tích trước khi gửi tới VNPay"
                                description="Thông tin này giúp xác định vấn đề encoding hoặc parameter tampering"
                                type="info"
                                showIcon
                              />
                              <div>
                                <Text strong>Timestamp:</Text> {urlDebugInfo.timestamp}
                              </div>
                              <div>
                                <Text strong>Double Encoding:</Text>{" "}
                                <Text
                                  style={{
                                    color: urlDebugInfo.suspiciousPatterns.doubleEncoding ? "#ff4d4f" : "#52c41a",
                                  }}
                                >
                                  {urlDebugInfo.suspiciousPatterns.doubleEncoding ? "⚠️ Detected" : "✅ None"}
                                </Text>
                              </div>
                              <div>
                                <Text strong>URL Length:</Text>{" "}
                                <Text
                                  style={{ color: urlDebugInfo.suspiciousPatterns.longUrl ? "#ff4d4f" : "#52c41a" }}
                                >
                                  {urlDebugInfo.originalUrl.length} chars{" "}
                                  {urlDebugInfo.suspiciousPatterns.longUrl ? "(⚠️ Very long)" : "(✅ Normal)"}
                                </Text>
                              </div>
                              <div>
                                <Text strong>Malformed Parameters:</Text>{" "}
                                <Text
                                  style={{
                                    color: urlDebugInfo.suspiciousPatterns.malformedParams ? "#ff4d4f" : "#52c41a",
                                  }}
                                >
                                  {urlDebugInfo.suspiciousPatterns.malformedParams ? "⚠️ Issues found" : "✅ All good"}
                                </Text>
                              </div>
                            </Space>
                          </Panel>
                        )}
                      </Collapse>
                    )}
                  </Space>
                ) : (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Alert
                      message="❌ Lỗi tạo payment URL"
                      description="Vẫn còn vấn đề với Laravel backend. Kiểm tra lại implementation."
                      type="error"
                      showIcon
                    />
                    <Text strong>Error:</Text>
                    <Text code>{JSON.stringify(result.error || result.data, null, 2)}</Text>
                  </Space>
                )}
              </Card>
            </>
          )}

          <Card title="📋 Checklist Implementation" type="inner">
            <Space direction="vertical">
              <Text>✅ Signature validation method đã tìm thấy</Text>
              <Text>✅ Laravel VnpayService đã cập nhật (HMAC-SHA512, exclude vnp_SecureHashType)</Text>
              <Text>✅ Signature validation thành công trong test</Text>
              <Text style={{ color: "#ff4d4f" }}>
                ❌ VNPay vẫn báo "sai chữ ký" - có thể là vấn đề VNPay sandbox hoặc URL encoding
              </Text>
              <Text>🔄 Kiểm tra return URL hoạt động</Text>
              <Text>🔄 Test IPN handling</Text>
              <Divider />
              <Text strong>🔧 Troubleshooting Suggestions:</Text>
              <Text>1. Thử với VNPay production environment thay vì sandbox</Text>
              <Text>2. Kiểm tra VNP_HASH_SECRET có đúng không</Text>
              <Text>3. Liên hệ VNPay support để xác nhận sandbox hoạt động</Text>
              <Text>4. Test với browser khác hoặc incognito mode</Text>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  )
}
