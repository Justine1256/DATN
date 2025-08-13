"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "@/utils/api";

interface PaymentAccount {
  id: number;
  shop_id: number;
  gateway: string;
  config: Record<string, any>;
  status: string;
}

// 🛠 Cấu hình các field config cho từng gateway
const gatewayConfigs: Record<
  string,
  { name: string; label: string; placeholder?: string }[]
> = {
  vnpay: [
    { name: "vnp_TmnCode", label: "VNPAY TmnCode", placeholder: "ABC123" },
    { name: "vnp_HashSecret", label: "VNPAY HashSecret", placeholder: "XYZ" },
    {
      name: "vnp_Url",
      label: "VNPAY URL",
      placeholder:
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    },
  ],
  momo: [
    { name: "partnerCode", label: "Partner Code", placeholder: "MOMOPARTNER123" },
    { name: "accessKey", label: "Access Key", placeholder: "ACCESS123" },
    { name: "secretKey", label: "Secret Key", placeholder: "SECRET123" },
  ],
  payos: [
    { name: "clientId", label: "Client ID", placeholder: "CLIENT123" },
    { name: "apiKey", label: "API Key", placeholder: "APIKEY123" },
  ],
};

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [shopId] = useState<number>(1); // shop_id fix sẵn
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
    null
  );
  const [selectedGateway, setSelectedGateway] = useState<string>("");

  const [form] = Form.useForm();
  const token = Cookies.get("authToken");

  useEffect(() => {
    fetchAccounts();
  }, [shopId]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/payment-accounts/${shopId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAccounts(res.data);
    } catch {
      message.error("Không thể tải danh sách tài khoản");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue();

      // Tạo object config từ các field config động
      const config: Record<string, any> = {};
      if (gatewayConfigs[selectedGateway]) {
        gatewayConfigs[selectedGateway].forEach((field) => {
          config[field.name] = values[field.name];
        });
      }

      const payload = {
        shop_id: shopId,
        gateway: selectedGateway,
        config,
        status: values.status,
      };

      if (editingAccount) {
        await axios.put(
          `${API_BASE_URL}/payment-accounts/${editingAccount.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Cập nhật thành công");
      } else {
        await axios.post(`${API_BASE_URL}/payment-accounts`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Thêm mới thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchAccounts();
    } catch (error: any) {
      console.error(error?.response?.data || error);
      message.error("Có lỗi xảy ra khi lưu");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/payment-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Xóa thành công");
      fetchAccounts();
    } catch {
      message.error("Không thể xóa tài khoản");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Gateway", dataIndex: "gateway" },
    {
      title: "Config",
      dataIndex: "config",
      render: (config: Record<string, any>) => (
        <pre style={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      ),
    },
    { title: "Trạng thái", dataIndex: "status" },
    {
      title: "Hành động",
      render: (_: any, record: PaymentAccount) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAccount(record);
              setSelectedGateway(record.gateway);
              form.setFieldsValue({
                gateway: record.gateway,
                status: record.status,
                ...record.config, // điền các field config
              });
              setIsModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
        Quản lý cổng thanh toán
      </h1>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingAccount(null);
          setSelectedGateway("");
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Thêm mới
      </Button>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        bordered
      />

      <Modal
        title={editingAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Gateway"
            name="gateway"
            rules={[{ required: true, message: "Vui lòng chọn gateway" }]}
          >
            <Select
              placeholder="Chọn gateway"
              onChange={(val) => setSelectedGateway(val)}
              value={selectedGateway}
            >
              <Select.Option value="vnpay">VNPAY</Select.Option>
              <Select.Option value="momo">MoMo</Select.Option>
              <Select.Option value="payos">PayOS</Select.Option>
            </Select>
          </Form.Item>

          {/* Render form config động */}
          {selectedGateway &&
            gatewayConfigs[selectedGateway]?.map((field) => (
              <Form.Item
                key={field.name}
                label={field.label}
                name={field.name}
                rules={[{ required: true, message: `Vui lòng nhập ${field.label}` }]}
              >
                <Input placeholder={field.placeholder} />
              </Form.Item>
            ))}

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
