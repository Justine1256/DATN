"use client";
import dynamic from "next/dynamic";

// CKEditor component phải dynamic (vì sử dụng window)
export const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
);

// ClassicEditor là object class nên import trực tiếp!
import ClassicEditorBuild from "@ckeditor/ckeditor5-build-classic";
export const ClassicEditor = ClassicEditorBuild;
