'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ShoppingCart, Heart, BarChart, User } from "lucide-react";
import styles from "./style/Header.module.css";

export default function Header() {
    const [isOpen, setIsOpen] = useState<{ shop: boolean; pages: boolean; blogs: boolean }>({
        shop: false,
        pages: false,
        blogs: false,
    });
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header className={styles.header}>
            <div className={`${styles.container} ${isSticky ? styles.sticky : ''}`}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    mart<span className={styles.logoAccent}>fury</span>
                </Link>

                {/* Search Bar */}
                <div className={styles.searchBar}>
                    <select className={styles.categorySelect}>
                        <option>All</option>
                    </select>
                    <input type="text" placeholder="I'm shopping for..." className={styles.searchInput} />
                    <button className={styles.searchButton}>Search</button>
                </div>

                {/* Icons */}
                <div className={styles.icons}>
                    <BarChart className={styles.icon} />
                    <Heart className={styles.icon} />
                    <ShoppingCart className={styles.icon} />
                    <User className={styles.icon} />
                </div>

                {/* Login/Register */}
                <Link href="#" className={styles.loginRegister}>Login / Register</Link>
            </div>

            {/* Navigation Bar */}
            <div className={styles.navbar}>
                <div className={styles.navItems}>
                    <div className={styles.navLeft}>
                        <div className={styles.navItem}>
                            <button className={styles.departmentButton}>Shop by Department</button>
                            <div className={styles.dropdownMenu}>
                                <Link href="#" className={styles.dropdownItem}>Category 1</Link>
                                <Link href="#" className={styles.dropdownItem}>Category 2</Link>
                            </div>
                        </div>

                        {["shop", "pages", "blogs"].map((menu) => (
                            <div key={menu} className={styles.navItem}>
                                <button className={styles.navButton}>
                                    <span>{menu.charAt(0).toUpperCase() + menu.slice(1)}</span>
                                    <ChevronDown className={styles.chevronIcon} />
                                </button>
                                <div className={styles.dropdownMenu}>
                                    <Link href="#" className={styles.dropdownItem}>Option 1</Link>
                                    <Link href="#" className={styles.dropdownItem}>Option 2</Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.navRight}>
                        <div className={styles.footer}>
                            <span className={styles.footerText}>Sell on Martfury</span>
                            <span className={styles.footerText}>Track your order</span>
                            <span className={styles.footerText}>USD</span>
                            <span className={styles.footerText}>English</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}