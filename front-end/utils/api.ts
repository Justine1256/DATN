export const STATIC_BASE_URL = process.env.NEXT_PUBLIC_STATIC_URL || 'http://localhost:8000/api/image';
// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

// You can add other API-related utilities here
export const API_ENDPOINTS = {
  REGISTER: "/signup",
  VERIFY_OTP: "/verify-otp",
  GOOGLE_SIGNUP: "/google-signup",
  GOOGLE_SIGNUP_COMPLETE: "/google-signup-complete",
  LOGIN: "/login",
} as const

// Helper function for API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
