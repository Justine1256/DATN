"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

// Ant Design
import {
  ConfigProvider,
  Card,
  Typography,
  Input,
  Button,
  Space,
} from "antd";
import {
  LockOutlined,
  CheckCircleTwoTone,
  CloseOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// ✅ Types
type PopupType = "success" | "error";

export default function ChangePassword() {
  // --- giữ nguyên logic/state ---
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [popup, setPopup] = useState({ message: "", type: "success" as PopupType });
  const [showPopup, setShowPopup] = useState(false);
  const [errorField, setErrorField] = useState("");

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorField("");
  };

  const showAlert = (msg: string, type: PopupType) => {
    setPopup({ message: msg, type });
    setShowPopup(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = formData;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return showAlert("Vui lòng điền đầy đủ các trường.", "error");
    }

    if (newPassword !== confirmNewPassword) {
      return showAlert("Mật khẩu mới không khớp.", "error");
    }

    try {
      const token = Cookies.get("authToken");

      const payload = {
        current_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      };

      const res = await axios.put(`${API_BASE_URL}/user`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.message?.toLowerCase().includes("thành công")) {
        showAlert("Đổi mật khẩu thành công!", "success");
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setErrorField("");
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Đổi mật khẩu thất bại.";
      showAlert(msg, "error");
      if (msg.toLowerCase().includes("mật khẩu hiện tại")) {
        setErrorField("oldPassword");
      }
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#DB4444",
          borderRadius: 12,
        },
        components: {
          Button: { controlHeight: 40 },
        },
      }}
    >
      <div className="w-full flex justify-center">
        <div className="container mx-auto px-4 mt-8">
          <div className="w-full max-w-[440px] mx-auto pt-6 text-black">
            <form onSubmit={handleSubmit}>
              <Card
                className="shadow-md"
                bordered={false}
                style={{ borderRadius: 12, overflow: "hidden" }}
                styles={{ body: { padding: 0 } }}
                headStyle={{ padding: 0, borderBottom: "none", background: "#fff" }}
                // ▼▼ Header kiểu mới: icon tròn + tiêu đề + mô tả + hairline
                title={
                  <div style={{ position: "relative", padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#fff1f0",
                          color: "#DB4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "inset 0 0 0 1px #ffd6d6",
                        }}
                      >
                        <LockOutlined />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
                          Thay đổi mật khẩu
                        </div>
                        <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 2 }}>
                          Cập nhật mật khẩu để bảo vệ tài khoản
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 1,
                        background: "#f0f0f0",
                      }}
                    />
                  </div>
                }
              >
                <div style={{ padding: 24 }}>
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    {/* Mật khẩu hiện tại */}
                    <div>
                      <Text style={{ fontWeight: 500 }}>Mật khẩu hiện tại</Text>
                      <Input.Password
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu hiện tại"
                        size="large"
                        status={errorField === "oldPassword" ? "error" : ""}
                        prefix={<LockOutlined />}
                        style={{ background: "#f5f5f5" }}
                      />
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                      <Text style={{ fontWeight: 500 }}>Mật khẩu mới</Text>
                      <Input.Password
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu mới"
                        size="large"
                        prefix={<LockOutlined />}
                        style={{ background: "#f5f5f5" }}
                      />
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <Text style={{ fontWeight: 500 }}>Nhập lại mật khẩu mới</Text>
                      <Input.Password
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        placeholder="Xác nhận mật khẩu mới"
                        size="large"
                        prefix={<LockOutlined />}
                        style={{ background: "#f5f5f5" }}
                      />
                    </div>

                    {/* Hành động */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                      <Button
                        htmlType="button"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setFormData({
                            oldPassword: "",
                            newPassword: "",
                            confirmNewPassword: "",
                          });
                          setErrorField("");
                        }}
                      >
                        Hủy bỏ
                      </Button>

                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        style={{ backgroundColor: "#DB4444", borderColor: "#DB4444" }}
                      >
                        Lưu mật khẩu
                      </Button>
                    </div>
                  </Space>
                </div>
              </Card>
            </form>

            {/* ✅ Thông báo (giữ nguyên cơ chế popup cũ) */}
            {showPopup && (
              <div
                className={`fixed top-20 right-5 z-[9999] px-4 py-2 rounded shadow-lg border-b-4 text-sm animate-slideInFade ${popup.type === "success"
                    ? "bg-white text-black border-green-500"
                    : "bg-white text-red-600 border-red-500"
                  }`}
              >
                <Space>
                  {popup.type === "success" ? (
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  ) : (
                    <LockOutlined />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: popup.message }} />
                </Space>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* animation cho popup (giữ nguyên) */}
      <style jsx global>{`
        @keyframes slideInFade {
          0% {
            opacity: 0;
            transform: translateX(50%);
          }
          50% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInFade {
          animation: slideInFade 0.4s ease forwards;
        }
      `}</style>
    </ConfigProvider>
  );
}
