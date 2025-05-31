"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/dashboard");
    }, 1000); // Chuyển hướng sau 1 giây

    return () => clearTimeout(timeout); // Clear timeout nếu component bị unmount
  }, [router]);

  return null; // Không render gì ở đây để tối ưu hóa tốc độ
}
