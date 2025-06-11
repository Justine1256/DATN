'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AiOutlineSearch,
  AiOutlineHeart,
  AiOutlineShoppingCart,
} from 'react-icons/ai';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { RxHamburgerMenu } from 'react-icons/rx';
import Image from 'next/image';
import logoImage from '../../../public/logo.png';
import axios from 'axios';
import Cookies from 'js-cookie';

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Đóng dropdown nếu click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Sticky header
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Lấy user từ token
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) return;
    axios
      .get('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        Cookies.remove('authToken');
        setUser(null);
      });
  }, []);

  useEffect(() => {
    navLinks.forEach((link) => router.prefetch(link.href));
  }, []);
  
  // ✅ Nav links
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
    { href: '/about', label: 'About' },
    { href: '/voucher', label: 'Voucher' },
  ];

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    setUser(null);
    router.push('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] ${isSticky ? 'shadow-md' : ''} bg-white transition-all duration-300`}>
      <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
        <div className="container mx-auto max-w-[1200px] px-2">
          <span className="text-gray-400">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
          </span>{' '}
          <Link href="/shop" className="text-white ml-2 hover:underline transition text-sm">
            ShopNow
          </Link>
        </div>
      </div>

      <div className="py-0 px-2">
        <div className="flex items-center justify-between py-4 px-7 md:px-8 max-w-[1280px] mx-auto">
          {/* ✅ Logo cố định size */}
          <Link href="/">
            <Image
              src={logoImage}
              alt="Logo"
              width={140}
              height={80}
              className="rounded-full cursor-pointer"
              priority
            />
          </Link>

          {/* ✅ Hamburger menu */}
          <button
            className="md:hidden text-2xl text-black min-w-[32px]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <RxHamburgerMenu />
          </button>

          {/* ✅ Nav links (desktop) */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="relative group text-black text-sm md:text-base transition duration-300 hover:opacity-90"
              >
                {link.label}
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </button>
            ))}

            {!user && (
              <div className="relative group">
                <Link href="/login" className="text-black text-sm md:text-base transition duration-300">
                  Sign In
                </Link>
                <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </div>
            )}
          </nav>

          {/* ✅ Icons & User dropdown */}
          <div className="hidden md:flex items-center space-x-2 px-8">
            {/* ✅ Search */}
            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-1.5 pr-10 rounded-md bg-white border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DB4444] focus:border-[#DB4444] transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              <AiOutlineSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black cursor-pointer h-5 w-5"
                onClick={handleSearchSubmit}
              />
            </div>


            {/* ✅ Wishlist */}
            <Link href="/wishlist">
              <div className="min-w-[32px] flex justify-center items-center">
                <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
              </div>
            </Link>

            {/* ✅ Cart */}
            <Link href="/cart">
              <div className="min-w-[32px] flex justify-center items-center">
                <AiOutlineShoppingCart className="h-5 w-5 text-black hover:text-red-500 transition" />
              </div>
            </Link>

            {/* ✅ Dropdown User */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center uppercase text-sm font-semibold"
                >
                  {user.name[0]}
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-3 w-[224px] rounded-md shadow-xl z-50"
                    style={{
                      backgroundColor: 'rgba(30,30,30,0.7)', // ✅ màu đen trong mờ
                      backdropFilter: 'blur(6px)',           // ✅ hiệu ứng làm mờ nền sau
                    }}
                  >
                    <ul className="space-y-1 text-sm font-medium text-white p-3">
                      <li>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded"
                        >
                          <FiUser /> Manage My Account
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/shop/open"
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded"
                        >
                          🏪 Open a Shop
                        </Link>
                      </li>
                      <li
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-red-400 cursor-pointer rounded"
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

        {/* ✅ Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-6 py-3 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-black text-sm font-medium hover:underline transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                className="block text-black text-sm font-medium hover:underline transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ✅ Line dưới header */}
      <div className="bg-gray-200 h-[1px] w-full" />
    </header>
  );
};

export default Header;
