"use client";

import Link from 'next/link';
import { useState, ChangeEvent } from 'react';
import styles from './style/Header.module.css';

export default function Header() {
  const [language, setLanguage] = useState('English');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header>
      <div className={styles.topBar}>
        <div className={styles.topBarText}>
          Summer Sale For All Swim Suits And Free Express Delivery - Off 50%!{' '}
          <Link href="/shop" className={styles.topBarLink}>
            ShopNow
          </Link>
        </div>
        <div className={styles.languageDropdown}>
          <select
            value={language}
            onChange={handleLanguageChange}
            className={styles.languageSelect}
          >
            <option>English</option>
            <option>Vietnamese</option>
          </select>
          <svg
            className={styles.languageIcon}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div className={styles.mainHeader}>
        <Link href="/" className={styles.logo}>
          Exclusive
        </Link>
        <button className={styles.menuButton} onClick={toggleMenu}> {/* Nút menu cho mobile */}
          ☰
        </button>
        <nav className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}> {/* Thêm class có điều kiện */}
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
          <Link href="/signup" className={styles.navLink}>
            Sign Up
          </Link>
        </nav>
        <div className={styles.searchAndIcons}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              placeholder="What are you looking for?"
              className={styles.searchInput}
            />
            <svg
              className={styles.searchIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Link href="/wishlist" className={styles.iconLink}>
            <svg
              className={`${styles.icon} ${styles.wishlistIcon}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </Link>
          <Link href="/cart" className={styles.iconLink}>
            <svg
              className={`${styles.icon} ${styles.cartIcon}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}