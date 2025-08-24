"use client";

import React from "react";
import dynamic from "next/dynamic";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CKEditor = dynamic(
    async () => {
        const mod = await import("@ckeditor/ckeditor5-react");
        return mod.CKEditor;
    },
    { ssr: false }
);

interface Props {
    value: string;
    onChange: (val: string) => void;
}

export default function CKEditorClient({ value, onChange }: Props) {
    return (
        <div className="border border-slate-300 rounded-md p-2 bg-white">
            <CKEditor
                editor={ClassicEditor}
                data={value}
                onChange={(_: any, editor: any) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />

        </div>
    );
}
