'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import { API_BASE_URL } from '@/utils/api';

// ✅ Interface định nghĩa tỉnh/huyện/xã và địa chỉ người dùng
interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface AddressComponentProps {
  userId: number;  // Thêm kiểu cho userId
}

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
  type: "Nhà Riêng" | "Văn Phòng";
}

export default function AddressComponent({ userId }: AddressComponentProps) {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Address>({
    full_name: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: "",
    province: "",
    note: "",
    is_default: false,
    type: "Nhà Riêng",
  });
  const [phoneError, setPhoneError] = useState<string>("");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [showPopup, setShowPopup] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // ✅ Danh sách địa phương để chọn
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Add state for userId
  const [userIdState, setUserIdState] = useState<number | null>(null);

  const validatePhone = (phone: string) => {
    const regex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return regex.test(phone);
  };
  function mapProvinceList(data: any): Province[] {
    const list = Array.isArray(data) ? data : data?.data || data?.results || [];
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
    }));
  }

  // ✅ Ẩn popup thông báo sau 2.5 giây
  useEffect(() => {
    if (showPopup) setTimeout(() => setShowPopup(false), 2500);
  }, [showPopup]);

  const triggerPopup = (msg: string, type: "success" | "error") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  // ✅ Lấy danh sách tỉnh từ API
  useEffect(() => {
    axios
      .get("https://tinhthanhpho.com/api/v1/new-provinces")
      .then((res) => setProvinces(mapProvinceList(res.data)))
      .catch(console.error);
  }, []);


  // ✅ Khi người dùng chọn tỉnh → tải danh sách huyện
  useEffect(() => {
    if (!formData.province || !Array.isArray(provinces) || provinces.length === 0) return;

    const selectedProvince = provinces.find((p) => p.name === formData.province);
    if (!selectedProvince) return;

    axios
      .get(`https://tinhthanhpho.com/api/v1/provinces/${selectedProvince.code}/districts`)
      .then((res) => {
        setDistricts(mapDistrictList(res.data));
        setFormData((prev) => ({ ...prev, district: "", ward: "" }));
      })
      .catch(console.error);
  }, [formData.province, provinces]);



  // ✅ Khi người dùng chọn huyện → tải danh sách xã
  useEffect(() => {
    if (!formData.province || !Array.isArray(provinces) || provinces.length === 0) return;

    const selectedProvince = provinces.find((p) => p.name === formData.province);
    if (!selectedProvince) return;

    axios
      .get(`https://tinhthanhpho.com/api/v1/new-provinces/${selectedProvince.code}/wards`)
      .then((res) => {
        setWards(mapWardList(res.data));
        setFormData((prev) => ({ ...prev, ward: "" }));
      })
      .catch(console.error);
  }, [formData.district, formData.province, provinces]);



  // ✅ Gọi API lấy user hiện tại
  const fetchUserId = async () => {
    const token = Cookies.get("authToken");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUserIdState(res.data.id);  // Cập nhật userId sử dụng setUserIdState
    } catch (err) {
      console.error("User fetch failed", err);
    }
  };

  // ✅ Gọi API lấy danh sách địa chỉ của user
  const fetchAddresses = async (id: string) => {  // Chuyển `id` thành string
    const token = Cookies.get("authToken");
    if (!token) return;

    try {
      setLoading(true); // ✅ Bắt đầu loading

      const res = await axios.get(
        `${API_BASE_URL}/addressesUser/${id}`, // Truyền `id` là string
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const sorted = [...res.data].sort(
        (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)
      );
      setAddresses(sorted);
    } catch (err) {
      console.error("Address fetch failed", err);
    } finally {
      setLoading(false); // ✅ Kết thúc loading
    }
  };

  // ✅ Khởi tạo user ID và load địa chỉ tương ứng
  useEffect(() => {
    fetchUserId();
  }, []);
  useEffect(() => {
    if (userId) fetchAddresses(userId.toString());  // Chuyển `userId` thành string khi gọi API
  }, [userId]);

  // ✅ Chỉnh sửa địa chỉ
  const handleEdit = (addr: Address) => {
    setFormData(addr);
    setIsEditing(addr.id!);
    setIsAdding(true);
  };
  useEffect(() => {
    if (isAdding) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden"); // cleanup khi unmount
    };
  }, [isAdding]);

  // ✅ Hàm xử lý thêm hoặc cập nhật địa chỉ
  const handleAddOrUpdateAddress = async () => {
    const token = Cookies.get("authToken");
    if (!token || !userId) return;
    if (!validatePhone(formData.phone)) {
      triggerPopup("❗ Số điện thoại không hợp lệ!", "error");
      return;
    }

    const dataToSend = {
      ...formData,
      city: formData.city || formData.province,
      user_id: userId,
    };

    const requiredFields = [
      "full_name",
      "phone",
      "address",
      "province",
      "district",
      "ward",
    ];
    const isMissing = requiredFields.some(
      (field) => !dataToSend[field as keyof typeof dataToSend]
    );

    if (isMissing) {
      triggerPopup("❗ Vui lòng điền đầy đủ thông tin địa chỉ!", "error");
      return;
    }

    try {
      if (isEditing) {
        await axios.patch(
          `${API_BASE_URL}/addresses/${isEditing}`,
          dataToSend,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        triggerPopup("Cập nhật địa chỉ thành công!", "success");
      } else {
        await axios.post(`${API_BASE_URL}/addresses`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        triggerPopup("Thêm địa chỉ thành công!", "success");
      }

      setIsAdding(false);
      setIsEditing(null);
      fetchAddresses(userId.toString());  // Chuyển `userId` thành string khi gọi API
      setFormData({
        full_name: "",
        phone: "",
        address: "",
        ward: "",
        district: "",
        city: "",
        province: "",
        note: "",
        is_default: false,
        type: "Nhà Riêng",
      });
    } catch (err: any) {
      console.error("❌ Lỗi lưu địa chỉ:", err.response?.data || err);
      triggerPopup("Lưu địa chỉ thất bại!", "error");
    }
  };

  // ✅ Xoá địa chỉ, nếu chỉ còn 1 → gán mặc định
  const handleDelete = async () => {
    if (!confirmDeleteId || !userId) return;
    const token = Cookies.get("authToken");

    try {
      // ✅ Gọi API xoá
      await axios.delete(`${API_BASE_URL}/addresses/${confirmDeleteId.toString()}`, {  // Chuyển `confirmDeleteId` thành string
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Nếu xoá thành công, cập nhật UI
      triggerPopup("Xoá địa chỉ thành công!", "success");

      const updated = addresses.filter((addr) => addr.id !== confirmDeleteId);

      // ✅ Nếu chỉ còn 1 địa chỉ, đặt làm mặc định nếu chưa
      if (updated.length === 1 && !updated[0].is_default) {
        const newDefaultId = updated[0].id;

        // Kiểm tra newDefaultId có tồn tại trước khi gọi API
        if (newDefaultId) {
          await axios.patch(
            `${API_BASE_URL}/addresses/${newDefaultId.toString()}`,
            {
              ...updated[0],
              is_default: true,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      

      // ✅ Refresh lại danh sách địa chỉ
      fetchAddresses(userId.toString());  // Chuyển `userId` thành string khi gọi API
    } catch (error) {
      console.error("Lỗi xoá địa chỉ:", error);
      triggerPopup("❌ Xoá thất bại!", "error");
    } finally {
      setConfirmDeleteId(null); // ✅ Đóng modal xác nhận
    }
  };

  return (
    <div className="min-h-screen py-16">
      {/* Overlay khi mở form */}
      {isAdding && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />}

      {/* Main container */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl">
                {/* Map Pin - Use text instead of icon */}
                <span className="text-white">📍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand">Quản lý địa chỉ</h1>
                <p className="text-gray-500 text-sm">Quản lý danh sách địa chỉ giao hàng của bạn</p>
              </div>
            </div>

            <button
              onClick={() => {
                setFormData({
                  full_name: "",
                  phone: "",
                  address: "",
                  ward: "",
                  district: "",
                  city: "",
                  province: "",
                  note: "",
                  is_default: false,
                  type: "Nhà Riêng",
                });
                setIsAdding(true);
                setIsEditing(null);
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#db4444] to-[#db4444] hover:from-[#db4444] hover:to-[#db4444] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>➕</span>
              <span>Thêm địa chỉ mới</span>
            </button>
          </div>
        </div>

        {/* List of Addresses */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              {/* Changed spinner color to db4444 */}
              <div className="w-12 h-12 border-4 border-[#db4444] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Đang tải danh sách địa chỉ...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có địa chỉ nào</h3>
              <p className="text-gray-500 mb-6">Thêm địa chỉ đầu tiên để bắt đầu sử dụng</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Danh sách địa chỉ ({addresses.length})
              </h2>

              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${addr.is_default
                    ? "border-[#db4444]"
                    : "border-gray-200 bg-white hover:border-[#db4444]"}`
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {/* User icon replaced with text */}
                          <span className="font-semibold text-black">{addr.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Phone icon replaced with text */}
                          <span className="text-black">{addr.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 mb-3">
                        {/* Map Pin - replaced with text */}
                        <span className="text-gray-400 mt-0.5">📍</span>
                        <div className="text-black leading-relaxed">
                          <p>{addr.address}</p>
                          <p>{addr.ward}, {addr.district}, {addr.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${addr.type === "Nhà Riêng"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {/* Home type icon replaced with text */}
                          <span>{addr.type}</span>
                        </div>

                        {addr.is_default && (
                          <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-[#db4444] text-white">
                            <span>✔</span>
                            <span>Mặc định</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(addr)}
                        className="flex items-center space-x-1 px-3 py-2 text-brand hover:bg-[#db4444]/10 rounded-lg transition-colors duration-200"
                      >
                        <span className="text-sm font-medium">Sửa</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(addr.id!)}
                        className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <span className="text-sm font-medium">Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form hiển thị khi đang thêm/sửa */}
      {isAdding && renderForm()}

      {/* Popup xác nhận xoá */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[99] bg-black bg-opacity-10 flex items-center justify-center">
          <div className="bg-white shadow-lg rounded-md px-6 py-4 w-[300px] text-center z-[100] border">
            <h2 className="text-base font-semibold text-black mb-2">
              Xác nhận xoá địa chỉ
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Bạn có chắc chắn muốn xoá địa chỉ này không?
            </p>
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

      {/* Hiển thị popup góc phải */}
      {showPopup && (
        <div
          className={`fixed top-20 right-5 z-[9999] text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade ${popupType === "success"
            ? "bg-white text-green-600 border-green-500"
            : "bg-white text-red-600 border-red-500"
            }`}
        >
          {popupMessage}
        </div>
      )}
    </div>
  );
  
  // ✅ Hàm hiển thị form nhập/sửa địa chỉ
  function renderForm() {
    return (
      <div className="fixed inset-0 z-50 flex justify-end items-center bg-black bg-opacity-50 px-4">

        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-auto relative shadow-xl text-sm">
          <button
            className="absolute top-3 right-4 text-xl text-gray-600 hover:text-red-600"
            onClick={() => {
              setIsAdding(false);
              setIsEditing(null);
            }}
          >
            ×
          </button>
          <h3 className="text-h2 font-bold text-center text-brand mb-4">
            {isEditing ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
          </h3>

          {/* ✅ Grid chia layout nhập thông tin */}
          <div className="grid grid-cols-12 gap-4">
            <input
              type="text"
              placeholder="Họ tên"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="col-span-6 p-2 border rounded text-black"
            />

            <input
              type="text"
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, phone: value });

                // ✅ Cập nhật lỗi tức thời
                if (!validatePhone(value)) {
                  setPhoneError("Số điện thoại không hợp lệ");
                } else {
                  setPhoneError("");
                }
              }}
              className={`col-span-6 p-2 border rounded text-black ${phoneError ? "border-red-500" : ""
                }`}
            />

            {phoneError && (
              <p className="col-span-6 text-red-500 text-sm mt-1">
                {phoneError}
              </p>
            )}

            <input
              type="text"
              placeholder="Địa chỉ cụ thể..."
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="col-span-12 p-2 border rounded text-black"
            />

            {[
              { label: "Tỉnh/TP", key: "province", value: formData.province, options: provinces },
              { label: "Quận/Huyện", key: "district", value: formData.district, options: districts },
              { label: "Phường/Xã", key: "ward", value: formData.ward, options: wards }
            ].map((item) => (
              <div key={item.key} className="col-span-4">
                <label className="block mb-1 text-gray-700 font-medium">
                  {item.label}
                </label>
                <Select
                  options={item.options.map((d: any) => ({
                    label: d.name,
                    value: d.name,
                  }))}
                  value={
                    item.value ? { label: item.value, value: item.value } : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      [item.key]: opt?.value || "",
                      ...(item.key === "province"
                        ? { district: "", ward: "" }
                        : {}),
                      ...(item.key === "district" ? { ward: "" } : {}),
                    }))
                  }
                  placeholder={`Chọn ${item.label}`}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: 38,
                      fontSize: "0.875rem",
                      color: "#000",
                    }),
                    option: (base) => ({
                      ...base,
                      color: "#111",
                      fontSize: "0.875rem",
                    }),
                  }}
                />
              </div>
            ))}

            <div className="col-span-12 mt-2">
              <label className="font-medium text-gray-700 mr-4">Loại:</label>
              {["Nhà Riêng", "Văn Phòng"].map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: type as "Nhà Riêng" | "Văn Phòng",
                    })
                  }
                  className={`px-4 py-1 border rounded mr-3 ${formData.type === type
                    ? "bg-[#db4444] text-white"
                    : "bg-white text-black border-gray-300"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="col-span-12 flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="accent-[#db4444]"
              />
              <label htmlFor="is_default" className="text-sm text-black">
                Làm mặc định
              </label>
            </div>

            <div className="col-span-12 flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                }}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Huỷ
              </button>
              <button
                onClick={handleAddOrUpdateAddress}
                className="px-5 py-2 bg-[#db4444] text-white rounded hover:bg-[#db4444]/80"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}