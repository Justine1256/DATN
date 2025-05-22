'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
    AiOutlineSearch,
    AiOutlineHeart,
    AiOutlineShoppingCart,
    // AiFillHeart, // Có thể bỏ import nếu chưa dùng
    // AiFillShoppingCart, // Có thể bỏ import nếu chưa dùng
} from 'react-icons/ai';
import Image from 'next/image';

import logoImage from '../../../public/logo.png';

const Header = () => {
    const [isSticky, setIsSticky] = useState(false);
    const headerTopHeight = 38;
    const headerBottomHeight = 60;
    const headerHeight = headerTopHeight + headerBottomHeight;
    const maxWidth = '1200px';
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        document.body.style.paddingTop = `${headerHeight}px`;

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.body.style.paddingTop = '';
        };
    }, [headerHeight]);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/contact', label: 'Contact' },
        { href: '/about', label: 'About' },
        { href: '/signup', label: 'Sign Up' },
    ];

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearchSubmit(event);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent | React.KeyboardEvent) => {
        event.preventDefault(); // Ngăn chặn hành vi mặc định của form (nếu có) hoặc sự kiện keydown
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
            // Implement your search navigation logic here
        }
    };

    const handleSearchIconClick = () => {
        // Tạo một đối tượng sự kiện ảo để gọi handleSearchSubmit
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSearchSubmit(fakeEvent);
    };

    return (
        <header className={`fixed top-0 left-0 w-full z-50 ${isSticky ? 'bg-white shadow-md transition-shadow duration-300' : 'bg-white/90 backdrop-blur-sm transition-all duration-300'}`}>
            {/* Top Black Header */}
            <div className="bg-black text-white py-2 text-center text-sm tracking-wider">
                <div className={`container mx-auto max-w-[${maxWidth}]`}>
                    <span className="text-gray-400">Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%! </span>{' '}
                    <Link href="/shop" className="no-underline text-white">
                        ShopNow
                    </Link>
                </div>
            </div>

            {/* Bottom Navigation Header */}
            <div className="py-2 px-6">
                <div className={`container mx-auto grid grid-cols-12 items-center max-w-[${maxWidth}]`}>
                    {/* Logo */}
                    <div className="col-span-4 md:col-span-3 flex items-center justify-start">
                        <Link href="/" className="text-xl font-bold text-black no-underline">
                            <Image src={logoImage} alt="Exclusive Logo" width={130} height={30} />
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav
                        className={`col-span-8 md:col-span-6 justify-start md:justify-start no-underline flex space-x-8 ml-[0rem]`}
                    >
                        {navLinks.map((link) => (
                            <div key={link.href} className="relative group">
                                <Link
                                    href={link.href}
                                    className="!text-black transition-all duration-200 !no-underline text-base"
                                >
                                    {link.label}
                                </Link>
                                <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full no-underline" />
                            </div>
                        ))}
                    </nav>

                    {/* Search Bar and Icons */}
                    <div className="col-span-12 md:col-span-3 justify-end flex items-center space-x-3 mt-2 md:mt-0">
                        <div className="relative ">
                            <input
                                type="text"
                                placeholder="What are you looking for"
                                className="border border-gray-300 !rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-black text-black bg-gray-100"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown} // Thêm xử lý sự kiện Enter
                            />
                            <AiOutlineSearch
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 cursor-pointer"
                                onClick={handleSearchIconClick}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/wishlist" className="text-black hover:text-red-500 transition-colors duration-200">
                                <AiOutlineHeart className="h-5 w-5" />
                            </Link>
                            <Link href="/cart" className="text-black hover:text-blue-500 transition-colors duration-200">
                                <AiOutlineShoppingCart className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Light Gray Separator */}
            <div className="bg-gray-200 h-0.5 w-full" />
        </header>
    );
};

export default Header;