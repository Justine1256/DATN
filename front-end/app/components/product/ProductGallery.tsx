// components/ProductGallery.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { STATIC_BASE_URL } from '@/utils/api';

interface ProductGalleryProps {
    images: string[];
    mainImage: string;
    setMainImage: (image: string) => void;
}

const formatImageUrl = (img: string | string[]): string => {
    if (Array.isArray(img)) img = img[0];
    if (typeof img !== 'string' || !img.trim()) {
        return `${STATIC_BASE_URL}/products/default-product.png`;
    }
    if (img.startsWith('http')) return img;
    return img.startsWith('/') ? `${STATIC_BASE_URL}${img}` : `${STATIC_BASE_URL}/${img}`;
};

export default function ProductGallery({ images, mainImage, setMainImage }: ProductGalleryProps) {
    const thumbnailRef = useRef<HTMLDivElement>(null);
    const mainImageRef = useRef<HTMLDivElement>(null);
    const [fade, setFade] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [transitionClass, setTransitionClass] = useState('');
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const scrollToIndex = (index: number) => {
        if (index === currentIndex) return;
        const direction = index > currentIndex ? 'right' : 'left';
        setTransitionClass(direction === 'right' ? 'animate-slide-left' : 'animate-slide-right');
        setCurrentIndex(index);
        setMainImage(formatImageUrl(images[index]));
    };

    const handlePrevious = () => {
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        scrollToIndex(newIndex);
    };

    const handleNext = () => {
        const newIndex = (currentIndex + 1) % images.length;
        scrollToIndex(newIndex);
    };

    useEffect(() => {
        setFade(false);
        const timeout = setTimeout(() => {
            setFade(true);
            setTransitionClass('');
        }, 300);
        return () => clearTimeout(timeout);
    }, [mainImage]);

    const updateButtons = () => {
        const ref = thumbnailRef.current;
        if (!ref) return;
        setShowLeft(ref.scrollLeft > 0);
        setShowRight(ref.scrollLeft + ref.offsetWidth < ref.scrollWidth - 1);
    };

    const handleScrollLeft = () => {
        if (thumbnailRef.current) {
            thumbnailRef.current.scrollBy({ left: -120, behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        }
    };

    const handleScrollRight = () => {
        if (thumbnailRef.current) {
            thumbnailRef.current.scrollBy({ left: 120, behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        }
    };

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Handle mouse drag to scroll
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.clientX);
        setScrollLeft(thumbnailRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const x = e.clientX - startX;
        thumbnailRef.current!.scrollLeft = scrollLeft - x;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        updateButtons();
        const ref = thumbnailRef.current;
        if (ref) {
            ref.addEventListener('scroll', updateButtons);
            return () => ref.removeEventListener('scroll', updateButtons);
        }
    }, [images]);

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Main Image Container */}
            <div className="relative group">
                <div
                    className="w-full h-[424px] flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative border-2 border-gray-200 cursor-zoom-in hover:border-gray-300 transition-all duration-300 shadow-lg"
                    ref={mainImageRef}
                    onClick={() => setShowPreview(true)}
                >
                    <Image
                        src={mainImage || formatImageUrl('')}
                        alt="Ảnh sản phẩm chính"
                        fill
                        className={`object-contain transition-all duration-300 ${fade ? 'opacity-100' : 'opacity-0'} ${transitionClass} p-4 rounded-lg`}
                    />

                    {/* Zoom Icon */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ZoomIn size={16} />
                    </div>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-full font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            </div>


            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-300"
                    >
                        <X size={24} />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => scrollToIndex((currentIndex - 1 + images.length) % images.length)}
                                className="absolute left-6 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all duration-300"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button
                                onClick={() => scrollToIndex((currentIndex + 1) % images.length)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all duration-300"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}

                    <Image
                        src={mainImage}
                        alt="Xem trước ảnh"
                        width={500}
                        height={500}
                        className="max-w-[90%] max-h-[90%] object-contain rounded-2xl shadow-2xl"
                    />

                    <div className="absolute top-6 left-6 text-white text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}

            {/* Thumbnail Gallery */}
            <div className="relative">
                {/* Left Scroll Button */}
                {showLeft && (
                    <button
                        onClick={handleScrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 z-20 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-300 hover:scale-110"
                    >
                        <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                )}

                {/* Thumbnail Container */}
                <div
                    className="flex gap-4 overflow-x-auto no-scrollbar  px-8 sm:px-7"
                    ref={thumbnailRef}
                    onScroll={updateButtons}
                    style={{
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {images.map((img: string, idx: number) => {
                        const formattedImg = formatImageUrl(img);
                        const isSelected = formattedImg === mainImage;
                        return (
                            <div
                                key={idx}
                                onClick={() => scrollToIndex(idx)}
                                className={`flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-xl bg-white p-2 cursor-pointer transition-all duration-300 ${isSelected
                                    ? 'border-2 border-[#db4444] shadow-lg'
                                    : 'border-2 border-gray-200 hover:border-[#db4444] hover:shadow-md'
                                    }`}
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                <img
                                    src={formattedImg}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="max-w-full max-h-full object-contain rounded-lg pointer-events-none"
                                    onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                                    draggable={false}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Right Scroll Button */}
                {showRight && (
                    <button
                        onClick={handleScrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 z-20 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-300 hover:scale-110"
                    >
                        <ChevronRight size={20} className="text-gray-700" />
                    </button>
                )}
            </div>
        </div>
    );
}
