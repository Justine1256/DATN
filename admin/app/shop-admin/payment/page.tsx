"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Table, Button, Space, message, Tag } from "antd";
import { API_BASE_URL } from "@/utils/api";
import Link from "next/link";

interface PaymentAccount {
  id: number;
  shop_id: number;
  gateway: string;
  config: Record<string, any>;
  status: "active" | "inactive";
}

export default function PaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const token = Cookies.get("authToken");
  const shopId = 1; // tuỳ bạn lấy từ store/session

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/payment-accounts/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data);
    } catch (e: any) {
      message.error("Không thể load tài khoản thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const connect = async (provider: string) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payment/connect/${provider}`,
        { shop_id: shopId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const url = res.data?.url;
      if (!url) {
        message.error("Không lấy được URL kết nối");
        return;
      }
      // redirect sang đối tác
      window.location.href = url;
    } catch (e: any) {
      console.error(e?.response?.data || e);
      message.error("Không thể tạo phiên kết nối");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Gateway", dataIndex: "gateway" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (v: string) =>
        v === "active" ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>,
    },
    {
      title: "Config",
      dataIndex: "config",
      render: (config: Record<string, any>) => (
        <pre style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý cổng thanh toán (Kết nối tự động)</h2>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => connect("vnpay")}>
          Kết nối VNPAY
        </Button>
        <Button onClick={() => connect("momo")}>Kết nối MoMo</Button>
        <Button onClick={fetchAccounts}>Làm mới</Button>
        <Link href="/payment/success">Trang kết quả</Link>
      </Space>

      <Table
        rowKey="id"
        columns={columns as any}
        loading={loading}
        dataSource={accounts}
        bordered
      />
    </div>
  );
}
