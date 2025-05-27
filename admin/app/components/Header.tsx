// components/Header.tsx
"use client";
import { useEffect, useState } from "react";
import {
  FaBell,
  FaCog,
  FaClock,
  FaMoon,
  FaSun,
  FaUser,
  FaComments,
  FaWallet,
  FaQuestionCircle,
  FaLock,
  FaSignOutAlt,
  FaSearch
} from "react-icons/fa";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-10 bg-white text-black shadow px-6 py-4 flex justify-between items-center border-b">
      <div className="flex items-center gap-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <FaSun
          onClick={toggleDark}
          className="text-yellow-500 hover:text-yellow-600 cursor-pointer"
        />
        <FaBell className="text-gray-700 hover:text-gray-900 cursor-pointer" />
        <FaCog className="text-gray-700 hover:text-gray-900 cursor-pointer" />
        <FaClock className="text-gray-700 hover:text-gray-900 cursor-pointer" />
        <div className="relative">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Avatar"
            className="w-8 h-8 rounded-full cursor-pointer ring-1 ring-blue-500"
            onClick={() => setIsOpen(!isOpen)}
          />
          <div
            className={`transition-all duration-200 origin-top-right transform ${
              isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
            } absolute right-0 mt-2 w-56 bg-white text-black rounded shadow-lg border p-2 text-sm z-50`}
          >
            <div className="px-3 py-2 font-semibold border-b">Welcome Gaston!</div>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <FaUser /> Profile
            </div>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <FaComments /> Messages
            </div>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <FaWallet /> Pricing
            </div>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <FaQuestionCircle /> Help
            </div>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <FaLock /> Lock screen
            </div>
            <div className="border-t mt-2 pt-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer">
              <FaSignOutAlt className="inline mr-1" /> Logout
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}