'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import {
  AiOutlineSearch,
  AiOutlineHeart,
  AiOutlineShoppingCart,
} from 'react-icons/ai';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Image from 'next/image';
import logoImage from '../../../public/logo.png';
import axios from 'axios';
import Cookies from 'js-cookie';

const Header = () => {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const headerHeight = 98;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔁 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🔁 Sticky header khi scroll
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    document.body.style.paddingTop = `${headerHeight}px`;
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.paddingTop = '';
    };
  }, []);

  // 🔁 Lấy user từ token (nếu có)
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios
        .get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => {
          Cookies.remove('authToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
    { href: '/about', label: 'About' },
  ];

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  // ✅ Đăng xuất: chỉ cần redirect, không setState để tránh giật
  const handleLogout = () => {
    Cookies.remove('authToken');
    window.location.href = '/';
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-60 ${
        isSticky
          ? 'bg-white shadow-md transition-shadow duration-300'
          : 'bg-white transition-all duration-300'
      }`}
    >
      {/* 🔝 Top Black Bar */}
      <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
        <div className="container mx-auto max-w-[1200px]">
          <span className="text-gray-400">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
          </span>{' '}
          <Link href="/shop" className="no-underline text-white ml-2 hover:underline">
            ShopNow
          </Link>
        </div>
      </div>

      {/* 🔻 Main Header */}
      <div className="py-0 px-2">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1200px] mx-auto">
          {/* 🔹 Logo */}
          <div className="flex items-center justify-start">
            <Link href="/" shallow>
              <Image
                src={logoImage}
                alt="Logo"
                width={150}
                height={90}
                className="rounded-full cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* 🔸 Navigation */}
          <nav className="flex items-center space-x-6">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className="text-black text-base !no-underline transition duration-200"
                >
                  {link.label}
                </Link>
                <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
            {/* ✅ Sign Up chỉ hiển thị nếu !user và loading xong */}
            {!loading && !user && (
              <div className="relative group">
                <Link
                  href="/signup"
                  className="text-black text-base !no-underline transition duration-200"
                >
                  Sign Up
                </Link>
                <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full" />
              </div>
            )}
          </nav>

          {/* 🔍 Search + Icons + Avatar */}
          <div className="flex justify-end items-center space-x-2">
            {/* 🔍 Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="What are you looking for"
                className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm bg-gray-100 text-black focus:outline-none focus:border-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              />
              <AiOutlineSearch
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 cursor-pointer"
                onClick={handleSearchSubmit}
              />
            </div>

            {/* ❤️ Wishlist & 🛒 Cart */}
            <Link href="/wishlist" shallow>
              <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
            </Link>
            <Link href="/cart" shallow>
              <AiOutlineShoppingCart className="h-5 w-5 text-black hover:text-blue-500 transition" />
            </Link>

            {/* 👤 User Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-8 w-8 bg-red-500 text-white !rounded-full flex items-center justify-center uppercase"
                >
                  {user.name[0]}
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-3 w-[224px] rounded-md shadow-xl z-50"
                    style={{
                      backgroundColor: 'rgba(30,30,30,0.7)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <ul className="text-sm text-white p-3 space-y-2">
                      <li className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer">
                        <FiUser /> Manage My Account
                      </li>
                      <li className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer">
                        <AiOutlineShoppingCart /> My Order
                      </li>
                      <li className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer">
                        <AiOutlineHeart /> My Reviews
                      </li>
                      <li className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer">
                        🏪 Open a Shop
                      </li>
                      <li
                        onClick={handleLogout}
                        className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer text-red-400"
                      >
                        <FiLogOut /> Logout
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📏 Divider */}
      <div className="bg-gray-200 h-0.5 w-full" />
    </header>
  );
};

export default Header;
