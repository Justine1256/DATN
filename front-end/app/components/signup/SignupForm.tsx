'use client';

import { useState } from "react";

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting", formData);
  };

  return (
    <div className="w-full p-10 text-black">
      <h2 className="text-2xl font-semibold mb-1">Create an account</h2>
      <p className="text-black mb-6">Enter your details below</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-black placeholder-gray-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email or Phone Number"
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-black placeholder-gray-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-black placeholder-gray-400"
        />
        <input
          type="text"
          name="otp"
          placeholder="OTP"
          onChange={handleChange}
          className="w-full border-b p-2 focus:outline-none text-black placeholder-gray-400"
        />
        <button
          type="submit"
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Create Account
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-grow border-t" />
        <span className="mx-2 text-black">or</span>
        <div className="flex-grow border-t" />
      </div>

      <button className="w-full border flex items-center justify-center py-2 rounded text-black hover:bg-gray-100">
        <img src="/google-logo.png" alt="Google" className="w-8 h-8 mr-2" />
        Sign up with Google
      </button>

      <p className="text-center mt-6 text-sm text-black">
        Already have an account?{" "}
        <a href="/login" className="underline hover:text-blue-600">
          Log in
        </a>
      </p>
    </div>
  );
}
