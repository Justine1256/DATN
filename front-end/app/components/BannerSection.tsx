"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./style/Banner.module.css"; // Import CSS Modules

const largeBanners = [
  {
    id: 1,
    image: "https://cf.shopee.vn/file/sg-11134258-7reqp-m831t3z7nkpub0_xxhdpi", // Thay thế bằng đường dẫn thực tế
    alt: "Shopee Style 1",
  },
  {
    id: 2,
    image: "https://cf.shopee.vn/file/sg-11134258-7renx-m8363cou0fc2e6_xhdpi", // Thay thế bằng đường dẫn thực tế
    alt: "Shopee Style 2",
  },
  {
    id: 3,
    image: "https://cf.shopee.vn/file/sg-11134258-7reo5-m836zaw8s8mfa4_xhdpi", // Thay thế bằng đường dẫn thực tế
    alt: "Shopee Style 3",
  },
];

export default function BannerSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null); // Khởi tạo với kiểu NodeJS.Timeout | null

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % largeBanners.length);
    }, 3000); // Tự động chuyển slide sau mỗi 3 giây

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % largeBanners.length);
    if (slideInterval.current) {
      clearInterval(slideInterval.current); // Reset interval khi người dùng tương tác
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % largeBanners.length);
    }, 3000);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + largeBanners.length) % largeBanners.length);
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % largeBanners.length);
    }, 3000);
  };

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.largeBanner}>
        <img src={largeBanners[currentSlide].image} alt={largeBanners[currentSlide].alt} className={styles.bannerImage} />
        <button className={`${styles.navigationButton} ${styles.prevButton}`} onClick={prevSlide}>&lt;</button>
        <button className={`${styles.navigationButton} ${styles.nextButton}`} onClick={nextSlide}>&gt;</button>
      </div>
      <div className={styles.smallBanners}>
        <div className={styles.smallBanner}>
          <img src="https://cf.shopee.vn/file/sg-11134258-7renx-m8363cou0fc2e6_xhdpi" alt="Shopee Pay Banner" /> {/* Thay thế bằng đường dẫn thực tế */}
        </div>
        <div className={styles.smallBanner}>
          <img src="https://cf.shopee.vn/file/sg-11134258-7reo5-m836zaw8s8mfa4_xhdpi" alt="Shopee Food Banner" /> {/* Thay thế bằng đường dẫn thực tế */}
        </div>
      </div>
    </div>
  );
}