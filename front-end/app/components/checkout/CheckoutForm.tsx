'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

import {
  ConfigProvider,
  Card,
  Form,
  Input,
  Select,
  Tag,
  Typography,
  Checkbox,
  Space,
} from 'antd';

const { Text } = Typography;

/** ===== Types ===== */
interface Address {
  id: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  is_default: number | boolean;
}

interface Province {
  code: number;
  name: string;
}
interface Ward {
  code: number;
  name: string;
  district?: string; // ✅ để phát city "Ward, District, Province"
}

export interface ManualAddress {
  full_name: string;
  address: string;  // street + apartment (nếu có)
  city: string;     // "Ward, District, Province"
  phone: string;
  email: string;
}

interface Props {
  onAddressSelect: (id: number | null) => void;                 // phát id địa chỉ đã lưu (nếu dùng)
  onAddressChange: (manualData: ManualAddress | null) => void;  // phát dữ liệu nhập tay (nếu dùng)
  onSaveAddressToggle?: (save: boolean) => void;                // phát trạng thái checkbox “lưu địa chỉ”
}

const MANUAL_OPTION = '__MANUAL__';

export default function CheckoutForm({ onAddressSelect, onAddressChange, onSaveAddressToggle }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // id địa chỉ đã lưu
  const [disableForm, setDisableForm] = useState(false);

  const [saveAddress, setSaveAddress] = useState<boolean>(false); // ✅ checkbox “Lưu địa chỉ này”
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ chế độ tự nhập địa chỉ mới (điều khiển bởi option MANUAL_OPTION trong Select)
  const [manualMode, setManualMode] = useState(false);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    streetAddress: '',
    apartment: '',
    phone: '',
    email: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // --- Helpers map API ---
  const mapProvinceList = (data: any): Province[] => {
    const list = Array.isArray(data) ? data : data?.data || [];
    return list.map((p: any) => ({
      code: Number(p.code ?? p.province_code ?? p.id),
      name: String(p.name ?? p.province_name ?? p.full_name).trim(),
    }));
  };
  const mapWardList = (data: any): Ward[] => {
    const list = Array.isArray(data) ? data : data?.data || data?.wards || [];
    return list.map((w: any) => ({
      code: Number(w.code ?? w.ward_code ?? w.id),
      name: String(w.name ?? w.ward_name ?? w.full_name).trim(),
      district: String(w.district_name ?? w.district?.name ?? w.district ?? '').trim(),
    }));
  };

  // Load provinces
  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(console.error);
  }, []);

  // Load user's addresses & chọn mặc định (nếu không ở chế độ tự nhập)
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      .then((res) => {
        const userId = res.data.id;
        return axios.get(`${API_BASE_URL}/addressesUser/${userId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      })
      .then((res) => {
        const sorted = (res.data as Address[]).sort(
          (a, b) => Number(b.is_default) - Number(a.is_default)
        );
        setAddresses(sorted);

        const def = sorted.find((a) => !!a.is_default);
        if (def && !manualMode) {
          const idStr = String(def.id);
          setSelectedAddressId(idStr);
          setDisableForm(true);
          setSaveAddress(false);
          onAddressSelect(Number(def.id));
          onAddressChange(null);
          onSaveAddressToggle?.(false);
        }
      })
      .catch(console.error);
  }, [onAddressSelect, onAddressChange, onSaveAddressToggle, manualMode]);

  // Load wards khi chọn tỉnh
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    axios
      .get(`https://tinhthanhpho.com/api/v1/new-provinces/${selectedProvince.code}/wards`)
      .then((res) => {
        setWards(mapWardList(res.data));
        setSelectedWard(null);
      })
      .catch(console.error);
  }, [selectedProvince]);

  // địa chỉ mặc định
  const defaultAddress = useMemo(
    () => addresses.find(a => !!a.is_default) || null,
    [addresses]
  );

  // có nhập tay không?
  const hasManualInput = useMemo(() => {
    const anyForm = Object.values(formData).some((v) => v.trim() !== '');
    return !!(anyForm || selectedProvince || selectedWard);
  }, [formData, selectedProvince, selectedWard]);

  // ====== Chọn option trong Select (tự nhập hoặc địa chỉ đã lưu) ======
  const handleAddressSelectChange = useCallback(
    (value: string | undefined) => {
      // Clear
      if (value === undefined) {
        setManualMode(false);
        setSelectedAddressId('');
        setDisableForm(false);
        onAddressSelect(null);
        onAddressChange(null);
        setSaveAddress(false);
        onSaveAddressToggle?.(false);
        return;
      }

      // Chọn "Tự nhập địa chỉ mới"
      if (value === MANUAL_OPTION) {
        setManualMode(true);
        setSelectedAddressId('');
        setDisableForm(false);
        onAddressSelect(null);
        onAddressChange(null);
        setSaveAddress(false);
        onSaveAddressToggle?.(false);
        return;
      }

      // Chọn 1 địa chỉ đã lưu
      setManualMode(false);
      setSelectedAddressId(value);
      setDisableForm(true);

      // reset form (đang dùng saved address)
      setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
      setSelectedProvince(null);
      setSelectedWard(null);
      setPhoneError(null);
      setEmailError(null);

      onAddressSelect(Number(value));
      onAddressChange(null);
      setSaveAddress(false);
      onSaveAddressToggle?.(false);
    },
    [onAddressSelect, onAddressChange, onSaveAddressToggle]
  );

  // Nhập form tay
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      if (!manualMode) return; // chỉ được nhập khi ở chế độ tự nhập

      const updated = { ...formData, [field]: value };

      if (field === 'phone') {
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        setPhoneError(value.trim() && !phoneRegex.test(value) ? 'Số điện thoại không hợp lệ' : null);
      }
      if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailError(value.trim() && !emailRegex.test(value) ? 'Email không hợp lệ' : null);
      }

      setFormData(updated);
    },
    [formData, manualMode]
  );

  // Phát dữ liệu nhập tay ra ngoài – city: "Ward, District, Province"
  useEffect(() => {
    if (!manualMode) return; // chỉ phát khi tự nhập
    if (hasManualInput && !phoneError) {
      onAddressChange({
        full_name: formData.firstName,
        address: `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}`,
        city: `${selectedWard?.name || ''}, ${selectedWard?.district || ''}, ${selectedProvince?.name || ''}`,
        phone: formData.phone,
        email: formData.email,
      });
    } else {
      onAddressChange(null);
    }
  }, [
    manualMode,
    hasManualInput,
    phoneError,
    formData,
    selectedProvince,
    selectedWard,
    onAddressChange,
  ]);

  // Province/Ward change
  const handleProvinceChange = useCallback(
    (value: number | null) => {
      if (!manualMode) return;
      const found = value ? provinces.find((p) => p.code === value) || null : null;
      setSelectedProvince(found);
      setSelectedWard(null);
    },
    [provinces, manualMode]
  );
  const handleWardChange = useCallback(
    (value: number | null) => {
      if (!manualMode) return;
      const found = value ? wards.find((w) => w.code === value) || null : null;
      setSelectedWard(found);
    },
    [wards, manualMode]
  );

  // Tick “lưu địa chỉ”
  const handleToggleSave = (checked: boolean) => {
    if (!manualMode) {
      // đang dùng saved address thì không cho lưu lại (vốn đã có)
      setSaveAddress(false);
      onSaveAddressToggle?.(false);
      return;
    }
    setSaveAddress(checked);
    onSaveAddressToggle?.(checked);
  };

  // rút gọn text địa chỉ trong select saved
  const formatSavedAddress = (a: Address) => {
    const base = `${a.address}, ${a.ward}${a.district ? ', ' + a.district : ''}, ${a.city}`;
    const max = 70;
    return base.length > max ? base.slice(0, max - 1) + '…' : base;
  };

  // ====== Options cho Select (nhóm: Tuỳ chọn / Địa chỉ đã lưu) ======
  const selectValue = manualMode ? MANUAL_OPTION : (selectedAddressId || undefined);

  const selectOptions = useMemo(() => {
    const manualGroup = {
      label: 'Tuỳ chọn',
      options: [
        {
          value: MANUAL_OPTION,
          data: 'tu nhap dia chi moi',
          label: <span style={{ color: '#DB4444', fontWeight: 600 }}>+ Tự nhập địa chỉ mới</span>,
        },
      ],
    };

    const savedGroup = {
      label: 'Địa chỉ đã lưu',
      options: addresses.map((addr) => ({
        value: String(addr.id),
        data: `${addr.address}, ${addr.ward}${addr.district ? ', ' + addr.district : ''}, ${addr.city}`,
        label: (
          <Space size={6}>
            <span>{formatSavedAddress(addr)}</span>
            {addr.is_default ? <Tag color="processing">Mặc định</Tag> : null}
          </Space>
        ),
      })),
    };

    // Nếu chưa có địa chỉ đã lưu, chỉ hiển thị group Tuỳ chọn
    return addresses.length ? [manualGroup, savedGroup] : [manualGroup];
  }, [addresses]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#DB4444', borderRadius: 10 },
        components: {
          Select: {
            borderRadius: 10,
            optionSelectedBg: 'rgba(219,68,68,0.08)',
          },
          Input: { borderRadius: 10 },
          Card: { borderRadiusLG: 16 },
        },
      }}
    >
      <Card
        title={<span className="font-semibold">Thanh toán</span>}
        styles={{ header: { borderBottom: 'none' } }}
      >
        <Form layout="vertical" className="max-w-2xl">
          {/* ====== Select: Tự nhập / Địa chỉ đã lưu ====== */}
          <Form.Item label="Địa chỉ nhận hàng">
            <Select
              allowClear
              showSearch
              placeholder={
                addresses.length
                  ? '-- Chọn địa chỉ giao hàng hoặc tự nhập --'
                  : 'Chưa có địa chỉ – hãy chọn “Nhập địa chỉ mới”'
              }
              value={selectValue}
              onChange={(val) => handleAddressSelectChange(val as string | undefined)}
              optionFilterProp="data"
              options={selectOptions as any}
              dropdownMatchSelectWidth={false}
              style={{ width: '100%' }}
            />
            <Text type="secondary">
              {manualMode
                ? 'Bạn đang ở chế độ tự nhập bên dưới.'
                : 'Hoặc chọn “+ Nhập địa chỉ mới” ở đầu danh sách.'}
            </Text>
          </Form.Item>

          {/* ====== Manual form (mở khi chọn TỰ NHẬP) ====== */}
          <Form.Item label="Họ tên" required>
            <Input
              placeholder="Nguyễn Văn A"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item label="Số nhà, tòa nhà, căn hộ..." required>
            <Input
              placeholder="Số 123, Block B…"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item label="Tên đường" required>
            <Input
              placeholder="Nguyễn Trãi…"
              value={formData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item label="Tỉnh/Thành phố" required>
            <Select
              allowClear
              showSearch
              placeholder="Chọn Tỉnh/Thành phố"
              disabled={!manualMode}
              value={selectedProvince?.code}
              onChange={(v) => handleProvinceChange(v ?? null)}
              options={provinces.map((p) => ({ value: p.code, label: p.name }))}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            required
            extra={selectedWard?.district ? `Quận/Huyện: ${selectedWard.district}` : undefined}
          >
            <Select
              allowClear
              showSearch
              placeholder="Chọn Phường/Xã"
              disabled={!manualMode || wards.length === 0}
              value={selectedWard?.code}
              onChange={(v) => handleWardChange(v ?? null)}
              options={wards.map((w) => ({ value: w.code, label: w.name }))}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            required
            validateStatus={phoneError ? 'error' : undefined}
            help={phoneError || undefined}
          >
            <Input
              inputMode="tel"
              placeholder="0xxxxxxxxx"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            required
            validateStatus={emailError ? 'error' : undefined}
            help={emailError || undefined}
          >
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          {isLoggedIn && (
            <Form.Item>
              <Checkbox
                checked={!!saveAddress}
                onChange={(e) => handleToggleSave(e.target.checked)}
                disabled={!manualMode}
              >
                Lưu địa chỉ này cho lần sau
              </Checkbox>
            </Form.Item>
          )}
        </Form>
      </Card>
    </ConfigProvider>
  );
}
