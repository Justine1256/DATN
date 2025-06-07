'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AddressComponent from '@/app/components/account/Address';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';

export default function AccountRoute() {
  // 👉 Lưu section vào localStorage để nhớ khi reload
  const [section, setSection] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('account_section') || 'profile';
    }
    return 'profile';
  });

  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // ⏺ Khi user chọn section → lưu vào localStorage
  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    localStorage.setItem('account_section', newSection);
  };

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

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="bg-white pt-16 pb-16 min-h-screen">
      {/* Header */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="flex justify-end items-center mb-2">
          {!loading && user && (
            <p className="text-sm font-medium text-black px-40">
              Welcome! <span className="text-[#DB4444]">{user.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="container mx-auto px-24 max-w-[1170px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Sidebar cố định 3 cột */}
          <div className="md:col-span-3 md:mt-1">
            <AccountSidebar currentSection={section} onChangeSection={handleSectionChange} />
          </div>

          {/* Nội dung form chiếm 9 cột và căn giữa */}
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
