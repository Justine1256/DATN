"use client";
import { useEffect, useState } from "react";

const slides = [
  {
    id: 1,
    image: "/images/banner-1.jpg",
    title: "Summer Sale",
    subtitle: "Up to 50% off",
    button: "Shop Now",
  },
  {
    id: 2,
    image: "/images/banner-2.jpg",
    title: "New Arrivals",
    subtitle: "Latest Trends",
    button: "Discover",
  },
];

export default function LandingSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute w-full h-full transition-opacity duration-700 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full h-full bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold">{slide.title}</h2>
              <p className="text-xl mb-4">{slide.subtitle}</p>
              <button className="bg-blue-600 px-4 py-2 rounded">{slide.button}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
