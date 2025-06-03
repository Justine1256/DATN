'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  AiOutlineSearch,
  AiOutlineHeart,
  AiOutlineShoppingCart,
} from 'react-icons/ai';
import Image from 'next/image';
import logoImage from '../../../public/logo.png';

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const headerHeight = 98;

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    document.body.style.paddingTop = `${headerHeight}px`;
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.paddingTop = '';
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
    { href: '/about', label: 'About' },
    { href: '/signup', label: 'Sign Up' },
  ];

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-60 ${
        isSticky
          ? 'bg-white shadow-md transition-shadow duration-300'
          : 'bg-white transition-all duration-300'
      }`}
    >
      {/* Top Black Bar */}
      <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
        <div className="container mx-auto max-w-[1200px]">
          <span className="text-gray-400">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
          </span>{' '}
          <Link href="/shop" className="no-underline text-white">
            ShopNow
          </Link>
        </div>
      </div>

      {/* Bottom Header */}
      <div className="py-4 px-6">
        <div className="container mx-auto grid grid-cols-12 items-center max-w-[1200px]">
          {/* Logo */}
          <div className="col-span-4 md:col-span-3 flex items-center justify-start">
            <Link href="/" shallow>
              <Image
                src={logoImage}
                alt="Exclusive Logo"
                width={130}
                height={30}
                className="cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="col-span-8 md:col-span-6 flex space-x-8">
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
          </nav>

          {/* Search + Icons */}
          <div className="col-span-12 md:col-span-3 flex justify-end items-center space-x-3 mt-2 md:mt-0">
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
            <div className="flex items-center space-x-2">
              <Link href="/wishlist" shallow>
                <AiOutlineHeart className="h-5 w-5 text-black hover:text-red-500 transition" />
              </Link>
              <Link href="/cart" shallow>
                <AiOutlineShoppingCart className="h-5 w-5 text-black hover:text-blue-500 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="bg-gray-200 h-0.5 w-full" />
    </header>
  );
};

export default Header;
