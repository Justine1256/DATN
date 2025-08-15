'use client';

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

const { Option } = Select;

interface ShopShippingAccount {
  id: number;
  provider: string;
  provider_shop_id: string;
  api_token: string;
  province_id?: number;
  district_id?: number;
  ward_code?: string;
  address?: string;
  status: string;
}

interface Province { ProvinceID: number; ProvinceName: string; }
interface District { DistrictID: number; DistrictName: string; }
interface Ward { WardCode: string; WardName: string; }

export default function ShippingAccountsPage() {
  const [accounts, setAccounts] = useState<ShopShippingAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ShopShippingAccount | null>(null);
  const [form] = Form.useForm();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const api = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: { Authorization: `Bearer ${Cookies.get("authToken")}` },
    withCredentials: true,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get<ShopShippingAccount[]>("/shop-shipping-accounts");
      setAccounts(res.data);
    } catch {
      message.error("Không thể tải dữ liệu");
    }
    setLoading(false);
  };

  const fetchProvinces = async () => {
    try {
      const res = await api.get("/ghn/provinces");
      setProvinces(res.data.data);
    } catch {
      message.error("Không thể tải danh sách tỉnh/thành");
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await api.get("/ghn/districts", { params: { province_id: provinceId } });
      setDistricts(res.data.data);
    } catch {
      message.error("Không thể tải danh sách quận/huyện");
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      const res = await api.get("/ghn/wards", { params: { district_id: districtId } });
      setWards(res.data.data);
    } catch {
      message.error("Không thể tải danh sách phường/xã");
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchProvinces();
  }, []);

  const handleOpenModal = (account: ShopShippingAccount | null = null) => {
    setEditingAccount(account);
    form.setFieldsValue(account || {});
    if (account?.province_id) fetchDistricts(account.province_id);
    if (account?.district_id) fetchWards(account.district_id);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/shop-shipping-accounts/${id}`);
      message.success("Xóa thành công");
      fetchAccounts();
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAccount) {
        await api.put(`/shop-shipping-accounts/${editingAccount.id}`, values);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/shop-shipping-accounts", values);
        message.success("Thêm mới thành công");
      }
      setIsModalVisible(false);
      fetchAccounts();
    } catch {
      message.error("Có lỗi xảy ra");
    }
  };

  const columns = [
    { title: "Provider", dataIndex: "provider" },
    { title: "Shop ID", dataIndex: "provider_shop_id" },
    { title: "Tỉnh/Thành", dataIndex: "province_id" },
    { title: "Quận/Huyện", dataIndex: "district_id" },
    { title: "Phường/Xã", dataIndex: "ward_code" },
    { title: "Trạng thái", dataIndex: "status" },
    {
      title: "Hành động",
      render: (_: any, record: ShopShippingAccount) => (
        <div className="flex gap-2">
          <Button type="link" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Quản lý Tài khoản Vận chuyển</h1>
        <Button type="primary" className="mb-4" onClick={() => handleOpenModal(null)}>Thêm mới</Button>
        <Table rowKey="id" columns={columns} dataSource={accounts} loading={loading} bordered />
      </div>

      <Modal
        title={editingAccount ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="provider" label="Nhà vận chuyển" rules={[{ required: true }]}>
            <Select>
              <Option value="GHN">GHN</Option>
              <Option value="GHTK">GHTK</Option>
              <Option value="VNPOST">VNPOST</Option>
              <Option value="J&T">J&T</Option>
              <Option value="NINJAVAN">NINJAVAN</Option>
            </Select>
          </Form.Item>

          <Form.Item name="provider_shop_id" label="Provider Shop ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="api_token" label="API Token" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item name="province_id" label="Tỉnh/Thành" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Chọn tỉnh/thành"
              onChange={(value) => {
                form.setFieldsValue({ district_id: null, ward_code: null });
                setDistricts([]);
                setWards([]);
                fetchDistricts(value);
              }}
            >
              {provinces.map((p) => (
                <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="district_id" label="Quận/Huyện" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn quận/huyện"
              onChange={(value) => {
                form.setFieldsValue({ ward_code: null });
                setWards([]);
                fetchWards(value);
              }}
              disabled={!districts.length}
            >
              {districts.map((d) => (
                <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="ward_code" label="Phường/Xã" rules={[{ required: true }]}>
            <Select placeholder="Chọn phường/xã" disabled={!wards.length}>
              {wards.map((w) => (
                <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ chi tiết">
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" initialValue="active">
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
