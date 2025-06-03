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
    <div className="flex items-center justify-between max-w-screen-xl mx-auto px-4 py-6">
      {/* LEFT side */}
      <div className="flex items-center gap-10">
        {/* Left title */}
        <div className="flex flex-col justify-center">
          {/* Gạch đỏ + Today */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[10px] h-[22px] bg-red-500 rounded-md" />
            <p className="text-red-500 font-semibold text-sm mt-[1px]">Today’s</p>
          </div>
          <h2 className="text-3xl font-bold text-black">Flash Sales</h2>
        </div>

        {/* TIME BLOCK */}
        <div className="relative flex items-end gap-6 text-black">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center w-14 relative">
              <span className="text-xs text-gray-500 mb-1">{item.label}</span>
              <span className="text-2xl font-bold text-center">{String(item.value).padStart(2, "0")}</span>
              {/* Dấu :  */}
              {idx < 3 && (
                <div className="absolute top-[40%] -right-[14px] text-red-400 font-semibold text-xl">
                  :
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT side: Arrows */}
      <div className="flex gap-3 items-center">
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 text-xl text-black">
          <FiChevronLeft />
        </button>
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 text-xl text-black">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
