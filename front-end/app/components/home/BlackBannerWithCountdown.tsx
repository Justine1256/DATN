'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const endTime = new Date().getTime() + 5 * 24 * 60 * 60 * 1000;

export default function HeroSpeakerBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-black rounded-lg overflow-hidden max-w-[1110px] h-[450px] mx-auto px-10 py-10 grid grid-cols-12 items-center">
      {/* Left: col-span-5 */}
      <div className="col-span-5 text-white flex flex-col gap-2">
        <p className="text-green-400 text-lg font-semibold">Categories</p>
        <h2 className="text-5xl font-bold leading-tight">
          Enchance Your<br />Music Experience
        </h2>

        <div className="flex gap-4 mt-6">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds },
          ].map((item, index) => (
            <div key={index} className="bg-white text-black w-24 h-24 rounded-full flex flex-col justify-center items-center text-center transition-all duration-300">
              <span className="text-xl font-bold animate-scaleUp">{item.value}</span>
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Clickable button */}
        <Link href="/checkout" className="w-fit">
          <button className="bg-[#22C55E] hover:bg-[#A0BCE0] transition text-white font-semibold px-8 py-3 mt-6 rounded-md">
            Buy Now
          </button>
        </Link>
      </div>

      {/* Right: col-span-7 */}
      <div className="col-span-7 flex justify-center items-center group">
        <Link href="/product/speaker">
          <div className="relative w-[500px] h-[300px] transition-all duration-500 group-hover:brightness-110 group-hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer">
            <Image
              src="/jbl.webp"
              alt="Loa JBL"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Custom animation */}
      <style jsx global>{`
        @keyframes scaleUp {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-scaleUp {
          animation: scaleUp 0.5s ease-in-out;
        }
      `}</style>
    </section>
  );
}
