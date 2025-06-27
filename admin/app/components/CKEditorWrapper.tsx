// app/components/CKEditorWrapper.tsx
"use client";
import dynamic from "next/dynamic";

export const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
);

export const ClassicEditor = dynamic(
    () => import("@ckeditor/ckeditor5-build-classic"),
    { ssr: false }
);
