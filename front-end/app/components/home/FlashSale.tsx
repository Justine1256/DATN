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
    <div className="flex items-center justify-between max-w-screen-xl mx-auto px-4 pb-6">
      {/* LEFT: Title + Timer */}
      <div className="flex items-center gap-10">
        {/* Today's + Flash Sales */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <div className="w-[12px] h-6 bg-red-500 rounded-md" />
            <p className="text-red-500 font-semibold text-sm">Today’s</p>
          </div>
          <h2 className="text-3xl font-bold text-black mt-1">Flash Sales</h2>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-4 text-black">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1 text-center w-14">{item.label}</span>
              <div className="text-2xl font-bold w-14 text-center">
                {String(item.value).padStart(2, "0")}
              </div>
            </div>
          ))}

          {/* Custom colons between groups */}
          <div className="absolute ml-[77px] mt-[26px] text-red-400 font-semibold text-xl">:</div>
          <div className="absolute ml-[164px] mt-[26px] text-red-400 font-semibold text-xl">:</div>
          <div className="absolute ml-[251px] mt-[26px] text-red-400 font-semibold text-xl">:</div>
        </div>
      </div>

      {/* RIGHT: Arrows */}
      <div className="flex gap-3 items-center">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 text-2xl text-black">
          <FiChevronLeft />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 text-2xl text-black">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
