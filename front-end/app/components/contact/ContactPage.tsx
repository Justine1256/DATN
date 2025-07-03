'use client';

import { FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function ContactPage() {
  return (
    <div className={`container mx-auto px-4 py-16 ${inter.className}`}>
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left - Contact Info (1/3) */}
        <div className="md:w-1/3 bg-white p-8 rounded shadow-md">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#db4444] text-white flex items-center justify-center">
                <FaPhoneAlt />
              </div>
              <h4 className="font-semibold text-black text-lg">Call To Us</h4>
            </div>
            <p className="text-sm mb-2">We are available 24/7, 7 days a week.</p>
            <p className="text-sm text-black">Phone: +8801611112222</p>
          </div>

          <hr className="my-6 border-gray-300" />

          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#db4444] text-white flex items-center justify-center">
                <FaEnvelope />
              </div>
              <h4 className="font-semibold text-black text-lg">Write To Us</h4>
            </div>
            <p className="text-sm mb-2">Fill out our form and we will contact you within 24 hours.</p>
            <p className="text-sm text-black">Email: customer@exclusive.com</p>
            <p className="text-sm text-black">Email: support@exclusive.com</p>
          </div>
        </div>

        {/* Right - Contact Form (2/3) */}
        <div className="md:w-2/3 bg-white p-8 rounded shadow-md">
          <form className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <input
              type="text"
              placeholder="Your Name *"
              className="col-span-1 border border-gray-300 px-4 py-4 rounded focus:outline-none focus:border-[#db4444]"
            />
            <input
              type="email"
              placeholder="Your Email *"
              className="col-span-1 border border-gray-300 px-4 py-4 rounded focus:outline-none focus:border-[#db4444]"
            />
            <input
              type="tel"
              placeholder="Your Phone *"
              className="col-span-1 border border-gray-300 px-4 py-4 rounded focus:outline-none focus:border-[#db4444]"
            />
          </form>

          <textarea
            rows={6}
            placeholder="Your Message"
            className="w-full border border-gray-300 px-4 py-4 rounded resize-none focus:outline-none focus:border-[#db4444] mb-6"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#db4444] text-white px-8 py-3 rounded hover:bg-[#c33b3b] transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
