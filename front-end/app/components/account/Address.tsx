'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Select from 'react-select';

interface Province { code: number; name: string }
interface District { code: number; name: string }
interface Ward { code: number; name: string }

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
    full_name: '', phone: '', address: '', ward: '', district: '', city: '', province: '', note: '', is_default: false, type: 'Nhà Riêng'
  });
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showPopup, setShowPopup] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // ⏱️ Ẩn popup sau 2.5 giây
  useEffect(() => {
    if (showPopup) setTimeout(() => setShowPopup(false), 2500);
  }, [showPopup]);

  const triggerPopup = (msg: string, type: 'success' | 'error') => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  // 📍 Fetch Tỉnh/Thành phố
  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/p/').then((res) => setProvinces(res.data));
  }, []);

  // 🔁 Khi chọn tỉnh thì load quận/huyện
  useEffect(() => {
    const selectedProvince = provinces.find((p) => p.name === formData.province);
    if (selectedProvince) {
      axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`).then((res) => {
        setDistricts(res.data.districts);
        setFormData((prev) => ({ ...prev, district: '', ward: '' }));
      });
    }
  }, [formData.province, provinces]);

  // 🔁 Khi chọn quận thì load xã
  useEffect(() => {
    const selectedDistrict = districts.find((d) => d.name === formData.district);
    if (selectedDistrict) {
      axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`).then((res) => {
        setWards(res.data.wards);
        setFormData((prev) => ({ ...prev, ward: '' }));
      });
    }
  }, [formData.district, districts]);

  // 📦 Lấy ID người dùng từ API
  const fetchUserId = async () => {
    const token = Cookies.get('authToken');
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      setUserId(res.data.id);
    } catch (err) {
      console.error('User fetch failed', err);
    }
  };

  // 📦 Lấy danh sách địa chỉ từ API
  const fetchAddresses = async (uid: number) => {
    const token = Cookies.get('authToken');
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/addressesUser/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      const sorted = [...res.data].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
      setAddresses(sorted);
    } catch (err) {
      console.error('Address fetch failed', err);
    }
  };

  useEffect(() => { fetchUserId(); }, []);
  useEffect(() => { if (userId) fetchAddresses(userId); }, [userId]);

  // ✅ Thêm hoặc cập nhật địa chỉ
  const handleAddOrUpdateAddress = async () => {
    const token = Cookies.get('authToken');
    if (!token || !userId) return;

    const dataToSend = {
      ...formData,
      city: formData.city || formData.province,
      user_id: userId,
    };

    const requiredFields = ['full_name', 'phone', 'address', 'province', 'district', 'ward'];
    const isMissing = requiredFields.some(field => !dataToSend[field as keyof typeof dataToSend]);

    if (isMissing) {
      triggerPopup('❗ Vui lòng điền đầy đủ thông tin địa chỉ!', 'error');
      return;
    }

    try {
      if (isEditing) {
        await axios.patch(`http://localhost:8000/api/addresses/${isEditing}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        triggerPopup('Cập nhật địa chỉ thành công!', 'success');
      } else {
        await axios.post(`http://localhost:8000/api/addresses`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }, withCredentials: true,
        });
        triggerPopup('Thêm địa chỉ thành công!', 'success');
      }

      setIsAdding(false);
      setIsEditing(null);
      fetchAddresses(userId);
      setFormData({ full_name: '', phone: '', address: '', ward: '', district: '', city: '', province: '', note: '', is_default: false, type: 'Nhà Riêng' });

    } catch (err: any) {
      console.error('❌ Lỗi lưu địa chỉ:', err.response?.data || err);
      triggerPopup('Lưu địa chỉ thất bại!', 'error');
    }
  };

  // ❌ Xoá địa chỉ, nếu chỉ còn một địa chỉ sau khi xoá → gán làm mặc định
  const handleDelete = async () => {
    if (!confirmDeleteId || !userId) return;
    const token = Cookies.get('authToken');
    try {
      await axios.delete(`http://localhost:8000/api/addresses/${confirmDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      triggerPopup('Xoá địa chỉ thành công!', 'success');

      const updated = addresses.filter(addr => addr.id !== confirmDeleteId);
      if (updated.length === 1 && !updated[0].is_default) {
        const newDefaultId = updated[0].id;
        await axios.patch(`http://localhost:8000/api/addresses/${newDefaultId}`, {
          ...updated[0], is_default: true
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      fetchAddresses(userId);
    } catch {
      triggerPopup('Xoá thất bại!', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (addr: Address) => {
    setFormData(addr);
    setIsEditing(addr.id!);
    setIsAdding(true);
  };

  // ⬇️ JSX return sẽ hiển thị giao diện
  return (
    <div className="relative">
      {/* 🧊 Overlay khi form hiển thị */}
      {isAdding && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />}
  
      {/* 🏠 Danh sách địa chỉ + nút Thêm */}
      <div className="w-full max-w-5xl p-6 mx-auto mt-10 bg-white rounded-lg shadow relative z-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 font-bold text-red-500">Danh sách địa chỉ</h2>
          <button
            onClick={() => {
              setFormData({
                full_name: '', phone: '', address: '', ward: '',
                district: '', city: '', province: '', note: '',
                is_default: false, type: 'Nhà Riêng'
              });
              setIsAdding(true);
              setIsEditing(null);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >+ Thêm địa chỉ</button>
        </div>
  
        {/* 📋 Danh sách hiển thị */}
        {addresses.length === 0 ? (
          <div className="text-center text-gray-500">Chưa có địa chỉ</div>
        ) : (
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li key={addr.id} className="p-4 border rounded-md bg-white shadow-sm relative">
                <div>
                  <p className="font-semibold text-black">{addr.full_name} - {addr.phone}</p>
                  <p className="text-gray-700 break-words whitespace-pre-wrap">{addr.address}, {addr.ward}, {addr.district}, {addr.city}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Loại: {addr.type}</span>
                    {addr.is_default && (
                      <span className="px-2 py-1 text-xs text-red-500 border border-red-500 rounded">Mặc định</span>
                    )}
                  </div>
                </div>
                <div className="absolute right-4 top-4 flex flex-col gap-1 items-end">
                  <button onClick={() => handleEdit(addr)} className="text-blue-500 hover:underline text-sm">Cập nhật</button>
                  <button onClick={() => setConfirmDeleteId(addr.id!)} className="text-red-500 hover:underline text-sm">Xoá</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
  
      {/* 📥 Form thêm/cập nhật địa chỉ */}
      {isAdding && renderForm()}
  
      {/* ❌ Xác nhận xoá popup */}
      {confirmDeleteId && (
  <div className="fixed inset-0 z-[99] bg-black bg-opacity-10 flex items-center justify-center">
    <div className="bg-white shadow-lg rounded-md px-6 py-4 w-[300px] text-center z-[100] border">
      <h2 className="text-base font-semibold text-black mb-2">Xác nhận xoá địa chỉ</h2>
      <p className="text-sm text-gray-700 mb-4">Bạn có chắc chắn muốn xoá địa chỉ này không?</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setConfirmDeleteId(null)}
          className="px-4 py-1 border rounded text-gray-700 hover:bg-gray-100 text-sm"
        >
          Huỷ
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Xoá
        </button>
      </div>
    </div>
  </div>
)}

  
      {/* ✅ Popup thông báo cố định góc trên phải */}
      {showPopup && (
        <div className={`fixed top-6 right-6 z-[9999] px-4 py-2 rounded shadow-md border-l-4 text-sm font-medium ${
          popupType === 'success' ? 'bg-white text-green-600 border-green-500' : 'bg-white text-red-600 border-red-500'
        }`}>{popupMessage}</div>
      )}
    </div>
  );
  
  // ✅ Hàm phụ trợ hiển thị form (gọi trong return ở trên)
  function renderForm() {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-auto relative shadow-xl text-sm">
          <button
            className="absolute top-3 right-4 text-xl text-gray-600 hover:text-red-600"
            onClick={() => { setIsAdding(false); setIsEditing(null); }}
          >×</button>
          <h3 className="text-h2 font-bold text-center text-red-500 mb-4">
            {isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
          </h3>
  
          {/* 🧾 Grid form chia 12 cột */}
          <div className="grid grid-cols-12 gap-4">
            {/* 👤 Họ tên */}
            <input type="text" placeholder="Họ tên" value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="col-span-6 p-2 border rounded text-black" />
  
            {/* 📞 Số điện thoại */}
            <input type="text" placeholder="Số điện thoại" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="col-span-6 p-2 border rounded text-black" />
  
            {/* 🏠 Địa chỉ cụ thể */}
            <input type="text" placeholder="Địa chỉ cụ thể..." value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="col-span-12 p-2 border rounded text-black" />
  
            {/* 🗺️ Tỉnh/TP, Quận, Phường */}
            {[{ label: 'Tỉnh/TP', key: 'province', value: formData.province, options: provinces },
              { label: 'Quận/Huyện', key: 'district', value: formData.district, options: districts },
              { label: 'Phường/Xã', key: 'ward', value: formData.ward, options: wards }].map((item) => (
              <div key={item.key} className="col-span-4">
                <label className="block mb-1 text-gray-700 font-medium">{item.label}</label>
                <Select
                  options={item.options.map((d: any) => ({ label: d.name, value: d.name }))}
                  value={item.value ? { label: item.value, value: item.value } : null}
                  onChange={(opt) => setFormData((prev) => ({
                    ...prev,
                    [item.key]: opt?.value || '',
                    ...(item.key === 'province' ? { district: '', ward: '' } : {}),
                    ...(item.key === 'district' ? { ward: '' } : {})
                  }))}
                  placeholder={`Chọn ${item.label}`}
                  styles={{
                    control: (base) => ({ ...base, minHeight: 38, fontSize: '0.875rem', color: '#000' }),
                    option: (base) => ({ ...base, color: '#111', fontSize: '0.875rem' })
                  }}
                />
              </div>
            ))}
  
            {/* 🏢 Loại địa chỉ */}
            <div className="col-span-12 mt-2">
              <label className="font-medium text-gray-700 mr-4">Loại:</label>
              {['Nhà Riêng', 'Văn Phòng'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-4 py-1 border rounded mr-3 ${formData.type === type ? 'bg-red-500 text-white' : 'bg-white text-black border-gray-300'}`}
                >{type}</button>
              ))}
            </div>
  
            {/* ✅ Mặc định */}
            <div className="col-span-12 flex items-center gap-2 mt-1">
              <input type="checkbox" id="is_default" checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="accent-red-500" />
              <label htmlFor="is_default" className="text-sm text-black">Làm mặc định</label>
            </div>
  
            {/* 🔘 Nút lưu và huỷ */}
            <div className="col-span-12 flex justify-end gap-3 mt-4">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Huỷ</button>
              <button onClick={handleAddOrUpdateAddress}
                className="px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600">Lưu</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
}
