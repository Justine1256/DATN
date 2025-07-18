"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import Image from "next/image";

interface Slide {
  id: number;
  image: string;
  buttonText: string;
  variant: "red" | "black";
}

export default function LandingSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/banner`);
        const data = await res.json();
        console.log("Fetched banners:", data);
        const formatted = data.map((item: any) => ({
          id: item.id,
          image: `${API_BASE_URL}/image/${item.image}`, // remove quotes
          buttonText: "Mua Ngay",
          variant: item.id % 2 === 0 ? "black" : "red",
        }));

        setSlides(formatted);
      } catch (error) {
        console.error("Lỗi fetch banner:", error);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered && slides.length > 0) {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  const handleDotClick = (index: number) => {
    setCurrent(index);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) {
      setCurrent((prev) =>
        dx < 0 ? (prev + 1) % slides.length : (prev - 1 + slides.length) % slides.length
      );
      isDragging.current = false;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative max-w-[1120px] h-[344px] mx-auto overflow-hidden rounded-lg cursor-grab"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        isDragging.current = false;
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
        >
          <Image
            src={slide.image}
            alt={`banner-${slide.id}`}
            className="object-cover rounded-lg"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1120px"
          />
          {index === current && (
            <div className="absolute left-10 bottom-12 z-20">
              <button
                onClick={() => router.push("/shop")}
                className={`w-[143px] h-[43px] rounded-md text-white font-semibold transition ${slide.variant === "red"
                  ? "bg-brand hover:bg-red-600"
                  : "bg-black hover:bg-neutral-700"
                  }`}
              >
                {slide.buttonText}
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-30">
        {slides.map((_, index) => (
          <div
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 mb-2 rounded-full cursor-pointer transition-all duration-300 ${index === current ? "bg-brand" : "bg-gray-300"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
