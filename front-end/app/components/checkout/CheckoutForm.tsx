'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';
import Select from 'react-select';

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
  districtCode?: number;
  districtName?: string;
}
interface District {
  code: number;
  name: string;
}

interface Props {
  onAddressSelect: (id: number | null) => void;
  onAddressChange: (manualData: any | null) => void;
}

export default function CheckoutForm({ onAddressSelect, onAddressChange }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [disableForm, setDisableForm] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    streetAddress: '',
    apartment: '',
    phone: '',
    email: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  function mapProvinceList(data: any): Province[] {
    const list = Array.isArray(data) ? data : data?.data || [];
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
      districtCode: w.district_code ? Number(w.district_code) : undefined,
      districtName: w.district_name ? String(w.district_name).trim() : undefined,
    }));
  }

  useEffect(() => {
    axios
      .get('https://tinhthanhpho.com/api/v1/new-provinces')
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(console.error);
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('authToken');
    if (!token) return;

    axios.get(`${API_BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).then((res) => {
      const userId = res.data.id;
      axios.get(`${API_BASE_URL}/addressesUser/${userId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).then((res) => {
        const sorted = (res.data as Address[]).sort((a, b) => Number(b.is_default) - Number(a.is_default));
        setAddresses(sorted);

        const defaultAddress = sorted.find((a) => a.is_default);
        if (defaultAddress && !hasUserInput) {
          const idStr = defaultAddress.id.toString();
          setSelectedAddressId(idStr);
          setDisableForm(true);
          onAddressSelect(Number(defaultAddress.id));
          onAddressChange(null);
        }
      });
    });
  }, [onAddressSelect, onAddressChange, hasUserInput]);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }

    axios
      .get(`https://tinhthanhpho.com/api/v1/provinces/${selectedProvince.code}/districts`)
      .then((res) => setDistricts(mapDistrictList(res.data)))
      .catch(console.error);
  }, [selectedProvince]);

useEffect(() => {
  // Khi đổi Tỉnh: reset Huyện, Xã
  if (!selectedProvince) {
    setDistricts([]);
    setSelectedDistrict(null);
    setWards([]);
    setSelectedWard(null);
    return;
  }

  // Fetch quận/huyện (đang có)
  axios
    .get(`https://tinhthanhpho.com/api/v1/provinces/${selectedProvince.code}/districts`)
    .then((res) => setDistricts(mapDistrictList(res.data)))
    .catch(console.error);

  // Fetch toàn bộ xã của Tỉnh để lọc theo Huyện
  axios
    .get(`https://tinhthanhpho.com/api/v1/new-provinces/${selectedProvince.code}/wards`)
    .then((res) => setWards(mapWardList(res.data)))
    .catch(console.error);

  // reset ward
  setSelectedWard(null);
}, [selectedProvince]);

  const handleAddressChange = (value: string) => {
    setSelectedAddressId(value);
    setDisableForm(value !== '');
    setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setHasUserInput(false);
    setPhoneError(null);

    if (value !== '') {
      const numericId = Number(value);
      onAddressSelect(!isNaN(numericId) ? numericId : null);
      onAddressChange(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };

    if (field === 'phone') {
      const phoneRegex = /^(0|\+84)[0-9]{9}$/;
      if (value.trim() !== '' && !phoneRegex.test(value)) {
        setPhoneError('Số điện thoại không hợp lệ');
      } else {
        setPhoneError(null);
      }
    }

    setFormData(updated);

    const hasInput = Object.values(updated).some((val) => val.trim() !== '') || !!selectedProvince || !!selectedDistrict;
    setHasUserInput(hasInput);

    if (hasInput) {
      if (selectedAddressId !== '') {
        setSelectedAddressId('');
        setDisableForm(false);
        onAddressSelect(null);
      }

      if (!phoneError) {
        onAddressChange({
          full_name: updated.firstName,
          address: `${updated.streetAddress}${updated.apartment ? ', ' + updated.apartment : ''}`,
          city: `${selectedDistrict?.name || ''}, ${selectedProvince?.name || ''}`,
          phone: updated.phone,
          email: updated.email,
        });
      } else {
        onAddressChange(null);
      }
    } else {
      onAddressChange(null);
    }
  };

  useEffect(() => {
    const hasInput = Object.values(formData).some((val) => val.trim() !== '') || selectedProvince || selectedDistrict;

    if (hasInput && !phoneError) {
      onAddressChange({
        full_name: formData.firstName,
        address: `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}`,
        city: `${selectedDistrict?.name || ''}, ${selectedProvince?.name || ''}`,
        phone: formData.phone,
        email: formData.email,
      });
    } else {
      onAddressChange(null);
    }
  }, [formData, selectedProvince, selectedDistrict, phoneError]);

  return (
    <div className="text-sm">
      <h2 className="text-2xl font-bold mb-6">Thanh toán</h2>

      <label className="block mb-1 font-medium">Địa chỉ nhận hàng</label>
      <select
        className="w-full border rounded-md bg-gray-100 px-3 py-2 mb-4 outline-none"
        value={selectedAddressId}
        onChange={(e) => handleAddressChange(e.target.value)}
        disabled={hasUserInput || addresses.length === 0}
      >
        {addresses.length === 0 ? (
          <option value="">Bạn chưa thêm địa chỉ nào</option>
        ) : (
          <>
            <option value="">-- Chọn địa chỉ giao hàng --</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {`${addr.address}, ${addr.ward}, ${addr.district}, ${addr.city}`} {addr.is_default ? '(Mặc định)' : ''}
              </option>
            ))}
          </>
        )}
      </select>

      <p className="text-sm text-gray-500 mb-4">Hoặc nhập địa chỉ giao hàng mới bên dưới</p>

      <div className="space-y-4">
        <InputField label="Họ tên " field="firstName" required value={formData.firstName} onChange={handleInputChange} disabled={disableForm} />
        <InputField label="Số nhà, tòa nhà, căn hộ... " field="streetAddress" required value={formData.streetAddress} onChange={handleInputChange} disabled={disableForm} />
        <InputField label="Tên đường " required field="apartment" value={formData.apartment} onChange={handleInputChange} disabled={disableForm} />

        <div>
          <label className="block mb-1 text-gray-700">Tỉnh/Thành phố <span className="text-brand">*</span></label>
          <Select
            isDisabled={disableForm}
            isClearable
            options={provinces.map((p) => ({ value: p.code, label: p.name }))}
            value={selectedProvince ? { value: selectedProvince.code, label: selectedProvince.name } : null}
            onChange={(option) => {
              const found = provinces.find((p) => p.code === option?.value) || null;
              setSelectedProvince(found);
              setSelectedDistrict(null);
              const hasInput = Object.values(formData).some((val) => val.trim() !== '') || !!found;
              setHasUserInput(hasInput);
              if (hasInput) {
                setSelectedAddressId('');
                setDisableForm(false);
                if (!phoneError) {
                  onAddressChange({
                    full_name: formData.firstName,
                    address: `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}`,
                    city: `${selectedDistrict?.name || ''}, ${found?.name || ''}`,
                    phone: formData.phone,
                    email: formData.email,
                  });
                } else {
                  onAddressChange(null);
                }
              } else {
                onAddressChange(null);
              }
            }}
            placeholder="Chọn Tỉnh/Thành phố"
            isSearchable
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700">Quận/Huyện <span className="text-brand">*</span></label>
          <Select
            isDisabled={disableForm || districts.length === 0}
            isClearable
            options={districts.map((d) => ({ value: d.code, label: d.name }))}
            value={selectedDistrict ? { value: selectedDistrict.code, label: selectedDistrict.name } : null}
            onChange={(option) => {
              const found = districts.find((d) => d.code === option?.value);
              setSelectedDistrict(found || null);
              setHasUserInput(true);
            }}
            placeholder="Chọn Quận/Huyện"
            isSearchable
          />
        </div>

        <InputField label="Số điện thoại" field="phone" required value={formData.phone} onChange={handleInputChange} disabled={disableForm} error={phoneError} />
        <InputField label="Email" field="email" required value={formData.email} onChange={handleInputChange} disabled={disableForm} />
      </div>
    </div>
  );
}

// Reusable InputField component
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
