"use client";

import { useState, useEffect } from "react";
import axios from "axios";
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

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [shopId, setShopId] = useState<number>(1); // test shop_id
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
    null
  );

  const [form] = Form.useForm();

  useEffect(() => {
    fetchAccounts();
  }, [shopId]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/payment-accounts/${shopId}`);
      setAccounts(res.data);
    } catch {
      message.error("Không thể tải danh sách tài khoản");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      const payload = {
        shop_id: shopId,
        gateway: values.gateway,
        config: JSON.parse(values.config),
        status: values.status,
      };

      if (editingAccount) {
        await axios.put(`${API_BASE_URL}/payment-accounts/${editingAccount.id}`, payload);
        message.success("Cập nhật thành công");
      } else {
        await axios.post(`${API_BASE_URL}/payment-accounts`, payload);
        message.success("Thêm mới thành công");
      }
      setIsModalOpen(false);
      form.resetFields();
      fetchAccounts();
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/payment-accounts/${id}`);
      message.success("Xóa thành công");
      fetchAccounts();
    } catch {
      message.error("Không thể xóa tài khoản");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
    },
    {
      title: "Gateway",
      dataIndex: "gateway",
    },
    {
      title: "Config",
      dataIndex: "config",
      render: (config: Record<string, any>) => (
        <pre style={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
    },
    {
      title: "Hành động",
      render: (_: any, record: PaymentAccount) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAccount(record);
              form.setFieldsValue({
                gateway: record.gateway,
                config: JSON.stringify(record.config, null, 2),
                status: record.status,
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
            rules={[{ required: true, message: "Vui lòng nhập gateway" }]}
          >
            <Input placeholder="vnpay, momo..." />
          </Form.Item>
          <Form.Item
            label="Config (JSON)"
            name="config"
            rules={[{ required: true, message: "Vui lòng nhập config" }]}
          >
            <Input.TextArea rows={4} placeholder='{"vnp_TmnCode": "..."}' />
          </Form.Item>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
