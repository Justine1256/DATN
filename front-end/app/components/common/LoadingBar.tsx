'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function LoadingBar() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300); // tuỳ chỉnh thời gian loading

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
