"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";

// ✅ Interface dữ liệu người dùng
interface UserData {
  name: string;
  phone: string;
  email: string;
  role: string;
  currentPassword?: string;
  passwordError?: string;
}

// ✅ Khai báo props
interface Props {
  onProfileUpdated?: () => void;
}

export default function AccountPage({ onProfileUpdated }: Props) {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    email: "",
    role: "",
    currentPassword: "",
    passwordError: "",
  });

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const showPopupMessage = useCallback(
    (msg: string, type: "success" | "error") => {
      setPopupMessage(msg);
      setPopupType(type);
      setShowPopup(true);
    },
    []
  );

  const fetchUser = useCallback(async () => {
    const token = Cookies.get("authToken");
    if (!token) return setLoading(false);

    try {
      const res = await axios.get("http://localhost:8000/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setUserData({
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        currentPassword: "",
        passwordError: "",
      });
    } catch {
      showPopupMessage("Failed to load user information.", "error");
    } finally {
      setLoading(false);
    }
  }, [showPopupMessage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value, passwordError: "" }));
  };

  const validateForm = () => {
    const { name, phone, email, currentPassword } = userData;

    if (!name || !phone || !email || !currentPassword) {
      showPopupMessage("Please fill in all required fields.", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopupMessage("Invalid email format.", "error");
      return false;
    }

    const phoneRegex = /^\d{9,12}$/;
    if (!phoneRegex.test(phone)) {
      showPopupMessage("Invalid phone number.", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = Cookies.get("authToken");
    if (!token) return showPopupMessage("Not authenticated.", "error");

    try {
      const res = await axios.put(
        "http://localhost:8000/api/user",
        {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          current_password: userData.currentPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = res.data.user;
      setUserData({
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        currentPassword: "",
        passwordError: "",
      });

      onProfileUpdated?.();
      showPopupMessage("Profile updated successfully!", "success");
      fetchUser();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "";
      if (msg.toLowerCase().includes("password")) {
        setUserData((prev) => ({
          ...prev,
          passwordError: "Incorrect current password!",
        }));
        return showPopupMessage("Incorrect current password!", "error");
      }
      return showPopupMessage("Update failed!", "error");
    }
  };

  return (
    <div className="w-full flex justify-center text-[15px] text-gray-800">
      <div className="container mx-auto px-4">
        {/* ✅ Bảng rộng hơn để dễ hiển thị */}
        <div className="w-full max-w-[800px] mx-auto px-4 pt-10">
          <form
            onSubmit={handleSubmit}
            className="p-8 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-[#DB4444] mb-4">
              Edit Your Profile
            </h2>

            {/* ✅ Input Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-400"
                />
              </div>
            </div>

            {/* ✅ Input Email & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input
                  type="text"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-3 text-sm rounded-md border border-gray-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Role</label>
                <input
                  type="text"
                  name="role"
                  value={userData.role}
                  disabled
                  className="w-full bg-gray-100 p-3 text-sm rounded-md text-gray-500 border border-gray-200 cursor-not-allowed"
                />
              </div>
            </div>

            {/* ✅ Nhập mật khẩu hiện tại để xác thực */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={userData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={`w-full bg-gray-100 p-3 text-sm rounded-md border focus:outline-none ${
                  userData.passwordError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {userData.passwordError && (
                <p className="text-sm text-red-500 mt-1">
                  {userData.passwordError}
                </p>
              )}
            </div>

            {/* ✅ Nút hành động */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="reset"
                onClick={() =>
                  setUserData((prev) => ({
                    ...prev,
                    name: "",
                    phone: "",
                    email: "",
                    currentPassword: "",
                    passwordError: "",
                  }))
                }
                className="text-sm text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-80"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* ✅ Popup kết quả */}
          {showPopup && (
            <div
              className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${
                popupType === "success"
                  ? "bg-white text-black border-green-500"
                  : "bg-white text-red-600 border-red-500"
              }`}
            >
              {popupMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
