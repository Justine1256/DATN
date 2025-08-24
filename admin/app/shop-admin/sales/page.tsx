'use client';

import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { message } from 'antd'; // dùng hook
import Cookies from 'js-cookie';

import { API_BASE_URL } from '@/utils/api';
import SaleTable from './modal/SaleTable';
import BulkSaleModal from './modal/BulkSaleModal';

export default function ShopSaleManagement() {
  const [messageApi, contextHolder] = message.useMessage(); // ← hook
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // lấy token từ cookie nếu bạn vẫn cần header Bearer
      const token = Cookies.get('authToken');

      const resUser = await fetch(`${API_BASE_URL}/user`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resUser.ok) {
        messageApi.error('Không thể lấy thông tin người dùng'); // ← dùng messageApi
        return;
      }
      const userData = await resUser.json();
      const shopId = userData?.shop.id;
      console.log(userData);

      if (!shopId) {
        messageApi.error('Không tìm thấy shop_id cho tài khoản này'); // ← dùng messageApi
        return;
      }

      const resProducts = await fetch(`${API_BASE_URL}/shop/products/${shopId}`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resProducts.ok) {
        messageApi.error('Không thể tải danh sách sản phẩm');
        return;
      }
      const data = await resProducts.json();
      setProducts(data.products?.data || []);
    } catch (e) {
      console.error(e);
      messageApi.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBulkSuccess = () => {
    fetchProducts();
    setSelectedRowKeys([]);
  };

  return (
    <div className="p-4 bg-white rounded-md shadow">
      {contextHolder}{/* rất quan trọng: render context holder */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Quản lý ưu đãi sản phẩm</h2>
        <Button
          type="primary"
          disabled={selectedRowKeys.length === 0}
          onClick={() => setIsBulkModalOpen(true)}
        >
          Đặt sale hàng loạt
        </Button>
      </div>

      <SaleTable
        products={products}
        loading={loading}
        onRefresh={fetchProducts}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
      />

      <BulkSaleModal
        open={isBulkModalOpen}
        onCancel={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
        selectedProductIds={selectedRowKeys}
      />
    </div>
  );
}
