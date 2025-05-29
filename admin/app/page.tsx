"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard"); // Chuyển hướng sang dashboard
  }, [router]);

  return null; // Không render gì tại trang gốc
}
