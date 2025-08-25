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
  link: string;
}

export default function LandingSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Drag desktop
  const isDragging = useRef(false);
  const startX = useRef(0);

  // Touch mobile
  const touchDragging = useRef(false);
  const touchStartX = useRef(0);

  const router = useRouter();

  // Fetch banner
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/banner`);
        const data: any[] = await res.json();

        const formatted: Slide[] = (Array.isArray(data) ? data : []).map((item: any) => {
          const variant: Slide["variant"] =
            Number(item?.id) % 2 === 0 ? "black" : "red";
          return {
            id: Number(item?.id),
            image: `${API_BASE_URL}/image/${item?.image}`,
            buttonText: "Mua Ngay",
            variant,
            link: item?.link || "/shop",
          };
        });

        setSlides(formatted);
      } catch (error) {
        console.error("Lỗi fetch banner:", error);
      }
    };

    fetchBanners();
  }, []);

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered && slides.length > 0) {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  const go = (next: number) => {
    if (slides.length === 0) return;
    const total = slides.length;
    setCurrent((next + total) % total);
  };

  const handleDotClick = (index: number) => setCurrent(index);

  // ===== Desktop drag =====
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || slides.length === 0) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) {
      go(current + (dx < 0 ? 1 : -1));
      isDragging.current = false;
    }
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // ===== Mobile touch swipe =====
  const handleTouchStart = (e: React.TouchEvent) => {
    touchDragging.current = true;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging.current || slides.length === 0) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      go(current + (dx < 0 ? 1 : -1));
      touchDragging.current = false;
    }
  };
  const handleTouchEnd = () => {
    touchDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Landing slider"
      aria-roledescription="carousel"
      aria-live="polite"
      // Giữ kích thước nền: max-w 1120px, cao responsive 180/220/280/344
      className="
        relative w-full max-w-[1120px] mx-auto overflow-hidden rounded-lg
        h-[180px] sm:h-[220px] md:h-[280px] lg:h-[344px]
        select-none
      "
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        isDragging.current = false;
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragStart={(e) => e.preventDefault()}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`
            absolute inset-0 transition-opacity duration-700 ease-in-out
            ${index === current ? "opacity-100 z-10" : "opacity-0 z-0"}
          `}
        >
          {/* Ảnh: object-cover + object-center để tự căn giữa, không méo/không lệch */}
          <Image
            src={slide.image}
            alt={`banner-${slide.id}`}
            className="object-cover object-center rounded-lg"
            fill
            priority={index === 0}
            draggable={false}
            sizes="(max-width: 768px) 100vw, 1120px"
          />

          {/* Nút CTA giữ vị trí tương tự, responsive nhẹ */}
          {index === current && (
            <div
              className="
                absolute z-20
                left-4 sm:left-8 md:left-10
                bottom-4 sm:bottom-8 md:bottom-12
              "
            >
              <button
                onClick={() => {
                  if (slide.link.startsWith("http")) {
                    window.open(slide.link, "_blank"); // link ngoài: mở tab mới
                  } else {
                    router.push(slide.link);           // link nội bộ
                  }
                }}
                className={`
    rounded-md text-white font-semibold transition
    w-28 h-10 sm:w-[143px] sm:h-[43px]
    ${slide.variant === "red"
                    ? "bg-brand hover:bg-red-600"
                    : "bg-black hover:bg-neutral-700"}
  `}
              >
                {slide.buttonText}
              </button>

            </div>
          )}
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            aria-label={`Chuyển đến slide ${index + 1}`}
            className={`
              rounded-full cursor-pointer transition-all duration-300
              ${index === current ? "bg-brand w-2.5 h-2.5 sm:w-3 sm:h-3" : "bg-gray-300 w-2 h-2 sm:w-2.5 sm:h-2.5"}
            `}
          />
        ))}
      </div>
    </div>
  );
}
