"use client";
import React, { useEffect } from "react";
import PerformanceChart from "../../components/dashboard/PerformanceChart";
import SummaryCards from "../../components/dashboard/SummaryCards";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

export default function DashboardPage() {
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Kiểm tra nếu vừa đăng nhập xong
    if (localStorage.getItem("justLoggedIn") === "true") {
      // Thêm style sweetalert2 cho nút close
      const style = document.createElement("style");
      style.innerHTML = `
        .swal2-close {
          color: #999 !important;
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .swal2-close:hover {
          color: red !important;
        }
      `;
      document.head.appendChild(style);

      // Show popup
      Swal.fire({
        title: "Chào mừng trở lại!",
        text: "Bạn đang xem bảng điều khiển tổng quan.",
        icon: "info",
        showCloseButton: true,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        allowOutsideClick: true,
      });

      // Đảm bảo chỉ hiển thị 1 lần
      localStorage.removeItem("justLoggedIn");

      // Cleanup
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      <SummaryCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <PerformanceChart />
      </div>
    </div>
  );
}
