"use client";

import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

type ImageItem = {
  id: string;
  url: string;
};

export default function ProductImageDrop() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: generateId(),
        url: URL.createObjectURL(file),
      }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Click ngoài nút chuyển slide và nút xóa mới mở file dialog
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(".swiper-button-next") ||
      target.closest(".swiper-button-prev") ||
      target.closest("button")
    ) {
      // Không mở file khi click vào nút điều hướng hoặc nút xóa
      return;
    }
    inputRef.current?.click();
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => {
      const index = prev.findIndex((img) => img.id === idToRemove);
      if (index === -1) return prev;

      if (index === 0) {
        // Xóa ảnh chính, ảnh thứ 2 sẽ làm ảnh chính mới
        // Trả về mảng mới là phần tử từ index 1 trở đi
        return prev.slice(1);
      }

      // Xóa ảnh nhỏ bình thường
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  return (
    <>
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border border-dashed bg-white p-6 rounded shadow-sm border-gray-200 text-center hover:bg-gray-50 transition cursor-pointer max-w-full mx-auto"
      >
        <div className="w-full mx-auto">
        {images.length > 0 ? (
          <div className="space-y-4">
            {/* Ảnh chính */}
            <div className="relative">
              <img
                src={images[0].url}
                alt="Main"
                className="w-full max-h-[200px] object-contain rounded border"
              />
              <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                Main image
              </span>
              <button
              type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(images[0].id);
                }}
                className="absolute top-1 right-1 bg-white border border-gray-300 text-red-500 px-2 py-0.5 rounded text-xs hover:bg-red-100"
              >
                ✕
              </button>
            </div>

            {/* Ảnh nhỏ */}
            {images.length > 1 && (
              <div className="border rounded-lg p-4 bg-gray-50 relative">
                <Swiper
                  spaceBetween={10}
                  slidesPerView={6}
                  navigation
                  modules={[Navigation]}
                  className="!px-6"
                >
                  {images.slice(1).map((img) => (
                    <SwiperSlide key={img.id}>
                      <div className="flex flex-col items-center gap-1">
                        <img
                          src={img.url}
                          alt="Other"
                          className="w-full h-24 object-cover border rounded"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="text-red-500 text-xs border border-gray-300 rounded px-2 py-0.5 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                <style jsx>{`
                  .swiper-button-prev,
                  .swiper-button-next {
                    top: 50%;
                    transform: translateY(-50%);
                    width: 28px;
                    height: 28px;
                    background: white;
                    border-radius: 9999px;
                    border: 1px solid #ccc;
                    color: #000;
                    z-index: 10;
                  }

                  .swiper-button-prev {
                    left: 0px;
                  }

                  .swiper-button-next {
                    right: 0px;
                  }

                  .swiper-button-disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                  }
                `}</style>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[150px]">
            <svg
              className="w-8 h-8 text-blue-500 mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-600">
              Drop your images here, or{" "}
              <span className="text-blue-600 font-medium cursor-pointer">click to browse</span>
            </p>
            <p className="text-xs text-gray-400">
              1600x1200 (4:3) recommended. PNG, JPG, GIF.
            </p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
