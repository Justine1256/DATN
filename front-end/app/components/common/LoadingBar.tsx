'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import logoImage from '../../../public/logo.png'; // Đảm bảo đường dẫn chính xác

const LoadingSpinner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleStart = (url: string) => {
      console.log(`Đang tải: ${url}`);
      setIsLoading(true);
      setProgress(0);
    };

    const handleComplete = (url: string) => {
      console.log(`Hoàn tất tải: ${url}`);
      setIsLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 300); // Reset sau khi hoàn thành
    };

    const handleError = (url: string) => {
      console.error(`Lỗi tải trang: ${url}`);
      setIsLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 300); // Reset sau khi lỗi
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: '#29d',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.2s ease-out',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: progress === 100 ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              <Image src={logoImage} alt="Đang tải..." width={30} height={30} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingSpinner;