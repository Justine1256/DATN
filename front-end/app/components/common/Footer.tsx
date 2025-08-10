'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-900 text-white pt-8 pb-6">
      {/* 🧱 Grid container chia 12 cột - tự động responsive */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-10">

        {/* 🌐 Logo + Subscribe (3 cột trên desktop, full trên mobile) */}
        <div className="md:col-span-3 col-span-1">
          <Link href="/" className="inline-block mb-2 relative md:h-[40px]">
            <Image src="/logoft.png" alt="Logo công ty" fill sizes="(max-width: 120px) 120px, 40px" />
          </Link>
          <p className="text-sm mb-2">Đăng ký nhận tin</p>
          <p className="text-sm mb-4">Nhận 10% giảm giá cho đơn hàng đầu tiên</p>
          <form className="flex border border-white rounded overflow-hidden">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-3 py-2 text-sm text-white bg-transparent placeholder:text-gray-400 outline-none"
            />
            <button className="bg-white text-black px-4 hover:bg-gray-300 transition">→</button>
          </form>
        </div>

        {/* 🛠 Thông tin hỗ trợ */}
        <div className="md:col-span-2 col-span-1">
          <h3 className="text-lg font-bold mb-2">Hỗ trợ</h3>
          <p className="text-sm">111 Bijoy sarani, Dhaka, DH 1515, Bangladesh.</p>
          <p className="text-sm">vannhatcr123@gmail.com</p>
          <p className="text-sm">0978740071</p>
        </div>

        {/* 👤 Liên kết tài khoản */}
        <div className="md:col-span-2 col-span-1">
          <h3 className="text-lg font-bold mb-2">Tài khoản</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="#" className="link-underline">Tài khoản của tôi</Link></li>
            <li><Link href="#" className="link-underline">Đăng nhập / Đăng ký</Link></li>
            <li><Link href="#" className="link-underline">Giỏ hàng</Link></li>
            <li><Link href="#" className="link-underline">Danh sách yêu thích</Link></li>
            <li><Link href="#" className="link-underline">Mua sắm</Link></li>
          </ul>
        </div>

        {/* ⚡ Liên kết nhanh */}
        <div className="md:col-span-2 col-span-1">
          <h3 className="text-lg font-bold mb-2">Liên kết nhanh</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="#" className="link-underline">Chính sách bảo mật</Link></li>
            <li><Link href="/dieu-khoan" className="link-underline">Điều khoản sử dụng</Link></li>
            <li><Link href="#" className="link-underline">Câu hỏi thường gặp</Link></li>
            <li><Link href="#" className="link-underline">Liên hệ</Link></li>
          </ul>
        </div>

        {/* 📱 Tải ứng dụng + Mạng xã hội */}
        <div className="md:col-span-3 col-span-1">
          <h3 className="text-lg font-bold mb-2">Tải ứng dụng</h3>
          <p className="text-sm mb-2">Tiết kiệm 78k với người dùng mới</p>
          <div className="flex gap-3 mb-3">
            <Link href="/download-app">
              <Image src="/qr.png" alt="QR Code" width={64} height={64} />
            </Link>
            <div className="flex flex-col gap-2">
              <Link href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className='relative md:h-[30px]'>
                <Image src="/gg.png" alt="Google Play" fill sizes="(max-width: 96px) 96px, 30px" />
              </Link>
              <Link href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" className='relative md:h-[30px]'>
                <Image src="/ap.png" alt="App Store" fill sizes="(max-width: 96px) 96px, 30px" />
              </Link>
            </div>
          </div>
          {/* 🌐 Mạng xã hội */}
          <div className="flex gap-4 text-xl text-gray-400">
            <Link href="#" className="hover:text-white"><i className="fab fa-facebook-f" /></Link>
            <Link href="#" className="hover:text-white"><i className="fab fa-twitter" /></Link>
            <Link href="#" className="hover:text-white"><i className="fab fa-instagram" /></Link>
            <Link href="#" className="hover:text-white"><i className="fab fa-linkedin-in" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
