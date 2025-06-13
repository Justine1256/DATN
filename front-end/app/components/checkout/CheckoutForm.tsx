'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

interface Address {
  id: number;
  address: string;
  ward: string;
  district: string;
  city: string;
  is_default: number | boolean;
}

interface Props {
  onAddressSelect: (id: number) => void;
  onAddressChange: (manualData: any | null) => void; // ✅ thêm prop
}

export default function CheckoutForm({ onAddressSelect, onAddressChange }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [disableForm, setDisableForm] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    streetAddress: '',
    apartment: '',
    city: '',
    phone: '',
    email: '',
  });

useEffect(() => {
  const token = localStorage.getItem('token') || Cookies.get('authToken');
  if (!token) return;

  axios
    .get(`${API_BASE_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    .then((res) => {
      const userId = res.data.id;
      axios
        .get(`${API_BASE_URL}/addressesUser/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        .then((res) => {
          const sortedAddresses = (res.data as Address[]).sort(
            (a, b) => Number(b.is_default) - Number(a.is_default)
          );

          setAddresses(sortedAddresses);

          const defaultAddress = sortedAddresses.find(
            (a) => a.is_default === 1 || a.is_default === true
          );

          if (defaultAddress && !hasUserInput) { // ✅ CHỈ chọn mặc định nếu người dùng chưa nhập tay
            const defaultId = defaultAddress.id.toString();
            setSelectedAddressId(defaultId);
            setDisableForm(true);
            onAddressSelect(defaultAddress.id);
            onAddressChange(null);
          }
        });
    })
    .catch((err) => {
      console.error('Lỗi khi lấy user:', err);
    });
}, [onAddressSelect, onAddressChange, hasUserInput]);


  const handleAddressChange = (value: string) => {
    setSelectedAddressId(value);
    setDisableForm(value !== '');
    setFormData({
      firstName: '',
      streetAddress: '',
      apartment: '',
      city: '',
      phone: '',
      email: '',
    });
    setHasUserInput(false);

    if (value !== '') {
      onAddressSelect(parseInt(value));
      onAddressChange(null); // ✅ reset manual nếu chọn địa chỉ
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    const hasAnyInput = Object.values(updatedData).some(val => val.trim() !== '');
    setHasUserInput(hasAnyInput);

    if (hasAnyInput) {
      setSelectedAddressId('');
      setDisableForm(false);

      // ✅ Gửi địa chỉ nhập tay lên parent
      onAddressChange(updatedData);
    } else {
      // ✅ Nếu người dùng xóa hết dữ liệu
      onAddressChange(null);
    }
  };

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
        {[
          { label: 'First Name', field: 'firstName', required: true },
          { label: 'Street Address', field: 'streetAddress', required: true },
          { label: 'Apartment, floor, etc. (optional)', field: 'apartment', required: false },
          { label: 'Town/City', field: 'city', required: true },
          { label: 'Phone Number', field: 'phone', required: true },
          { label: 'Email Address', field: 'email', required: true },
        ].map(({ label, field, required }) => (
          <div key={field}>
            <label className="block mb-1 text-gray-700">
              {label}{required && <span className="text-brand">*</span>}
            </label>
            <input
              type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
              value={(formData as any)[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              disabled={disableForm}
              className="w-full border rounded-md bg-gray-100 px-3 py-2 outline-none disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 mt-4">
        <input type="checkbox" className="w-4 h-4" />
        <span className="text-sm">Lưu thông tin cho lần sau</span>
      </label>
    </div>
  );
}
