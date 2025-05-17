'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AiOutlineSearch,
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiOutlineMenu, // Import the menu icon
} from 'react-icons/ai';
import Image from 'next/image';

import logoImage from '../../../public/logo.png'; // Assuming logo.png is in the public directory

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
    { href: '/about', label: 'About' },
    { href: '/signup', label: 'Sign Up' },
  ];

  return (
    <header>
      {/* Top Black Header */}
      <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
        <span className="text-gray-400">Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%! </span>{' '}
        <Link href="/shop" className="no-underline text-white">
          ShopNow
        </Link>
      </div>

      {/* Bottom Navigation Header */}
      <div className="bg-white py-4 px-6 no-">
        <div className="container mx-auto grid grid-cols-12 items-center">
          {/* Logo and Mobile Menu */}
          <div className="col-span-6 md:col-span-3 flex items-center justify-between md:justify-start">
            <Link href="/" className="text-xl font-bold text-black no-underline">
              <Image src={logoImage} alt="Exclusive Logo" width={130} height={30} />
            </Link>
            <button onClick={toggleMobileMenu} className="md:hidden text-black focus:outline-none">
              <AiOutlineMenu className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className={`col-span-12 md:col-span-6 justify-start md:justify-start no-underline${ 
              isMobileMenuOpen ? 'flex flex-col space-y-4 mt-4 ' : 'hidden md:flex space-x-12 ml-[0rem]'  
            }`}
          >
            {navLinks.map((link) => (
             <div key={link.href} className="relative group"> {/* Added the 'group' class */}
             <Link
               href={link.href}
               className="text-black transition-all duration-200 !no-underline"
             >
               {link.label}
             </Link>
             <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full no-underline" />
           </div>
            ))}
          </nav>

          {/* Search Bar and Icons */}
          <div className="col-span-6 md:col-span-3 justify-end flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="What are you looking for?"
                className="border border-gray-300 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-black text-black bg-gray-100"
              />
              <AiOutlineSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/wishlist" className="text-black hover:text-gray-700 transition-colors duration-200">
                <AiOutlineHeart className="h-6 w-6" />
              </Link>
              <Link href="/cart" className="text-black hover:text-gray-700 transition-colors duration-200">
                <AiOutlineShoppingCart className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;