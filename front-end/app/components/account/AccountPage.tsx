'use client';

import { useState } from 'react';

export default function AccountPage() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('Cập nhật thành công!');
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-[900px] mx-auto px-4 pt-10 text-black">
          <div className="p-8 rounded-lg bg-white shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-[#DB4444]">Edit Your Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={userData.firstName}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-md focus:outline-none hover:border-gray-300"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={userData.lastName}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-md focus:outline-none hover:border-gray-300"
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={userData.email}
                onChange={handleChange}
                className="border border-gray-300 p-3 rounded-md w-full focus:outline-none hover:border-gray-300"
              />

              <input
                type="text"
                name="address"
                placeholder="Address"
                value={userData.address}
                onChange={handleChange}
                className="border border-gray-300 p-3 rounded-md w-full focus:outline-none hover:border-gray-300"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current Password"
                  value={userData.currentPassword}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-md focus:outline-none hover:border-gray-300"
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  value={userData.newPassword}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-md focus:outline-none hover:border-gray-300"
                />
              </div>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={userData.confirmPassword}
                onChange={handleChange}
                className="border border-gray-300 p-3 rounded-md w-full focus:outline-none hover:border-gray-300"
              />

              {error && <p className="text-red-600">{error}</p>}
              {successMessage && <p className="text-green-600">{successMessage}</p>}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="reset"
                  onClick={() =>
                    setUserData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      address: '',
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }
                  className="border border-gray-400 px-5 py-2.5 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#DB4444] text-white px-6 py-2.5 rounded-md hover:opacity-60 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}