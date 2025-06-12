'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';
import FollowedShops from '@/app/components/account/FollowedShops';
import OrderSection from '@/app/components/account/Order';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
export default function AccountRoute() {
  const [section, setSection] = useState<string>('profile');
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
    router.push(`/account?section=${newSection}`, undefined, { shallow: true });
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-white pt-8 pb-4">
      <div className="w-full max-w-[1170px] mx-auto px-4">
        <div className="flex justify-end items-center mb-2">
          {!loading && user && (
            <p className="text-sm font-medium text-black">
              Welcome! <span className="text-[#DB4444]">{user.name}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-26">
          {/* ✅ Sidebar bên trái */}
          <div className="md:col-span-3">
            <AccountSidebar
              currentSection={section}
              onChangeSection={handleSectionChange}
              user={user} // ✅ Truyền user xuống Sidebar
            />
          </div>

          {/* ✅ Nội dung từng mục bên phải */}
          <div className="md:col-span-9 pt-2">
            <div className="w-full max-w-[600px] mx-auto transition-all duration-300">
              {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
              {section === 'changepassword' && <ChangePassword />}
              {section === 'address' && user && <AddressComponent userId={user.id} />}
              {section === 'followedshops' && <FollowedShops />}
              {section === 'orders' && <OrderSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
