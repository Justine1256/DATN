'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';

export default function AccountRoute() {
  // ✅ Khởi tạo section từ localStorage (chỉ khi client render)
  const [section, setSection] = useState<string>('profile');
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false); // ✅ Ngăn flicker khi SSR

  // ✅ Lưu section vào localStorage khi người dùng đổi
  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    if (typeof window !== 'undefined') {
      localStorage.setItem('account_section', newSection);
    }
  };

  // ✅ Lấy user từ API nếu có token
  const fetchUser = async () => {
    const token = Cookies.get('authToken');
    if (!token) return setLoading(false);
    try {
      const res = await axios.get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy section từ localStorage sau khi client mounted
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('account_section');
      if (saved) setSection(saved);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  if (!hydrated) return null; // ✅ Tránh flicker khi SSR

  return (
    <div className="bg-white pt-16 pb-16 min-h-screen">
      {/* ✅ Header chào người dùng */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="flex justify-end items-center mb-2">
          {!loading && user && (
            <p className="text-sm font-medium text-black px-40">
              Welcome! <span className="text-[#DB4444]">{user.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* ✅ Giao diện dạng grid chia sidebar / nội dung */}
      <div className="container mx-auto px-24 max-w-[1170px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* ✅ Sidebar chiếm 3 cột */}
          <div className="md:col-span-3 md:mt-1">
            <AccountSidebar currentSection={section} onChangeSection={handleSectionChange} />
          </div>

          {/* ✅ Nội dung chiếm 9 cột */}
          <div className="md:col-span-9 flex justify-center pt-4">
            <div className="w-full max-w-[600px] min-h-[500px] transition-all duration-300">
              {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
              {section === 'changepassword' && <ChangePassword />}
              {section === 'address' && user && <AddressComponent userId={user.id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
