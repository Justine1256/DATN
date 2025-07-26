// Utility functions cho API calls
export const getAuthToken = (): string | null => {
  if (typeof document === "undefined") return null

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1] || null
  )
}

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Specific API functions
export const fetchUsers = async (page = 1, perPage = 10) => {
  return apiRequest(`/api/admin/users?page=${page}&per_page=${perPage}`)
}

export const fetchUserDetail = async (userId: string) => {
  return apiRequest(`/api/admin/users/${userId}`)
}
