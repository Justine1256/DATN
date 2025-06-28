"use client";
import dynamic from "next/dynamic";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
);

export { ClassicEditor };
