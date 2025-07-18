"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import Image from "next/image";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

export type ImageItem = {
  id: string;
  url: string; // Example: "products/abc.jpg"
  isNew?: boolean;
};

interface ImageDropProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}

export default function ImageDrop({ images, setImages }: ImageDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const uploadToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/upload-product-image`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();

    if (!data.path) throw new Error("Invalid response from server");

    return data.path; // e.g., "products/abc.jpg"
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    for (const file of validFiles) {
      try {
        const uploadedPath = await uploadToServer(file);
        setImages((prev) => [
          ...prev,
          { id: generateId(), url: uploadedPath, isNew: true },
        ]);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Upload image failed.");
      }
    }
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

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(".swiper-button-next") ||
      target.closest(".swiper-button-prev") ||
      target.closest("button")
    ) {
      return;
    }
    inputRef.current?.click();
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  return (
    <div className="border border-dashed bg-white p-6 rounded shadow-sm border-gray-200 text-center hover:bg-gray-50 transition cursor-pointer max-w-full mx-auto"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />

      <div className="w-full mx-auto">
        {images.length > 0 ? (
          <div className="space-y-4">
            <div className="relative">
              <div className="relative w-full h-[200px]">
                <Image
                  src={`${STATIC_BASE_URL}/${images[0].url}`}
                  alt="Ảnh chính"
                  fill
                  className="object-contain rounded border"
                />
              </div>
              <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                Ảnh chính
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
                        <Image
                          src={`${STATIC_BASE_URL}/${img.url}`}
                          alt="Khác"
                          width={80}
                          height={80}
                          className="object-cover border rounded"
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
              Kéo thả hình ảnh vào đây, hoặc{" "}
              <span className="text-blue-600 font-medium cursor-pointer">
                nhấn để chọn
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Khuyến nghị 1600x1200 (4:3). Hỗ trợ PNG, JPG, GIF.
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
}
