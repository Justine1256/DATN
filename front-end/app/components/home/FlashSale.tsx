"use client";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const endTime = new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000 + 19 * 60 * 1000 + 56 * 1000;

export default function FlashSaleHeader() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-start justify-between max-w-screen-xl mx-auto px-4 py-6">
      {/* LEFT side */}
      <div className="flex items-start gap-10">
        {/* Left title */}
        <div className="flex flex-col justify-center">
          {/* Gạch đỏ + Today */}
          <div className="flex items-center gap-2 -translate-y-[-6px]">
            <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm translate-y-[-3px]" />
            <p className="text-red-500 font-semibold text-sm leading-none translate-y-[5px]">Today’s</p>
          </div>

          {/* Flash Sale + Time block */}
          <div className="flex items-end gap-10 mt-2">
            {/* Flash Sale */}
            <h2 className="text-3xl font-bold text-black">Flash Sales</h2>

            {/* TIME BLOCK */}
            <div className="relative flex items-end gap-6 text-black translate-y-[-10px]">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center w-14 relative">
                  <span className="text-xs font-semibold text-gray-600 mb-1">{item.label}</span>
                  <span className="text-2xl font-bold text-center">{String(item.value).padStart(2, "0")}</span>
                  {idx < 3 && (
                    <div className="absolute top-[40%] -right-[14px] text-red-400 font-semibold text-xl">
                      :
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT side: Arrows */}
      <div className="flex gap-3 translate-y-[30px]">
  <button className="w-11 h-11 !rounded-full bg-[#E3E3E3] text-black text-xl flex items-center justify-center hover:bg-gray-400 transition">
    <FiChevronLeft />
  </button>
  <button className="w-11 h-11 !rounded-full bg-[#E3E3E3] text-black text-xl flex items-center justify-center hover:bg-gray-400 transition">
    <FiChevronRight />
  </button>
</div>



    </div>
  );
}
