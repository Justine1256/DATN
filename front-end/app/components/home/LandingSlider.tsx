"use client";
import { useEffect, useState } from "react";

// Slide data
const slides = [
  {
    id: 1,
    image: "/Banner3.png",
    buttonText: "Shop now",
    variant: "red", // red background
  },
  {
    id: 2,
    image: "/Banner4.png",
    buttonText: "Shop now",
    variant: "black", // black background
  },
  {
    id: 3,
    image: "/Banner2.png",
    buttonText: "Shop now",
    variant: "red",
  },
];

export default function LandingSlider() {
  const [current, setCurrent] = useState(0);

  // Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval); // Clear interval khi component unmount
  }, []);

  // Xử lý khi click dot nhỏ
  const handleDotClick = (index: number) => {
    setCurrent(index);
  };

  return (
    <div className="relative max-w-[1170px] h-[344px] mx-auto overflow-hidden rounded-lg">
      {/* Vòng lặp qua từng slide */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Nút Shop now chỉ hiển thị ở slide hiện tại */}
          {index === current && (
            <div className="absolute left-17 bottom-12 z-20">
              <button
                className={`w-[143px] h-[43px] !rounded-md text-white font-semibold transition ${
                  slide.variant === "red"
                    ? "bg-[#DB4444] hover:bg-red-600"
                    : "bg-black hover:bg-neutral-700"
                }`}
              >
                {slide.buttonText}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Dots điều khiển slide */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-30">
        {slides.map((_, index) => (
          <div
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
              index === current ? "bg-[#DB4444]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
