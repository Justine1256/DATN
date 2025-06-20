'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';

import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';
import FollowedShops from '@/app/components/account/FollowedShops';
import NotificationDropdown from '@/app/components/account/NotificationDropdown';
import OrderSection from '@/app/components/account/OrderSection';
import AccountProfileView from '@/app/components/account/AccountProfileView';

export default function AccountRoute() {
  const [section, setSection] = useState<string>('profileView');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // ✅ Lấy thông tin người dùng
  const fetchUser = async () => {
    const token = Cookies.get('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
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

  // ✅ Mount lần đầu
  useEffect(() => {
    const sectionFromUrl = new URLSearchParams(window.location.search).get('section');
    if (sectionFromUrl) {
      setSection(sectionFromUrl);
    }
    setHydrated(true);
    fetchUser();
  }, []);

  // ✅ Đổi tab và cập nhật URL
  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    router.push(`/account?section=${newSection}`);
  };

  if (!hydrated || loading) return ;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-10">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* 🔹 Sidebar trái */}
          <div className="md:col-span-3">
            <AccountSidebar
              currentSection={section}
              onChangeSection={handleSectionChange}
              user={user}
            />
          </div>

          {/* 🔹 Nội dung phải */}
          <div className="md:col-span-9 w-full">
            <div className="max-w-3xl mx-auto w-full px-2">
              {section === 'profileView' && <AccountProfileView />}
              {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
              {section === 'changepassword' && <ChangePassword />}
              {section === 'address' && user && (
                <div className="max-w-[700px] w-full mx-auto">
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
    </div>
  );
  
}
