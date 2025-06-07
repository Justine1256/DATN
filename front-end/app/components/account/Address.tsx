'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import AddressForm from './AddressForm';

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

export default function AddressComponent() {
  const [userId, setUserId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Address>({
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
  });

  const fetchUserId = async () => {
    const token = Cookies.get('authToken');
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUserId(res.data.id);
    } catch (err) {
      console.error('Không lấy được user:', err);
    }
  };

  const fetchAddresses = async (uid: number) => {
    const token = Cookies.get('authToken');
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/addressesUser/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAddresses(res.data);
    } catch (err) {
      console.error('❌ Không lấy được danh sách địa chỉ:', err);
    }
  };

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) fetchAddresses(userId);
  }, [userId]);

  const handleAddOrUpdateAddress = async () => {
    const token = Cookies.get('authToken');
    if (!token || !userId) return;

    try {
      if (isEditing) {
        await axios.patch(
          `http://localhost:8000/api/addresses/${isEditing}`,
          { ...formData, user_id: userId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert('✅ Cập nhật địa chỉ thành công!');
      } else {
        await axios.post(
          'http://localhost:8000/api/addresses',
          { ...formData, user_id: userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
        alert('✅ Thêm địa chỉ thành công!');
      }

      setIsAdding(false);
      setIsEditing(null);
      setFormData({
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
      });
      fetchAddresses(userId);
    } catch (err) {
      console.error('❌ Không thể lưu địa chỉ:', err);
      alert('❌ Lưu địa chỉ thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    const token = Cookies.get('authToken');
    if (!token || !userId) return;

    if (!confirm('Bạn có chắc muốn xoá địa chỉ này?')) return;

    try {
      await axios.delete(`http://localhost:8000/api/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses(userId);
    } catch (err) {
      console.error('❌ Xoá địa chỉ thất bại:', err);
    }
  };

  const handleEdit = (addr: Address) => {
    setFormData(addr);
    setIsEditing(addr.id!);
    setIsAdding(true);
  };

  return (
    <div className="w-full flex justify-center px-4">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-500">My Addresses</h2>
          <button
            onClick={() => {
              setFormData({
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
              });
              setIsAdding(true);
              setIsEditing(null);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            + Thêm địa chỉ mới
          </button>
        </div>

        {isAdding && (
          <div className="mb-6 border border-red-500 rounded-md p-4 bg-gray-50">
            <AddressForm
              formData={formData}
              setFormData={setFormData}
              onCancel={() => {
                setIsAdding(false);
                setIsEditing(null);
              }}
              onSubmit={handleAddOrUpdateAddress}
            />
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center text-gray-500">Bạn chưa có địa chỉ.</div>
        ) : (
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li key={addr.id} className="p-5 border rounded bg-white shadow-md">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-black">{addr.full_name} - {addr.phone}</p>
                    <p className="text-gray-700 font-medium">{addr.address}</p>
                    <p className="text-gray-700 font-medium">{addr.ward}, {addr.district}, {addr.city}</p>
                    <p className="text-gray-600 text-sm mt-1">Loại: {addr.type}</p>
                    {addr.is_default && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs border border-red-500 text-red-500 rounded">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-between items-end gap-2">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id!)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
