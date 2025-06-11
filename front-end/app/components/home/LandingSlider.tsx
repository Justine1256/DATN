import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const slides = [
  {
    id: 1,
    image: "/Banner3.png",
    buttonText: "Mua Ngay",
    variant: "red",
  },
  {
    id: 2,
    image: "/Banner4.png",
    buttonText: "Mua Ngay",
    variant: "black",
  },
  {
    id: 3,
    image: "/Banner2.png",
    buttonText: "Mua Ngay",
    variant: "red",
  },
];

export default function LandingSlider() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const router = useRouter(); // ✅ dùng router để chuyển trang

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

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
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {index === current && (
            <div className="absolute left-10 bottom-12 z-20">
              <button
                onClick={() => router.push("/shop")} // ✅ click vào Shop now sẽ chuyển hướng
                className={`w-[143px] h-[43px] rounded-md text-white font-semibold transition ${
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
