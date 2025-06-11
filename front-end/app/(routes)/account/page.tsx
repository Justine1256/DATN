'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';
import FollowedShops from '@/app/components/account/FollowedShops';
import { useRouter } from 'next/navigation';

export default function AccountRoute() {
  const [section, setSection] = useState<string>('profile');
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // Hàm lấy thông tin người dùng
  const fetchUser = useCallback(async () => {
    const token = Cookies.get('authToken');
    if (!token) return setLoading(false);

    try {
      const res = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu người dùng', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy tham số section từ URL khi component được tải lần đầu
  useEffect(() => {
    const sectionFromUrl = new URLSearchParams(window.location.search).get('section');
    if (sectionFromUrl) {
      setSection(sectionFromUrl);
    }
    setHydrated(true);
  }, []);

  // Chạy hàm fetchUser khi lần đầu vào trang
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!hydrated) return <div>Đang tải...</div>; // Thay thế với skeleton loader hoặc spinner

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-white pt-8 pb-2">
      <div className="w-full max-w-[1170px] mx-auto px-8">
        {/* <div className="flex justify-end items-center mb-2">
          {!loading && user && (
            <p className="text-sm font-medium text-black">
              Wellcome   <span className="text-[#DB4444]">{user.name}</span>
            </p>
          )}
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-30">
          <div className="md:col-span-3">
            <AccountSidebar currentSection={section} onChangeSection={(newSection: string) => {
              setSection(newSection);
              router.push(`/account?section=${newSection}`, undefined, { shallow: true });
            }} />
          </div>

          <div className="md:col-span-9 pt-2">
            <div className="w-full max-w-[600px] mx-auto transition-all duration-300">
              {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
              {section === 'changepassword' && <ChangePassword />}
              {section === 'address' && user && <AddressComponent userId={user.id} />}
              {section === 'followedshops' && <FollowedShops />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
