"use client";

import dynamic from "next/dynamic";
import React, { useRef } from "react";
import "jodit/es2021/jodit.min.css";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Props = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
};

export const RichTextEditor = ({ value, onChange, height }: Props) => {
  const editor = useRef(null);

  const config = {
    readonly: false,
    height: height || 150,
    uploader: {
      insertImageAsBase64URI: true,
    },
    toolbarSticky: false,
    controls: {
      clearBackColor: {
        name: "clearBackColor",
        icon: "cancel",
        tooltip: "Xoá màu nền chữ",
        exec: (editor: any) => {
          editor.execCommand("hiliteColor", false, "transparent");
        },
      },
    },
    buttons: [
      "source", "bold", "italic", "underline", "strikethrough",
      "ul", "ol", "outdent", "indent", "font", "fontsize",
      "brush", "clearBackColor",
      "paragraph", "image", "video", "table", "link", "align",
      "undo", "redo", "hr", "eraser", "removeFormat", "fullsize"
    ],
  };

  return (
    <div className="p-2 rounded border border-gray-300 bg-white">
      <JoditEditor
        ref={editor}
        value={value}              // luôn nhận dữ liệu từ props (controlled)
        config={config}
        onBlur={(newContent) => onChange(newContent)} // chỉ update khi blur
      />
    </div>
  );
};
