// components/ImageSlider.js

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './style/Banner.module.css';

const images = [
  '/images/img1.jpg',
  '/images/img2.jpg',
  '/images/img3.jpg',
];

const ImageSlider = () => {
  return (
    <div className={styles.slider}>
      <div className={styles.left}>
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
        >
          {images.map((src, index) => (
            <SwiperSlide key={index}>
              <img src={src} alt={`Slide ${index}`} className={styles.slideImage} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className={styles.right}>
        {/* Ảnh cố định ở đây */}
        <img
          src="data:image/jpeg;base64,...(base64 content here)..."
          alt="Fixed"
          className={styles.fixedImage}
        />
      </div>
    </div>
  );
};

export default ImageSlider;
