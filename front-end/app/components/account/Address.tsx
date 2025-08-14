'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';

const { Title, Text } = Typography;

// ✅ Interface định nghĩa tỉnh/huyện/xã và địa chỉ người dùng
interface Province {
  code: number;
  name: string;
}
interface District {
  code: number;
  name: string;
}
interface Ward {
  code: number;
  name: string;
}
interface AddressComponentProps {
  userId: number; // prop do backend cung cấp
}
interface Address {
  id?: number;
  full_name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  province: string;
  note?: string;
  is_default?: boolean;
  type: 'Nhà Riêng' | 'Văn Phòng';
}

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

function mapProvinceList(data: any): Province[] {
  const list = Array.isArray(data) ? data : data?.data || data?.results || [];
  return list.map((p: any) => ({
    code: Number(p.code ?? p.province_code ?? p.id),
    name: String(p.name ?? p.province_name ?? p.full_name).trim(),
  }));
}
function mapDistrictList(data: any): District[] {
  const list = Array.isArray(data) ? data : data?.data || data?.districts || [];
  return list.map((d: any) => ({
    code: Number(d.code ?? d.district_code ?? d.id),
    name: String(d.name ?? d.district_name ?? d.full_name).trim(),
  }));
}
function mapWardList(data: any): Ward[] {
  const list = Array.isArray(data) ? data : data?.data || data?.wards || [];
  return list.map((w: any) => ({
    code: Number(w.code ?? w.ward_code ?? w.id),
    name: String(w.name ?? w.ward_name ?? w.full_name).trim(),
  }));
}

export default function AddressComponent({ userId }: AddressComponentProps) {
  // ====== State ======
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [form] = Form.useForm<Address>();

  // ====== Helpers ======
  const token = useMemo(() => Cookies.get('authToken'), []);

  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      full_name: '',
      phone: '',
      address: '',
      ward: '',
      district: '',
      city: '',
      province: '',
      note: '',
      is_default: false,
      type: 'Nhà Riêng',
    } as any);
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (addr: Address) => {
    setEditingId(addr.id!);
    form.setFieldsValue({ ...addr });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
  };

  const triggerPopup = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') message.success(msg);
    else message.error(msg);
  };

  // ====== Fetch location data ======
  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch((e) => console.error(e));
  }, []);

  const provinceValue = Form.useWatch('province', form);
  const districtValue = Form.useWatch('district', form);

  // Khi chọn tỉnh => tải huyện
  useEffect(() => {
    if (!provinceValue || provinces.length === 0) return;
    const selectedProvince = provinces.find((p) => p.name === provinceValue);
    if (!selectedProvince) return;
    axios
      .get(`https://tinhthanhpho.com/api/v1/provinces/${selectedProvince.code}/districts`)
      .then((res) => {
        setDistricts(mapDistrictList(res.data));
        form.setFieldValue('district', '');
        form.setFieldValue('ward', '');
      })
      .catch((e) => console.error(e));
  }, [provinceValue, provinces, form]);

  // Khi chọn huyện => tải xã (API này chỉ dựa theo tỉnh như code gốc)
  useEffect(() => {
    if (!provinceValue || provinces.length === 0) return;
    const selectedProvince = provinces.find((p) => p.name === provinceValue);
    if (!selectedProvince) return;
    axios
      .get(`https://tinhthanhpho.com/api/v1/new-provinces/${selectedProvince.code}/wards`)
      .then((res) => {
        setWards(mapWardList(res.data));
        form.setFieldValue('ward', '');
      })
      .catch((e) => console.error(e));
  }, [districtValue, provinceValue, provinces, form]);

  // ====== Fetch addresses ======
  const fetchAddresses = async (id: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/addressesUser/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const sorted = [...res.data].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
      setAddresses(sorted);
    } catch (err) {
      console.error('Address fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchAddresses(String(userId));
  }, [userId]);

  // ====== Create / Update ======
  const handleAddOrUpdateAddress = async () => {
    if (!token || !userId) return;

    try {
      const values = (await form.validateFields()) as Address;

      if (!PHONE_REGEX.test(values.phone)) {
        triggerPopup('❗ Số điện thoại không hợp lệ!', 'error');
        return;
      }

      const dataToSend = {
        ...values,
        city: values.city || values.province,
        user_id: userId,
      } as const;

      const requiredFields: (keyof Address)[] = ['full_name', 'phone', 'address', 'province', 'district', 'ward'];
      const isMissing = requiredFields.some((f) => !dataToSend[f]);
      if (isMissing) {
        triggerPopup('❗ Vui lòng điền đầy đủ thông tin địa chỉ!', 'error');
        return;
      }

      if (editingId) {
        await axios.patch(`${API_BASE_URL}/addresses/${editingId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        triggerPopup('Cập nhật địa chỉ thành công!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/addresses`, dataToSend, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        triggerPopup('Thêm địa chỉ thành công!', 'success');
      }

      setDrawerOpen(false);
      setEditingId(null);
      await fetchAddresses(String(userId));
      form.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return; // lỗi validate của Form => đã hiển thị dưới form
      console.error('❌ Lỗi lưu địa chỉ:', err?.response?.data || err);
      triggerPopup('Lưu địa chỉ thất bại!', 'error');
    }
  };

  // ====== Delete ======
  const handleDelete = async () => {
    if (!confirmDeleteId || !token || !userId) return;
    try {
      await axios.delete(`${API_BASE_URL}/addresses/${String(confirmDeleteId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerPopup('Xoá địa chỉ thành công!', 'success');

      const updated = addresses.filter((a) => a.id !== confirmDeleteId);

      // Nếu chỉ còn 1 -> đặt mặc định nếu chưa
      if (updated.length === 1 && !updated[0].is_default) {
        const newDefaultId = updated[0].id;
        if (newDefaultId) {
          await axios.patch(
            `${API_BASE_URL}/addresses/${String(newDefaultId)}`,
            { ...updated[0], is_default: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      await fetchAddresses(String(userId));
    } catch (e) {
      console.error('Lỗi xoá địa chỉ:', e);
      triggerPopup('❌ Xoá thất bại!', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // ====== Render ======
  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <Card bordered style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={12}>
          <Col>
            <Row align="middle" gutter={12}>
              <Col>
                <span role="img" aria-label="pin">📍</span>
              </Col>
              <Col>
                <Title level={3} style={{ margin: 0 }}>Quản lý địa chỉ</Title>
                <Text type="secondary">Quản lý danh sách địa chỉ giao hàng của bạn</Text>
              </Col>
            </Row>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{ backgroundColor: '#db4444', borderColor: '#db4444' }}
              onClick={openDrawerForCreate}
            >
              Thêm địa chỉ mới
            </Button>

          </Col>
        </Row>
      </Card>

      <Card bordered>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : addresses.length === 0 ? (
          <Empty description="Chưa có địa chỉ nào" />
        ) : (
          <>
            <Title level={5} style={{ marginBottom: 16 }}>
              Danh sách địa chỉ ({addresses.length})
            </Title>
            <Row gutter={[16, 16]}>
              {addresses.map((addr) => (
                <Col xs={24} key={addr.id}>
                  <Card
                    hoverable
                    bordered
                    bodyStyle={{ padding: 16 }}
                    actions={[
                      <Button key="edit" type="link" onClick={() => openDrawerForEdit(addr)}>Sửa</Button>,
                      <Button key="delete" type="link" danger onClick={() => setConfirmDeleteId(addr.id!)}>Xoá</Button>,
                    ]}
                  >
                    <Row justify="space-between" align="top">
                      <Col flex="auto">
                        <Row gutter={[8, 8]} align="middle">
                          <Col>
                            <Text strong>{addr.full_name}</Text>
                          </Col>
                          <Col>
                            <Text>{addr.phone}</Text>
                          </Col>
                        </Row>
                        <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                          <Col>
                            <span role="img" aria-label="pin">📍</span>
                          </Col>
                          <Col flex="auto">
                            <div>
                              <Text>{addr.address}</Text>
                              <div>
                                <Text>
                                  {addr.ward}, {addr.district}, {addr.city}
                                </Text>
                              </div>
                            </div>
                          </Col>
                        </Row>
                        <Row gutter={8} style={{ marginTop: 8 }}>
                          <Col>
                            <Tag color={addr.type === 'Nhà Riêng' ? 'green' : 'orange'}>{addr.type}</Tag>
                          </Col>
                          {addr.is_default && (
                            <Col>
                              <Tag color="#db4444">Mặc định</Tag>

                            </Col>
                          )}
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* Drawer: Thêm / Sửa */}
      <Drawer
        title={editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
        width={720}
        onClose={closeDrawer}
        open={drawerOpen}
        destroyOnClose
        extra={
          <Row gutter={8}>
            <Col>
              <Button onClick={closeDrawer}>Huỷ</Button>
            </Col>
            <Col>
              <Button
                type="primary"
                style={{ backgroundColor: '#db4444', borderColor: '#db4444' }}
                onClick={handleAddOrUpdateAddress}
              >
                Lưu
              </Button>

            </Col>
          </Row>
        }
      >
        <Form form={form} layout="vertical" requiredMark>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="full_name"
                label="Họ tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Họ tên" allowClear />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: PHONE_REGEX, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input placeholder="Số điện thoại" allowClear />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="address"
                label="Địa chỉ cụ thể"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
              >
                <Input placeholder="Số nhà, tên đường..." allowClear />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="province"
                label="Tỉnh/TP"
                rules={[{ required: true, message: 'Chọn Tỉnh/TP' }]}
              >
                <Select
                  placeholder="Chọn Tỉnh/TP"
                  showSearch
                  optionFilterProp="label"
                  options={provinces.map((p) => ({ label: p.name, value: p.name }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="district"
                label="Quận/Huyện"
                rules={[{ required: true, message: 'Chọn Quận/Huyện' }]}
              >
                <Select
                  placeholder="Chọn Quận/Huyện"
                  showSearch
                  optionFilterProp="label"
                  options={districts.map((d) => ({ label: d.name, value: d.name }))}
                  disabled={!provinceValue}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="ward"
                label="Phường/Xã"
                rules={[{ required: true, message: 'Chọn Phường/Xã' }]}
              >
                <Select
                  placeholder="Chọn Phường/Xã"
                  showSearch
                  optionFilterProp="label"
                  options={wards.map((w) => ({ label: w.name, value: w.name }))}
                  disabled={!districtValue}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="type" label="Loại" initialValue="Nhà Riêng">
                <Select
                  options={[
                    { label: 'Nhà Riêng', value: 'Nhà Riêng' },
                    { label: 'Văn Phòng', value: 'Văn Phòng' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="is_default" valuePropName="checked" label=" ">
                <Checkbox>Làm mặc định</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Modal xác nhận xoá */}
      <Modal
        open={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onOk={handleDelete}
        okText="Xoá"
        okButtonProps={{ danger: true, style: { backgroundColor: '#db4444', borderColor: '#db4444' } }}
        cancelButtonProps={{ style: { borderColor: '#db4444', color: '#db4444' } }}
        cancelText="Huỷ"
        title={<Text strong>Xác nhận xoá địa chỉ</Text>}
      >

      </Modal>
    </div>
  );
}
