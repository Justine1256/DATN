// ✅ JSX render danh sách địa chỉ và form thêm/sửa
function AddressComponentUI() {
    return (
      <div className="relative">
        {/* ✅ Overlay mờ khi form bật */}
        {isAdding && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />}
  
        {/* ✅ Danh sách địa chỉ */}
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
  
          {/* ✅ Không hiện 'Không có địa chỉ' khi đang loading/thêm */}
          {addresses.length === 0 && !isAdding ? (
            <div className="text-center text-gray-500">Chưa có địa chỉ</div>
          ) : (
            <ul className="space-y-4">
              {addresses.map((addr) => (
                <li key={addr.id} className="p-4 border rounded-md bg-white shadow-sm relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-black">{addr.full_name} - {addr.phone}</p>
                        <div className="flex gap-3 min-w-[80px] text-right">
                          <button
                            onClick={() => handleEdit(addr)}
                            className="text-blue-500 text-sm relative after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1px] after:bg-blue-500 after:transition-all hover:after:w-full"
                          >Cập nhật</button>
                          <button
                            onClick={() => setConfirmDeleteId(addr.id!)}
                            className="text-red-500 text-sm relative after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1px] after:bg-red-500 after:transition-all hover:after:w-full"
                          >Xoá</button>
                        </div>
                      </div>
                      <p className="text-gray-700 break-words whitespace-pre-wrap">{addr.address}, {addr.ward}, {addr.district}, {addr.city}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>Loại: {addr.type}</span>
                        {addr.is_default && (
                          <span className="px-2 py-1 text-xs text-red-500 border border-red-500 rounded">Mặc định</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
  
        {/* ✅ Hiển thị form nếu đang thêm/sửa */}
        {isAdding && renderForm()}
  
        {/* ✅ Popup xác nhận xoá */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[99] bg-black bg-opacity-10 flex items-center justify-center">
            <div className="bg-white shadow-lg rounded-md px-6 py-4 w-[300px] text-center z-[100] border">
              <h2 className="text-base font-semibold text-black mb-2">Xác nhận xoá địa chỉ</h2>
              <p className="text-sm text-gray-700 mb-4">Bạn có chắc chắn muốn xoá địa chỉ này không?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-1 border rounded text-gray-700 hover:bg-gray-100 text-sm"
                >Huỷ</button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >Xoá</button>
              </div>
            </div>
          </div>
        )}
  
        {/* ✅ Hiển thị popup góc phải */}
        {showPopup && (
          <div className={`fixed top-6 right-6 z-[9999] px-4 py-2 rounded shadow-md border-l-4 text-sm font-medium ${
            popupType === 'success' ? 'bg-white text-green-600 border-green-500' : 'bg-white text-red-600 border-red-500'
          }`}>
            {popupMessage}
          </div>
        )}
      </div>
    );
  }
  
  export default AddressComponentUI;
  