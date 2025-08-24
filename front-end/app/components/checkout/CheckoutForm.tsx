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
  id: string | number;
  address: string;       // tên đường, số nhà
  ward: string;          // phường/xã (text)
  district?: string;     // quận/huyện (text)
  city: string;          // nhiều BE dùng city = province (text)
  province?: string;     // nếu BE tách riêng (text)
  is_default: number | boolean;

  // nếu BE có lưu kèm thông tin liên hệ
  full_name?: string;
  phone?: string;
  email?: string;
}

interface Province { code: number; name: string }
interface Ward { code: number; name: string; district?: string }

export interface ManualAddress {
  full_name: string;
  address: string;    // street + apartment
  city: string;       // "Ward, District, Province"
  phone: string;
  email: string;
  editing_id?: number | string | null; // <-- để OrderSummary PATCH
}

interface Props {
  onAddressSelect: (id: number | null) => void;                 // phát id địa chỉ đã lưu (nếu dùng)
  onAddressChange: (manualData: ManualAddress | null) => void;  // phát dữ liệu nhập tay (nếu dùng)
  onSaveAddressToggle?: (save: boolean) => void;                // chỉ phát cờ, KHÔNG gọi API ở đây
}

const MANUAL_OPTION = '__MANUAL__';
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

export default function CheckoutForm({ onAddressSelect, onAddressChange, onSaveAddressToggle }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // id đang hiển thị trên Select
  const [manualMode, setManualMode] = useState(false);                    // mở form nhập/sửa
  const [saveAddress, setSaveAddress] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ĐỊA CHỈ ĐANG CHỈNH (để PATCH khi đặt hàng)
  const [editingSavedId, setEditingSavedId] = useState<number | string | null>(null);

  // profile để fallback liên hệ
  const [profile, setProfile] = useState<{ name?: string; phone?: string; email?: string }>({});

  // form state
  const [formData, setFormData] = useState({
    firstName: '',
    streetAddress: '',
    apartment: '',
    phone: '',
    email: '',
  });

  // validate state
  const [nameError, setNameError] = useState<string | null>(null);
  const [streetError, setStreetError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [provinceError, setProvinceError] = useState<string | null>(null);
  const [wardError, setWardError] = useState<string | null>(null);

  // địa giới
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // chờ “map theo tên” khi chọn saved (vì provinces/wards load async)
  const [pendingProvinceName, setPendingProvinceName] = useState<string | null>(null);
  const [pendingWardName, setPendingWardName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // ===== Helpers map API =====
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

  // ===== Load provinces =====
  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(() => { });
  }, []);

  // provinces ready -> set by pending province name
  useEffect(() => {
    if (!pendingProvinceName || !provinces.length) return;
    const p = provinces.find(pp => norm(pp.name) === norm(pendingProvinceName));
    if (p) setSelectedProvince(p);
    setPendingProvinceName(null);
  }, [provinces, pendingProvinceName]);

  // ===== Load addresses (và profile) =====
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    (async () => {
      try {
        const u = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const raw = u.data?.data ?? u.data ?? {};
        const p = {
          name: raw.name ?? raw.full_name ?? raw.username ?? '',
          phone: raw.phone ?? raw.phone_number ?? '',
          email: raw.email ?? '',
        };
        setProfile(p);

        // Prefill liên hệ
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || p.name || '',
          phone: prev.phone || p.phone || '',
          email: prev.email || p.email || '',
        }));

        const userId = raw.id;
        const r2 = await axios.get(`${API_BASE_URL}/addressesUser/${userId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });

        const list: Address[] = (Array.isArray(r2.data) ? r2.data : []).map((a: any) => ({
          id: a.id,
          address: a.address ?? '',
          ward: a.ward ?? '',
          district: a.district ?? a.ward ?? '',
          city: a.city ?? a.province ?? '',
          province: a.province ?? a.city ?? '',
          is_default: !!a.is_default,
          full_name: a.full_name ?? a.receiver_name ?? '',
          phone: a.phone ?? '',
          email: a.email ?? '',
        }));

        const sorted = list.sort((a, b) => Number(b.is_default) - Number(a.is_default));
        setAddresses(sorted);

        // chọn mặc định và FILL XUỐNG (có thể sửa)
        const def = sorted.find(a => !!a.is_default);
        if (def) {
          fillFromSaved(def);
          setSelectedAddressId(String(def.id));  // hiển thị đúng item đang chọn
          setEditingSavedId(def.id);             // nhớ id để PATCH nếu user sửa
          setManualMode(true);                   // cho phép sửa ngay
          setSaveAddress(false);
          onAddressSelect(Number(def.id));       // parent vẫn có id nếu không sửa gì thêm
          onSaveAddressToggle?.(false);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Load wards khi chọn tỉnh =====
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    axios
      .get(`https://tinhthanhpho.com/api/v1/new-provinces/${selectedProvince.code}/wards`)
      .then((res) => {
        const ws = mapWardList(res.data);
        setWards(ws);

        // nếu đang chờ map ward theo tên
        if (pendingWardName) {
          const found = ws.find(w => norm(w.name) === norm(pendingWardName));
          if (found) setSelectedWard(found);
          setPendingWardName(null);
        }
      })
      .catch(() => { });
  }, [selectedProvince, pendingWardName]);

  // ===== Helpers =====
  const validateName = (v: string) => {
    const s = v.trim();
    if (!s) return 'Vui lòng nhập họ tên';
    if (s.length < 2) return 'Họ tên quá ngắn';
    return null;
  };
  const validateStreet = (v: string) => {
    const s = v.trim();
    if (!s) return 'Vui lòng nhập địa chỉ cụ thể';
    if (s.length < 3) return 'Địa chỉ quá ngắn';
    return null;
  };
  const validatePhone = (v: string) => {
    if (!v.trim()) return 'Vui lòng nhập số điện thoại';
    return /^(0|\+84)[0-9]{9}$/.test(v) ? null : 'Số điện thoại không hợp lệ';
  };
  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Vui lòng nhập email';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Email không hợp lệ';
  };

  const hasManualInput = useMemo(() => {
    const anyForm = Object.values(formData).some(v => v.trim() !== '');
    return !!(anyForm || selectedProvince || selectedWard);
  }, [formData, selectedProvince, selectedWard]);

  // ===== Fill từ saved address (đầy đủ cả Tỉnh/TP & Phường/Xã) =====
  const fillFromSaved = (addr: Address) => {
    // liên hệ + địa chỉ
    setFormData(prev => ({
      ...prev,
      firstName: addr.full_name || prev.firstName || profile.name || '',
      phone: addr.phone || prev.phone || profile.phone || '',
      email: addr.email || prev.email || profile.email || '',
      streetAddress: addr.address || prev.streetAddress || '',
      apartment: prev.apartment, // giữ nếu user đã gõ
    }));

    // set pending theo TÊN để effect provinces/wards map lại
    const provinceName = addr.province || addr.city || '';
    setPendingProvinceName(provinceName || null);
    setPendingWardName(addr.ward || null);

    // clear lỗi / clear chọn hiện tại (effect sẽ set lại)
    setSelectedProvince(null);
    setSelectedWard(null);
    setNameError(null);
    setStreetError(null);
    setPhoneError(null);
    setEmailError(null);
    setProvinceError(null);
    setWardError(null);
  };

  // ===== Select change (saved/manual) =====
  const handleAddressSelectChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) {
        // Clear → chuyển sang tự nhập TRỐNG HOÀN TOÀN
        setManualMode(true);
        setSelectedAddressId('');
        setEditingSavedId(null);
        onAddressSelect(null);
        onSaveAddressToggle?.(false);
        setSaveAddress(false);

        setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
        setSelectedProvince(null);
        setSelectedWard(null);
        setNameError(null);
        setStreetError(null);
        setPhoneError(null);
        setEmailError(null);
        setProvinceError(null);
        setWardError(null);
        return;
      }

      if (value === MANUAL_OPTION) {
        // Tự nhập mới → xoá sạch
        setManualMode(true);
        setSelectedAddressId('');
        setEditingSavedId(null);
        onAddressSelect(null);
        onSaveAddressToggle?.(false);
        setSaveAddress(false);

        setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
        setSelectedProvince(null);
        setSelectedWard(null);
        setNameError(null);
        setStreetError(null);
        setPhoneError(null);
        setEmailError(null);
        setProvinceError(null);
        setWardError(null);
        return;
      }

      // chọn một địa chỉ đã lưu → fill đầy đủ + cho sửa
      const found = addresses.find(a => String(a.id) === String(value));
      if (found) {
        fillFromSaved(found);
        setManualMode(true);
        setSelectedAddressId(String(found.id)); // hiển thị item đã chọn
        setEditingSavedId(found.id);            // ghi nhớ để PATCH nếu user sửa
        onAddressSelect(Number(found.id));      // parent vẫn dùng id nếu user KHÔNG sửa gì thêm
        onSaveAddressToggle?.(false);
        setSaveAddress(false);
      }
    },
    [addresses, onAddressSelect, onSaveAddressToggle, profile]
  );

  // ===== Input change =====
  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      if (!manualMode) return;

      const next = { ...formData, [field]: value };
      setFormData(next);

      if (field === 'firstName') setNameError(validateName(value));
      if (field === 'streetAddress') setStreetError(validateStreet(value));
      if (field === 'phone') setPhoneError(validatePhone(value));
      if (field === 'email') setEmailError(validateEmail(value));

      // người dùng đang nhập → checkout coi là manual, không dùng id nữa
      if (selectedAddressId) setSelectedAddressId('');
      onAddressSelect(null);
      // LƯU Ý: KHÔNG xoá editingSavedId — để OrderSummary PATCH đúng địa chỉ đang chỉnh
    },
    [formData, manualMode, selectedAddressId, onAddressSelect]
  );

  // ===== Province/Ward change =====
  const handleProvinceChange = useCallback(
    (value: number | null) => {
      if (!manualMode) return;
      const found = value ? provinces.find(p => p.code === value) || null : null;
      setSelectedProvince(found);
      setProvinceError(found ? null : 'Vui lòng chọn Tỉnh/Thành phố');
      setSelectedWard(null);
      setWardError('Vui lòng chọn Phường/Xã');

      if (selectedAddressId) setSelectedAddressId('');
      onAddressSelect(null);
    },
    [provinces, manualMode, selectedAddressId, onAddressSelect]
  );

  const handleWardChange = useCallback(
    (value: number | null) => {
      if (!manualMode) return;
      const found = value ? wards.find(w => w.code === value) || null : null;
      setSelectedWard(found);
      setWardError(found ? null : 'Vui lòng chọn Phường/Xã');

      if (selectedAddressId) setSelectedAddressId('');
      onAddressSelect(null);
    },
    [wards, manualMode, selectedAddressId, onAddressSelect]
  );

  // ===== Emit manual lên parent (chỉ khi hợp lệ) =====
  useEffect(() => {
    if (!manualMode) return;

    const noFieldError =
      !nameError && !streetError && !phoneError && !emailError && !provinceError && !wardError;

    const hasAllRequired =
      formData.firstName.trim() &&
      formData.streetAddress.trim() &&
      selectedProvince?.name &&
      selectedWard?.name &&
      formData.phone.trim() &&
      formData.email.trim();

    if (hasAllRequired && noFieldError) {
      onAddressChange({
        full_name: formData.firstName,
        address: `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}`,
        city: `${selectedWard?.name || ''}, ${selectedWard?.district || ''}, ${selectedProvince?.name || ''}`,
        phone: formData.phone,
        email: formData.email,
        editing_id: editingSavedId ?? null, // <-- quan trọng
      });
    } else {
      onAddressChange(null);
    }
  }, [
    manualMode,
    formData,
    selectedProvince,
    selectedWard,
    nameError,
    streetError,
    phoneError,
    emailError,
    provinceError,
    wardError,
    editingSavedId,
    onAddressChange,
  ]);

  // ===== Tick “lưu địa chỉ” – chỉ phát cờ, lưu POST/PATCH sẽ làm ở bước Đặt hàng =====
  const handleToggleSave = (checked: boolean) => {
    if (!manualMode) {
      setSaveAddress(false);
      onSaveAddressToggle?.(false);
      return;
    }
    setSaveAddress(checked);
    onSaveAddressToggle?.(checked);
  };

  // ===== Options Select =====
  const formatSavedAddress = (a: Address) => {
    const provinceName = a.province || a.city || '';
    const base = `${a.address}, ${a.ward}${a.district ? ', ' + a.district : ''}, ${provinceName}`;
    return base.length > 70 ? base.slice(0, 69) + '…' : base;
  };

  // Nếu đang chỉnh một saved address thì vẫn hiển thị item đó; nếu không có thì hiển thị MANUAL
  const selectValue =
    manualMode ? (selectedAddressId || MANUAL_OPTION) : (selectedAddressId || undefined);

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
        data: formatSavedAddress(addr),
        label: (
          <Space size={6}>
            <span>{formatSavedAddress(addr)}</span>
            {addr.is_default ? <Tag color="processing">Mặc định</Tag> : null}
          </Space>
        ),
      })),
    };
    return addresses.length ? [manualGroup, savedGroup] : [manualGroup];
  }, [addresses]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#DB4444', borderRadius: 10 },
        components: {
          Select: { borderRadius: 10, optionSelectedBg: 'rgba(219,68,68,0.08)' },
          Input: { borderRadius: 10 },
          Card: { borderRadiusLG: 16 },
        },
      }}
    >
      <Card title={<span className="font-semibold">Thanh toán</span>} styles={{ header: { borderBottom: 'none' } }}>
        <Form layout="vertical" className="max-w-2xl">
          {/* ===== Select saved / manual ===== */}
          <Form.Item label="Địa chỉ nhận hàng">
            <Select
              allowClear
              showSearch
              placeholder={
                addresses.length
                  ? '-- Chọn địa chỉ giao hàng hoặc tự nhập --'
                  : 'Chưa có địa chỉ – hãy chọn “Nhập địa chỉ mới”'
              }
              value={selectValue as any}
              onChange={(val) => handleAddressSelectChange(val as string | undefined)}
              optionFilterProp="data"
              options={selectOptions as any}
              dropdownMatchSelectWidth={false}
              style={{ width: '100%' }}
            />
            <Text style={{ color: 'black' }}>
              {manualMode
                ? 'Bạn có thể chỉnh các ô bên dưới. Tích “Lưu địa chỉ này” (POST/PATCH khi bấm “Đặt hàng”).'
                : 'Hoặc chọn “+ Nhập địa chỉ mới” ở đầu danh sách.'}
            </Text>
          </Form.Item>

          {/* ===== Form nhập/sửa ===== */}
          <Form.Item label="Họ tên" required validateStatus={nameError ? 'error' : ''} help={nameError || undefined}>
            <Input
              placeholder="Nguyễn Văn A"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item
            label="Địa chỉ cụ thể (số nhà, tòa nhà, căn hộ...)"
            required
            validateStatus={streetError ? 'error' : ''}
            help={streetError || undefined}
          >
            <Input
              placeholder="Số 123, Block B…"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item label="Tên đường">
            <Input
              placeholder="Nguyễn Trãi…"
              value={formData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              disabled={!manualMode}
            />
          </Form.Item>

          <Form.Item
            label="Tỉnh/Thành phố"
            required
            validateStatus={provinceError ? 'error' : ''}
            help={provinceError || undefined}
          >
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
            validateStatus={wardError ? 'error' : ''}
            help={wardError || undefined}
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
            validateStatus={phoneError ? 'error' : ''}
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
            validateStatus={emailError ? 'error' : ''}
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
