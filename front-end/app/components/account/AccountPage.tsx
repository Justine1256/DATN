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
    setSuccessMessage('');

    // Chỉ demo local, giả lập thành công
    setSuccessMessage('Cập nhật thành công!');
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 text-black">
      <h2 className="text-xl font-semibold mb-6">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={userData.firstName}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={userData.lastName}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={userData.email}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={userData.address}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <div className="grid grid-cols-1 gap-4 pt-4">
          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={userData.currentPassword}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={userData.newPassword}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={userData.confirmPassword}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {successMessage && <p className="text-green-600">{successMessage}</p>}

        <div className="flex gap-4 mt-4">
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
            className="border border-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#DB4444] text-white px-6 py-2 rounded hover:opacity-80"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
