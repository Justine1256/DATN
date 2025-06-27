"use client";
import dynamic from "next/dynamic";

// Dynamic import CKEditor (React component)
export const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
);

// Dynamic import cả ClassicEditor build để tránh lỗi window
export const ClassicEditor = dynamic(
    async () => {
        const mod = await import("@ckeditor/ckeditor5-build-classic");
        return mod.default;
    },
    { ssr: false }
);
