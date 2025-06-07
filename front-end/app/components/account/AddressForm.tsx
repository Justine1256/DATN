'use client';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function AddressForm({ formData, setFormData, onSubmit, onCancel }: Props) {
  return (
    <div>
      {/* ✅ Tiêu đề form */}
      <h3 className="text-xl font-bold mb-4 text-red-600">Thêm địa chỉ mới</h3>

      {/* ✅ Họ tên và Số điện thoại */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Họ và tên"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="p-2 border rounded font-medium text-black"
        />
        <input
          type="text"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="p-2 border rounded font-medium text-black"
        />
      </div>

      {/* ✅ Các trường địa chỉ */}
      <input
        type="text"
        placeholder="Địa chỉ chi tiết (số nhà, tên đường)"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full p-2 border rounded mb-3 font-medium text-black"
      />
      <input
        type="text"
        placeholder="Phường/Xã"
        value={formData.ward}
        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
        className="w-full p-2 border rounded mb-3 font-medium text-black"
      />
      <input
        type="text"
        placeholder="Quận/Huyện"
        value={formData.district}
        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
        className="w-full p-2 border rounded mb-3 font-medium text-black"
      />
      <input
        type="text"
        placeholder="Thành phố"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        className="w-full p-2 border rounded mb-3 font-medium text-black"
      />
      <input
        type="text"
        placeholder="Tỉnh/Thành phố"
        value={formData.province}
        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
        className="w-full p-2 border rounded mb-3 font-medium text-black"
      />

      {/* ✅ Chọn loại địa chỉ */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setFormData({ ...formData, type: 'Nhà Riêng' })}
          className={`px-4 py-2 rounded border font-semibold ${
            formData.type === 'Nhà Riêng' ? 'bg-red-500 text-white' : 'text-gray-800'
          }`}
        >
          Nhà Riêng
        </button>
        <button
          onClick={() => setFormData({ ...formData, type: 'Văn Phòng' })}
          className={`px-4 py-2 rounded border font-semibold ${
            formData.type === 'Văn Phòng' ? 'bg-red-500 text-white' : 'text-gray-800'
          }`}
        >
          Văn Phòng
        </button>
      </div>

      {/* ✅ Nút hành động */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100 font-semibold text-black"
        >
          Huỷ
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
        >
          Hoàn thành
        </button>
      </div>
    </div>
  );
}