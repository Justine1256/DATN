'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AccountSidebar from '@/app/components/account/AccountSidebar';
import AccountPage from '@/app/components/account/AccountPage';
import ChangePassword from '@/app/components/account/ChangePassword';

export default function AccountRoute() {
  const [section, setSection] = useState('profile');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user profile
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
      {/* ✅ Welcome header */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="flex justify-end items-center mb-2">
          {!loading && user && (
            <p className="text-sm font-medium text-black">
              Welcome! <span className="text-[#DB4444]">{user.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* ✅ Main layout: sidebar + form */}
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="grid grid-cols-8 md:grid-cols-12 gap-8 items-start">
          {/* Sidebar 3 columns */}
          <div className="md:col-span-3 md:mt-1 md:ml-24">
            <AccountSidebar currentSection={section} onChangeSection={setSection} />
          </div>

          {/* Form 9 columns with center form box */}
          <div className="md:col-span-9 flex justify-center pt-2">
            <div className="w-full max-w-[600px] min-h-[500px] transition-all duration-300">
              {section === 'profile' && <AccountPage onProfileUpdated={fetchUser} />}
              {section === 'changepassword' && <ChangePassword />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
