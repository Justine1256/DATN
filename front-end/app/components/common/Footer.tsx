'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-900 text-white pt-8 pb-6">
      {/* Container chia 12 cột, căn giữa toàn footer */}
      <div className="max-w-screen-xl mx-auto px-16 grid grid-cols-12 gap-10">

        {/* Logo + Subscribe (chiếm 3 cột) */}
        <div className="col-span-12 md:col-span-3">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logoft.png" alt="Company Logo" width={120} height={40} />
          </Link>
          <p className="text-sm mb-2">Subscribe</p>
          <p className="text-sm mb-4">Get 10% off your first order</p>
          <form className="flex border border-white rounded overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 text-sm text-white bg-transparent placeholder:text-gray-400 outline-none"
            />
            <button className="bg-white text-black px-4 hover:bg-gray-300 transition">→</button>
          </form>
        </div>

        {/* Support (2 cột) */}
        <div className="col-span-6 md:col-span-2">
          <h3 className="text-lg font-bold mb-2">Support</h3>
          <p className="text-sm">111 Bijoy sarani, Dhaka, DH 1515, Bangladesh.</p>
          <p className="text-sm">vannhatcr123@gmail.com</p>
          <p className="text-sm">0978740071</p>
        </div>

        {/* Account (2 cột) */}
        <div className="col-span-6 md:col-span-2">
          <h3 className="text-lg font-bold mb-2">Account</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="#">My Account</Link></li>
            <li><Link href="#">Login / Register</Link></li>
            <li><Link href="#">Cart</Link></li>
            <li><Link href="#">Wishlist</Link></li>
            <li><Link href="#">Shop</Link></li>
          </ul>
        </div>

        {/* Quick Link (2 cột) */}
        <div className="col-span-6 md:col-span-2">
          <h3 className="text-lg font-bold mb-2">Quick Link</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="#">Privacy Policy</Link></li>
            <li><Link href="#">Terms Of Use</Link></li>
            <li><Link href="#">FAQ</Link></li>
            <li><Link href="#">Contact</Link></li>
          </ul>
        </div>

        {/* Download App (3 cột) */}
        <div className="col-span-12 md:col-span-3">
          <h3 className="text-lg font-bold mb-2">Download App</h3>
          <p className="text-sm mb-2">Save $3 with App New User Only</p>
          <div className="flex gap-2 mb-3">
            <Link href="/download-app">
              <Image src="/qr.png" alt="QR Code" width={64} height={64} />
            </Link>
            <div className="flex flex-col gap-2">
              <Link href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                <Image src="/gg.png" alt="Google Play" width={96} height={30} />
              </Link>
              <Link href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
                <Image src="/ap.png" alt="App Store" width={96} height={30} />
              </Link>
            </div>
          </div>
          {/* Socials */}
          <div className="flex gap-4 text-xl text-gray-400">
            <Link href="#"><i className="fab fa-facebook-f hover:text-white" /></Link>
            <Link href="#"><i className="fab fa-twitter hover:text-white" /></Link>
            <Link href="#"><i className="fab fa-instagram hover:text-white" /></Link>
            <Link href="#"><i className="fab fa-linkedin-in hover:text-white" /></Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
