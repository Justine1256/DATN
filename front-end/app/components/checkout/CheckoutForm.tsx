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

  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/p/').then((res) => setProvinces(res.data));
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
          onAddressSelect(Number(defaultAddress.id)); // ✅ cast to number
          onAddressChange(null);
        }
      });
    });
  }, [onAddressSelect, onAddressChange, hasUserInput]);

  useEffect(() => {
    if (selectedProvince) {
      axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
        .then((res) => setDistricts(res.data.districts));
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince]);

  const handleAddressChange = (value: string) => {
    setSelectedAddressId(value);
    setDisableForm(value !== '');
    setFormData({ firstName: '', streetAddress: '', apartment: '', phone: '', email: '' });
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setHasUserInput(false);

    if (value !== '') {
      const numericId = Number(value);
      onAddressSelect(!isNaN(numericId) ? numericId : null); // ✅ cast safely
      onAddressChange(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const hasInput = Object.values(updated).some((val) => val.trim() !== '') || !!selectedProvince || !!selectedDistrict;
    setHasUserInput(hasInput);

    if (hasInput) {
      if (selectedAddressId !== '') {
        setSelectedAddressId('');
        setDisableForm(false);
        onAddressSelect(null); // ✅ reset addressId
      }

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
  };

  const handleProvinceChange = (code: number) => {
    const province = provinces.find((p) => p.code === code) || null;
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setHasUserInput(true);
  };

  const handleDistrictChange = (code: number) => {
    const district = districts.find((d) => d.code === code) || null;
    setSelectedDistrict(district);
    setHasUserInput(true);
  };

  useEffect(() => {
    const hasInput = Object.values(formData).some((val) => val.trim() !== '') || selectedProvince || selectedDistrict;
    if (hasInput) {
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
  }, [formData, selectedProvince, selectedDistrict]);

  return (
    <div className="text-sm">
      <h2 className="text-2xl font-bold mb-6">Billing Details</h2>

      <label className="block mb-1 font-medium">Shipping Address</label>
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
        <InputField label="First Name" field="firstName" required value={formData.firstName} onChange={handleInputChange} disabled={disableForm} />
        <InputField label="Street Address" field="streetAddress" required value={formData.streetAddress} onChange={handleInputChange} disabled={disableForm} />
        <InputField label="Apartment, floor, etc. (optional)" field="apartment" value={formData.apartment} onChange={handleInputChange} disabled={disableForm} />

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

        <InputField label="Phone Number" field="phone" required value={formData.phone} onChange={handleInputChange} disabled={disableForm} />
        <InputField label="Email Address" field="email" required value={formData.email} onChange={handleInputChange} disabled={disableForm} />
      </div>

      <label className="flex items-center gap-2 mt-4">
        <input type="checkbox" className="w-4 h-4" />
        <span className="text-sm">Lưu thông tin cho lần sau</span>
      </label>
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
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  disabled: boolean;
  required?: boolean;
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
        className="w-full border rounded-md bg-gray-100 px-3 py-2 outline-none disabled:opacity-50"
      />
    </div>
  );
}
