'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import Select from 'react-select';

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
  district?: string; // ✅ cần để phát city "Ward, District, Province"
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

export default function CheckoutForm({ onAddressSelect, onAddressChange, onSaveAddressToggle }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // có giá trị -> đang dùng địa chỉ đã lưu
  const [disableForm, setDisableForm] = useState(false);

  const [saveAddress, setSaveAddress] = useState<boolean>(false); // ✅ checkbox “Lưu địa chỉ này”

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      district: String(
        w.district_name ??
        w.district?.name ??
        w.district ??
        ''
      ).trim(),
    }));
  };

  // Load provinces
  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(console.error);
  }, []);

  // Load user's addresses & chọn mặc định
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
        if (def) {
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
  }, [onAddressSelect, onAddressChange, onSaveAddressToggle]);

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

  // có nhập tay không?
  const hasManualInput = useMemo(() => {
    const anyForm = Object.values(formData).some((v) => v.trim() !== '');
    return !!(anyForm || selectedProvince || selectedWard);
  }, [formData, selectedProvince, selectedWard]);

  // Chọn/bỏ chọn địa chỉ đã lưu
  const handleAddressChange = useCallback(
    (value: string) => {
      setSelectedAddressId(value);
      const usingSaved = value !== '';
      setDisableForm(usingSaved);

      // reset form khi chuyển mode
      setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
      setSelectedProvince(null);
      setSelectedWard(null);
      setPhoneError(null);
      setEmailError(null);

      if (usingSaved) {
        onAddressSelect(Number(value));
        onAddressChange(null);
        setSaveAddress(false);
        onSaveAddressToggle?.(false);
      } else {
        onAddressSelect(null);
        onAddressChange(null);
        setSaveAddress(false);
        onSaveAddressToggle?.(false);
      }
    },
    [onAddressChange, onAddressSelect, onSaveAddressToggle]
  );

  // Nhập form tay
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      if (selectedAddressId) return; // đang dùng địa chỉ đã lưu

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
    [formData, selectedAddressId]
  );

  // Phát dữ liệu nhập tay ra ngoài – city: "Ward, District, Province"
  useEffect(() => {
    if (selectedAddressId) return; // đang dùng địa chỉ đã lưu
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
    selectedAddressId,
    hasManualInput,
    phoneError,
    formData,
    selectedProvince,
    selectedWard,
    onAddressChange,
  ]);

  // Province/Ward change
  const handleProvinceChange = useCallback(
    (option: { value: number; label: string } | null) => {
      if (selectedAddressId) return;
      const found = option ? provinces.find((p) => p.code === option.value) || null : null;
      setSelectedProvince(found);
      setSelectedWard(null);
    },
    [provinces, selectedAddressId]
  );
  const handleWardChange = useCallback(
    (option: { value: number; label: string } | null) => {
      if (selectedAddressId) return;
      const found = option ? wards.find((w) => w.code === option.value) || null : null;
      setSelectedWard(found);
    },
    [wards, selectedAddressId]
  );

  // Tick “lưu địa chỉ”
  const handleToggleSave = (checked: boolean) => {
    if (selectedAddressId) {
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

  return (
    <div className="text-sm">
      <h2 className="text-2xl font-bold mb-6">Thanh toán</h2>

      <label className="block mb-1 font-medium">Địa chỉ nhận hàng</label>
      <select
        className="w-full border rounded-md bg-white px-3 py-2 mb-4 outline-none text-gray-800"
        value={selectedAddressId}
        onChange={(e) => handleAddressChange(e.target.value)}
        disabled={addresses.length === 0}
      >
        {addresses.length === 0 ? (
          <option value="">Bạn chưa thêm địa chỉ nào</option>
        ) : (
          <>
            <option value="">-- Chọn địa chỉ giao hàng --</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {formatSavedAddress(addr)} {addr.is_default ? '(Mặc định)' : ''}
              </option>
            ))}
          </>
        )}
      </select>

      <p className="text-sm text-gray-500 mb-4">Hoặc nhập địa chỉ giao hàng mới bên dưới</p>

      <div className="space-y-4">
        <InputField
          label="Họ tên "
          field="firstName"
          required
          value={formData.firstName}
          onChange={handleInputChange}
          disabled={disableForm}
        />
        <InputField
          label="Số nhà, tòa nhà, căn hộ... "
          field="streetAddress"
          required
          value={formData.streetAddress}
          onChange={handleInputChange}
          disabled={disableForm}
        />
        <InputField
          label="Tên đường "
          required
          field="apartment"
          value={formData.apartment}
          onChange={handleInputChange}
          disabled={disableForm}
        />

        <div>
          <label className="block mb-1 text-gray-700">
            Tỉnh/Thành phố <span className="text-brand">*</span>
          </label>
          <Select
            instanceId="province-select"
            isDisabled={disableForm}
            isClearable
            options={provinces.map((p) => ({ value: p.code, label: p.name }))}
            value={selectedProvince ? { value: selectedProvince.code, label: selectedProvince.name } : null}
            onChange={handleProvinceChange}
            placeholder="Chọn Tỉnh/Thành phố"
            isSearchable
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700">
            Phường/Xã <span className="text-brand">*</span>
          </label>
          <Select
            instanceId="ward-select"
            isDisabled={disableForm || wards.length === 0}
            isClearable
            options={wards.map((w) => ({ value: w.code, label: w.name }))}
            value={selectedWard ? { value: selectedWard.code, label: selectedWard.name } : null}
            onChange={handleWardChange}
            placeholder="Chọn Phường/Xã"
            isSearchable
          />
          {/* Gợi ý: Quận/Huyện sẽ được tự động lấy từ Phường/Xã */}
          {!!selectedWard?.district && (
            <p className="text-xs text-gray-500 mt-1">Quận/Huyện: {selectedWard.district}</p>
          )}
        </div>

        <InputField
          label="Số điện thoại"
          field="phone"
          required
          value={formData.phone}
          onChange={handleInputChange}
          disabled={disableForm}
          error={phoneError}
        />
        <InputField
          label="Email"
          field="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          disabled={disableForm}
          error={emailError}
        />

        {/* ✅ Checkbox lưu địa chỉ – chỉ dùng khi nhập tay */}
        {isLoggedIn && (
          <label className="inline-flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!saveAddress}
              onChange={(e) => handleToggleSave(e.target.checked)}
            />
            <span>Lưu địa chỉ này cho lần sau</span>
          </label>
        )}

      </div>
    </div>
  );
}

function InputField({
  label,
  field,
  value,
  onChange,
  disabled,
  required = false,
  error,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  disabled: boolean;
  required?: boolean;
  error?: string | null;
}) {
  return (
    <div>
      <label className="block mb-1 text-gray-700">
        {label}
        {required && <span className="text-brand">*</span>}
      </label>
      <input
        type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        disabled={disabled}
        className={`w-full border rounded-md bg-gray-100 px-3 py-2 outline-none disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
