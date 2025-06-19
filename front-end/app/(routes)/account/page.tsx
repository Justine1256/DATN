'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';
import FollowedShops from '@/app/components/account/FollowedShops';
import NotificationDropdown from '@/app/components/account/NotificationDropdown';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import OrderSection from '@/app/components/account/OrderSection';
import AccountProfileView from '@/app/components/account/AccountProfileView';

export default function AccountRoute() {
  const [section, setSection] = useState<string>('profileView'); // Set default section to profileView
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // ✅ Lấy thông tin người dùng từ API
  const fetchUser = async () => {
    const token = Cookies.get('authToken');
    if (!token) return setLoading(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Khi component được mount, kiểm tra URL và fetch user
  useEffect(() => {
    const sectionFromUrl = new URLSearchParams(window.location.search).get('section');
    if (sectionFromUrl) {
      setSection(sectionFromUrl);
    }
    setHydrated(true);
    fetchUser();
  }, []);

  // ✅ Thay đổi section và cập nhật URL
  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    router.push(`/account?section=${newSection}`);
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-white pt-16 pb-4">
      <div className="w-full max-w-[1280px] mx-auto px-4">
        {/* ✅ Grid Layout chuẩn 12 cột */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* ✅ Sidebar trái, dịch sang phải một chút */}
          <div className="md:col-span-3 ml-20">
            <AccountSidebar
              currentSection={section}
              onChangeSection={handleSectionChange}
              user={user}
            />
          </div>

          {/* ✅ Nội dung phải (chiếm 9/12) */}
          <div className="md:col-span-9 pt-2 transition-all duration-300">
            {/* Điều kiện hiển thị từng section */}
            {section === 'profileView' && <AccountProfileView />}
            {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
            {section === 'changepassword' && <ChangePassword />}
            {section === 'address' && user && (
              <div className="max-w-[700px] mx-auto w-full">
                <AddressComponent userId={user.id} />
              </div>
            )}
            {section === 'followedshops' && <FollowedShops />}
            {section === 'orders' && <OrderSection />}
            {section === 'NotificationDropdown' && <NotificationDropdown />}
          </div>
        </div>
      </div>
    </div>
  );
}
