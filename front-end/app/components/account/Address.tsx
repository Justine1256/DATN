'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

/** ===== Types ===== */
interface Province {
  code: string; // API trả string ("01",...)
  name: string;
}
interface Ward {
  code: string; // API trả string ("00070",...)
  name: string;
}
interface AddressComponentProps {
  userId: number;
}
interface Address {
  id?: number;
  full_name: string;
  phone: string;
  address: string;   // Tên đường, số nhà
  ward: string;      // Phường/Xã
  city: string;      // = province (tên)
  province: string;  // Tỉnh/TP (tên)
  district?: string; // Ẩn UI, auto-fill = ward | "Khác"
  note?: string;
  is_default?: boolean;
  type: 'Nhà Riêng' | 'Văn Phòng';
}

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/** ===== Helpers map API ===== */
function mapProvinceList(data: any): Province[] {
  const list = Array.isArray(data) ? data : data?.data || data?.results || [];
  return list.map((p: any) => ({
    code: String(p.code ?? p.province_code ?? p.id),
    name: String(p.name ?? p.province_name ?? p.full_name).trim(),
  }));
}
function mapWardList(data: any): Ward[] {
  const list = Array.isArray(data) ? data : data?.data || data?.wards || [];
  return list.map((w: any) => ({
    code: String(w.code ?? w.ward_code ?? w.id),
    name: String(w.name ?? w.ward_name ?? w.full_name).trim(),
  }));
}

export default function AddressComponent({ userId }: AddressComponentProps) {
  /** ===== State ===== */
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [form] = Form.useForm();

  /** ===== NEW: ref cho vùng main để modal render vào ===== */
  const mainRef = useRef<HTMLDivElement>(null);

  /** ===== Token ===== */
  const token = useMemo(() => Cookies.get('authToken'), []);

  /** ===== Memo options ===== */
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ label: p.name, value: p.code })),
    [provinces]
  );
  const wardOptions = useMemo(
    () => wards.map((w) => ({ label: w.name, value: w.name })), // value = tên ward
    [wards]
  );

  /** ===== UI helpers ===== */
  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      full_name: '',
      phone: '',
      address: '',
      provinceCode: undefined,
      province: '',
      ward: '',
      district: '', // hidden
      note: '',
      is_default: false,
      type: 'Nhà Riêng',
    });
    setWards([]);
    setDrawerOpen(true);
  };

  const openDrawerForEdit = async (addr: Address) => {
    setEditingId(addr.id!);
    // set trước để form hiển thị
    form.setFieldsValue({
      ...addr,
      provinceCode: undefined,
      district: addr.district || addr.ward || '', // hidden
    });

    // tìm code tỉnh theo tên để nạp Select + wards
    const found = provinces.find((p) => p.name === addr.province);
    if (found) {
      form.setFieldValue('provinceCode', found.code);
      setWardsLoading(true);
      try {
        const res = await axios.get(
          `https://tinhthanhpho.com/api/v1/new-provinces/${found.code}/wards`
        );
        const ws = mapWardList(res.data);
        setWards(ws);
        form.setFieldValue('ward', addr.ward || '');
        // đồng bộ lại district ẩn
        form.setFieldValue('district', addr.district || addr.ward || '');
      } catch {
        setWards([]);
      } finally {
        setWardsLoading(false);
      }
    } else {
      setWards([]);
    }

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

  /** ===== Load Provinces ===== */
  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(() => { });
  }, []);

  /** ===== Watch provinceCode -> load wards ===== */
  const provinceCode = Form.useWatch('provinceCode', form);
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      form.setFieldValue('ward', '');
      form.setFieldValue('district', '');
      return;
    }
    setWardsLoading(true);
    axios
      .get(`https://tinhthanhpho.com/api/v1/new-provinces/${provinceCode}/wards`)
      .then((res) => {
        setWards(mapWardList(res.data));
        form.setFieldValue('ward', '');
        form.setFieldValue('district', '');
      })
      .catch(() => { })
      .finally(() => setWardsLoading(false));
  }, [provinceCode, form]);

  /** ===== Watch ward -> auto set district hidden ===== */
  const wardValue = Form.useWatch('ward', form);
  useEffect(() => {
    if (wardValue !== undefined) {
      form.setFieldValue('district', wardValue || '');
    }
  }, [wardValue, form]);

  /** ===== Fetch addresses ===== */
  const fetchAddresses = async (id: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/addressesUser/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const sorted = [...res.data].sort(
        (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)
      );
      setAddresses(sorted);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchAddresses(String(userId));
  }, [userId]);

  /** ===== Create / Update ===== */
  const handleAddOrUpdateAddress = async () => {
    if (!token || !userId) return;
    try {
      const raw = await form.validateFields();

      if (!PHONE_REGEX.test(raw.phone)) {
        triggerPopup('❗ Số điện thoại không hợp lệ!', 'error');
        return;
      }

      const district = raw.district || raw.ward || 'Khác';

      const dataToSend: Address & { user_id: number } = {
        full_name: raw.full_name,
        phone: raw.phone,
        address: raw.address,
        ward: raw.ward,
        province: raw.province, // tên tỉnh
        city: raw.province,     // tương thích BE
        district,               // ẩn UI
        note: raw.note || '',
        is_default: !!raw.is_default,
        type: (raw.type as Address['type']) || 'Nhà Riêng',
        user_id: userId,
      };

      const required = ['full_name', 'phone', 'address', 'province', 'ward'] as const;
      if (required.some((k) => !dataToSend[k])) {
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
      if (err?.errorFields) return; // lỗi validate Form
      triggerPopup(err?.response?.data?.message || 'Lưu địa chỉ thất bại!', 'error');
    }
  };

  /** ===== Delete ===== */
  const handleDelete = async () => {
    if (!confirmDeleteId || !token || !userId) return;
    try {
      await axios.delete(`${API_BASE_URL}/addresses/${String(confirmDeleteId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerPopup('Xoá địa chỉ thành công!', 'success');

      const updated = addresses.filter((a) => a.id !== confirmDeleteId);

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
    } catch {
      triggerPopup('❌ Xoá thất bại!', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  /** ===== Render ===== */
  return (
    <div ref={mainRef} style={{ minHeight: '100vh', padding: 24 }}>
      <Card bordered style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={12}>
          <Col>
            <Row align="middle" gutter={12}>
              <Col>📍</Col>
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  Quản lý địa chỉ
                </Title>
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
                      <Button key="edit" type="link" onClick={() => openDrawerForEdit(addr)}>
                        Sửa
                      </Button>,
                      <Button key="delete" type="link" danger onClick={() => setConfirmDeleteId(addr.id!)}>
                        Xoá
                      </Button>,
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
                          <Col>📍</Col>
                          <Col flex="auto">
                            <div>
                              <Text>{addr.address}</Text>
                              <div>
                                <Text>
                                  {addr.ward}, {addr.city}
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
          {/* Hidden fields để submit */}
          <Form.Item name="province" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="district" hidden initialValue="">
            <Input />
          </Form.Item>

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
                <Input placeholder="Tên đường, số nhà..." allowClear />
              </Form.Item>
            </Col>

            {/* Tỉnh/TP */}
            <Col xs={24} md={12}>
              <Form.Item
                name="provinceCode"
                label="Tỉnh/TP"
                rules={[{ required: true, message: 'Chọn Tỉnh/TP' }]}
              >
                <Select
                  placeholder="Chọn Tỉnh/TP"
                  showSearch
                  optionFilterProp="label"
                  options={provinceOptions}
                  virtual
                  listHeight={256}
                  listItemHeight={32}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
                  getPopupContainer={(trigger) => trigger.parentElement!}
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(code) => {
                    const found = provinces.find((p) => p.code === code);
                    form.setFieldValue('province', found?.name || '');
                  }}
                />
              </Form.Item>
            </Col>

            {/* Phường/Xã */}
            <Col xs={24} md={12}>
              <Form.Item
                name="ward"
                label="Phường/Xã"
                rules={[{ required: true, message: 'Chọn Phường/Xã' }]}
              >
                <Select
                  placeholder="Chọn Phường/Xã"
                  showSearch
                  optionFilterProp="label"
                  options={wardOptions}
                  disabled={!provinceCode}
                  loading={wardsLoading}
                  virtual
                  listHeight={256}
                  listItemHeight={32}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
                  getPopupContainer={(trigger) => trigger.parentElement!}
                  onChange={(val) => form.setFieldValue('district', val || '')}
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
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

      {/* Modal xác nhận xoá — canh giữa vùng main */}
      <Modal
        open={!!confirmDeleteId}
        centered
        getContainer={() => mainRef.current!}
        onCancel={() => setConfirmDeleteId(null)}
        onOk={handleDelete}
        okText="Xoá"
        okButtonProps={{ danger: true, style: { backgroundColor: '#db4444', borderColor: '#db4444' } }}
        cancelButtonProps={{ style: { borderColor: '#db4444', color: '#db4444' } }}
        cancelText="Huỷ"
        title={<Text strong>Xác nhận xoá địa chỉ</Text>}
      />
    </div>
  );
}
