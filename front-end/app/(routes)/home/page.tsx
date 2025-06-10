'use client';

import LandingSlider from '@/app/components/home/LandingSlider';
import FlashSale from '@/app/components/home/FlashSale';
// import BlackBannerWithCountdown from '@/app/components/home/BlackBannerWithCountdown';
import CategoryGrid from '@/app/components/home/CategoryGrid';
import BestSelling from '@/app/components/home/BestSelling';
import NewProducts from '@/app/components/home/NewProduct';
import NewArrivalGrid from '@/app/components/home/NewArrival';
import ServiceBanner from '@/app/components/home/ServiceBanner';

export default function HomePage() {
  return (
    <main className="bg-white pb-10">
      {/* 🖼️ Slide giới thiệu đầu trang */}
      <section className="max-w-screen-xl mx-auto px-4 pt-16">
        <LandingSlider />
      </section>

      {/* ⚡ Flash Sale (có đếm ngược + sản phẩm giảm giá) */}
      <section className="max-w-screen-xl mx-auto px-4 pt-12">
        <FlashSale />
      </section>

      {/* 📦 Danh mục sản phẩm dạng lưới */}
      <section className="max-w-screen-xl mx-auto px-4 pt-19">
        <CategoryGrid />
      </section>

      {/* 🔥 Sản phẩm bán chạy */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10">
        <BestSelling />
      </section>

      {/* 🕒 Banner màu đen với đếm ngược khuyến mãi */}
      {/* <section className="max-w-screen-xl mx-auto px-4 pt-10">
        <BlackBannerWithCountdown />
      </section> */}

      {/* 🆕 Sản phẩm mới đăng */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10">
        <NewProducts />
      </section>

      {/* ✨ Hàng mới về dạng lưới (có thể dạng ảnh lớn) */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10">
        <NewArrivalGrid />
      </section>

      {/* ✅ Banner dịch vụ cuối trang (giao hàng, hỗ trợ...) */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10">
        <ServiceBanner />
      </section>
    </main>
  );
}
