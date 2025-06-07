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
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`fixed top-0 left-0 right-0 z-[100] ${isSticky ? 'bg-white shadow-md transition-shadow duration-300' : 'bg-white transition-all duration-300'}`}>
      <div className="bg-white">
        <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
          <div className="container mx-auto max-w-[1200px] px-2">
            <span className="text-gray-400">
              Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
            </span>{' '}
            <Link href="/shop" className="text-white ml-2 hover:underline transition">
              ShopNow
            </Link>
          </div>
        </div>

        <div className="py-0 px-2">
          <div className="flex items-center justify-between py-4 px-7 md:px-8 max-w-[1280px] mx-auto">
            <Link href="/" shallow>
              <Image src={logoImage} alt="Logo" width={140} height={80} className="rounded-full cursor-pointer" priority />
            </Link>

            <button className="md:hidden text-2xl text-black" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <RxHamburgerMenu />
            </button>

            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link href={link.href} className="text-black text-base transition duration-300">
                    {link.label}
                  </Link>
                  <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
                </div>
              ))}
              {!loading && !user && (
                <div className="relative group">
                  <Link href="/login" className="text-black text-base transition duration-300">
                    Sign In
                  </Link>
                  <span className="absolute left-0 bottom-[-2px] h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
                </div>
              )}
            </nav>

            <div className="hidden md:flex justify-end items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="What are you looking for"
                  className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm bg-gray-100 text-black focus:outline-none focus:border-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                />
                <AiOutlineSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 cursor-pointer" onClick={handleSearchSubmit} />
              </div>

              <Link href="/wishlist" shallow>
                <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
              </Link>
              <Link href="/cart" shallow>
                <AiOutlineShoppingCart className="h-5 w-5 text-black hover:text-blue-500 transition" />
              </Link>

              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center uppercase">
                    {user.name[0]}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-[224px] rounded-md shadow-xl z-50" style={{ backgroundColor: 'rgba(30,30,30,0.7)', backdropFilter: 'blur(6px)' }}>
                      <ul className="space-y-1 text-sm font-medium text-white p-3">
                        <li>
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded whitespace-nowrap">
                            <FiUser className="shrink-0" /> <span className="text-sm font-medium">Manage My Account</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/orders" className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2">
                            <AiOutlineShoppingCart /> My Order
                          </Link>
                        </li>
                        <li>
                          <Link href="/reviews" className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2">
                            <AiOutlineHeart /> My Reviews
                          </Link>
                        </li>
                        <li>
                          <Link href="/voucher" className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2">
                            🎁 My Vouchers
                          </Link>
                        </li>
                        <li>
                          <Link href="/shop/open" className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2">
                            🏪 Open a Shop
                          </Link>
                        </li>
                        <li onClick={handleLogout} className="flex items-center gap-2 hover:bg-white/10 rounded px-3 py-2 cursor-pointer text-red-400">
                          <FiLogOut /> Logout
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-white px-6 py-3 space-y-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-black font-medium hover:underline transition" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {!loading && !user && (
                <Link href="/login" className="block text-black font-medium hover:underline transition" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-200 h-[1px] w-full" />
      </div>
    </header>
  );
};

export default Header;
