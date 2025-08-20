"use client"

import { useState } from "react"
import { Card, Input, Button, Typography, Alert, Divider } from "antd"
import CryptoJS from "crypto-js"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function SignatureValidator() {
  const [hashSecret, setHashSecret] = useState("KSYRJQ4J2780JAHHP57GTI4XHIG2ICT3")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [result, setResult] = useState<any>(null)

  const validateSignature = () => {
    try {
      // Parse URL parameters
      const url = new URL(paymentUrl)
      const params: Record<string, string> = {}

      url.searchParams.forEach((value, key) => {
        if (key !== "vnp_SecureHash") {
          params[key] = value
        }
      })

      const providedHash = url.searchParams.get("vnp_SecureHash")

      // Sort parameters alphabetically
      const sortedKeys = Object.keys(params).sort()

      // Create query string
      const queryString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&")

      // Generate signatures with different methods
      const sha256Hash = CryptoJS.HmacSHA256(queryString, hashSecret).toString().toUpperCase()
      const sha512Hash = CryptoJS.HmacSHA512(queryString, hashSecret).toString().toUpperCase()

      // Try with URL decoded values
      const decodedParams: Record<string, string> = {}
      Object.keys(params).forEach((key) => {
        decodedParams[key] = decodeURIComponent(params[key])
      })

      const decodedQueryString = sortedKeys.map((key) => `${key}=${decodedParams[key]}`).join("&")

      const decodedSha256 = CryptoJS.HmacSHA256(decodedQueryString, hashSecret).toString().toUpperCase()

      setResult({
        providedHash: providedHash?.toUpperCase(),
        queryString,
        decodedQueryString,
        sha256Hash,
        sha512Hash,
        decodedSha256,
        isValidSHA256: sha256Hash === providedHash?.toUpperCase(),
        isValidSHA512: sha512Hash === providedHash?.toUpperCase(),
        isValidDecodedSHA256: decodedSha256 === providedHash?.toUpperCase(),
        parameters: params,
        sortedKeys,
      })
    } catch (error) {
      console.error("Error validating signature:", error)
      setResult({ error: error.message })
    }
  }

  return (
    <Card title="VNPay Signature Validator" className="mb-4">
      <div className="space-y-4">
        <div>
          <Text strong>Hash Secret:</Text>
          <Input value={hashSecret} onChange={(e) => setHashSecret(e.target.value)} placeholder="VNP_HASH_SECRET" />
        </div>

        <div>
          <Text strong>VNPay Payment URL:</Text>
          <TextArea
            rows={4}
            value={paymentUrl}
            onChange={(e) => setPaymentUrl(e.target.value)}
            placeholder="Paste the complete VNPay payment URL here..."
          />
        </div>

        <Button type="primary" onClick={validateSignature} disabled={!paymentUrl}>
          Validate Signature
        </Button>

        {result && (
          <div className="mt-4">
            <Divider>Validation Results</Divider>

            {result.error ? (
              <Alert type="error" message={result.error} />
            ) : (
              <div className="space-y-4">
                <div>
                  <Text strong>Provided Hash:</Text>
                  <br />
                  <Text code>{result.providedHash}</Text>
                </div>

                <div>
                  <Text strong>Generated SHA256:</Text>
                  <br />
                  <Text code style={{ color: result.isValidSHA256 ? "green" : "red" }}>
                    {result.sha256Hash}
                  </Text>
                  {result.isValidSHA256 && <Text style={{ color: "green" }}> ✓ MATCH</Text>}
                </div>

                <div>
                  <Text strong>Generated SHA512:</Text>
                  <br />
                  <Text code style={{ color: result.isValidSHA512 ? "green" : "red" }}>
                    {result.sha512Hash}
                  </Text>
                  {result.isValidSHA512 && <Text style={{ color: "green" }}> ✓ MATCH</Text>}
                </div>

                <div>
                  <Text strong>Decoded SHA256:</Text>
                  <br />
                  <Text code style={{ color: result.isValidDecodedSHA256 ? "green" : "red" }}>
                    {result.decodedSha256}
                  </Text>
                  {result.isValidDecodedSHA256 && <Text style={{ color: "green" }}> ✓ MATCH</Text>}
                </div>

                <Divider>Debug Information</Divider>

                <div>
                  <Text strong>Query String (Original):</Text>
                  <br />
                  <Text code>{result.queryString}</Text>
                </div>

                <div>
                  <Text strong>Query String (Decoded):</Text>
                  <br />
                  <Text code>{result.decodedQueryString}</Text>
                </div>

                <div>
                  <Text strong>Parameter Order:</Text>
                  <br />
                  <Text code>{result.sortedKeys.join(", ")}</Text>
                </div>

                <Alert
                  type={
                    result.isValidSHA256 || result.isValidSHA512 || result.isValidDecodedSHA256 ? "success" : "error"
                  }
                  message={
                    result.isValidSHA256 || result.isValidSHA512 || result.isValidDecodedSHA256
                      ? "Signature validation successful!"
                      : "Signature validation failed - check Laravel signature generation"
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
