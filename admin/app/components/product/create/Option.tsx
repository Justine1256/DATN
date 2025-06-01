"use client";

import React, { useState, useRef, useEffect } from "react";

interface Props {
  selectedOption1: string[];
  toggleOption1: (val: string) => void;
  selectedOption2: string[];
  toggleOption2: (val: string) => void;
  option1Label: string;
  setOption1Label: (val: string) => void;
  option2Label: string;
  setOption2Label: (val: string) => void;
}

export default function OptionsInput({
  selectedOption1,
  toggleOption1,
  selectedOption2,
  toggleOption2,
  option1Label,
  setOption1Label,
  option2Label,
  setOption2Label,
}: Props) {
  const [showInput1, setShowInput1] = useState(false);
  const [showInput2, setShowInput2] = useState(false);
  const [editingOption1, setEditingOption1] = useState(false);
  const [editingOption2, setEditingOption2] = useState(false);

  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");

  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const labelInputRef1 = useRef<HTMLInputElement>(null);
  const labelInputRef2 = useRef<HTMLInputElement>(null);

  const defaultOption1Label = "Option 1";
  const defaultOption2Label = "Option 2";

  useEffect(() => {
    if (editingOption1) labelInputRef1.current?.focus();
  }, [editingOption1]);

  useEffect(() => {
    if (editingOption2) labelInputRef2.current?.focus();
  }, [editingOption2]);

  useEffect(() => {
    if (showInput1) inputRef1.current?.focus();
  }, [showInput1]);

  useEffect(() => {
    if (showInput2) inputRef2.current?.focus();
  }, [showInput2]);

  const handleAdd = (value: string, option: number) => {
    const val = value.trim();
    if (val) {
      if (option === 1) {
        toggleOption1(val);
        setInputValue1("");
        setShowInput1(false);
      } else {
        toggleOption2(val);
        setInputValue2("");
        setShowInput2(false);
      }
    } else {
      if (option === 1) {
        setInputValue1("");
        setShowInput1(false);
      } else {
        setInputValue2("");
        setShowInput2(false);
      }
    }
  };

  const handleLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    option: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let val = (e.target as HTMLInputElement).value.trim();
      if (!val) {
        val = option === 1 ? defaultOption1Label : defaultOption2Label;
      }
      option === 1 ? setOption1Label(val) : setOption2Label(val);
      option === 1 ? setEditingOption1(false) : setEditingOption2(false);
    }

    if (e.key === "Escape") {
      option === 1 ? setEditingOption1(false) : setEditingOption2(false);
    }
  };

  const handleLabelBlur = (option: number) => {
    let val =
      option === 1
        ? labelInputRef1.current?.value.trim()
        : labelInputRef2.current?.value.trim();

    if (!val) {
      val = option === 1 ? defaultOption1Label : defaultOption2Label;
    }
    option === 1 ? setOption1Label(val) : setOption2Label(val);
    option === 1 ? setEditingOption1(false) : setEditingOption2(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow-sm min-h-[130px]">
        <div className="flex flex-wrap gap-6">
          {/* OPTION 1 */}
          <div className="relative max-w-[480px] w-full h-[220px] rounded overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-white z-10 p-2">
              {editingOption1 ? (
                <input
                  ref={labelInputRef1}
                  defaultValue={option1Label}
                  placeholder={defaultOption1Label}
                  onKeyDown={(e) => handleLabelKeyDown(e, 1)}
                  onBlur={() => handleLabelBlur(1)}
                  className="rounded px-2 py-1 w-[80px] text-black"
                />
              ) : (
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => setEditingOption1(true)}
                >
                  <span className="text-base font-medium text-black line-clamp-1">
                    {option1Label}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-4 h-4 shrink-0"
                    fill="none"
                  >
                    <circle cx="256" cy="256" r="256" fill="#2196f3" />
                    <path
                      d="M384.7 106.4c-4.7-4.4-12-4.3-16.5 0.3L208.1 274.3c-0.9 0.9-1.6 2-1.9 3.2l-14.9 51.6c-0.8 2.9 1.7 5.5 4.6 4.7l51.7-16.1c1.2-0.4 2.3-1 3.2-1.9l160.2-172.1c4.4-4.7 4.2-12.1-0.5-16.4l-26.8-24.9zM279.7 177.6H120c-8.8 0-16 7.2-16 16v200c0 8.8 7.2 16 16 16h208c8.8 0 16-7.2 16-16V239.6l-32 34.4V392H136V208h121.7l22-23.9z"
                      fill="#fff"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="absolute top-[48px] bottom-0 left-0 right-0 overflow-y-auto p-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedOption1.map((val) => (
                  <span
                    key={val}
                    className="px-3 py-1 rounded bg-gray-100 text-black flex items-center gap-1"
                  >
                    {val}
                    <span
                      onClick={() => toggleOption1(val)}
                      className="text-red-500 cursor-pointer"
                    >
                      ✕
                    </span>
                  </span>
                ))}
              </div>
              {showInput1 ? (
                <input
                  ref={inputRef1}
                  type="text"
                  placeholder="Add value"
                  value={inputValue1}
                  onChange={(e) => setInputValue1(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd(inputValue1, 1);
                    }
                  }}
                  onBlur={() => handleAdd(inputValue1, 1)}
                  className="w-full px-2 py-1 rounded text-black"
                />
              ) : (
                <button
                  onClick={() => setShowInput1(true)}
                  className="text-blue-600 hover:underline"
                >
                  + Add value
                </button>
              )}
            </div>
          </div>

          {/* OPTION 2 */}
          <div className="relative max-w-[480px] w-full h-[220px] rounded overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-white z-10 p-2">
              {editingOption2 ? (
                <input
                  ref={labelInputRef2}
                  defaultValue={option2Label}
                  placeholder={defaultOption2Label}
                  onKeyDown={(e) => handleLabelKeyDown(e, 2)}
                  onBlur={() => handleLabelBlur(2)}
                  className="rounded px-2 py-1 w-[80px] text-black"
                />
              ) : (
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => setEditingOption2(true)}
                >
                  <span className="text-base font-medium text-black line-clamp-1">
                    {option2Label}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-4 h-4 shrink-0"
                    fill="none"
                  >
                    <circle cx="256" cy="256" r="256" fill="#2196f3" />
                    <path
                      d="M384.7 106.4c-4.7-4.4-12-4.3-16.5 0.3L208.1 274.3c-0.9 0.9-1.6 2-1.9 3.2l-14.9 51.6c-0.8 2.9 1.7 5.5 4.6 4.7l51.7-16.1c1.2-0.4 2.3-1 3.2-1.9l160.2-172.1c4.4-4.7 4.2-12.1-0.5-16.4l-26.8-24.9zM279.7 177.6H120c-8.8 0-16 7.2-16 16v200c0 8.8 7.2 16 16 16h208c8.8 0 16-7.2 16-16V239.6l-32 34.4V392H136V208h121.7l22-23.9z"
                      fill="#fff"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="absolute top-[48px] bottom-0 left-0 right-0 overflow-y-auto p-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedOption2.map((val) => (
                  <span
                    key={val}
                    className="px-3 py-1 rounded bg-gray-100 text-black flex items-center gap-1"
                  >
                    {val}
                    <span
                      onClick={() => toggleOption2(val)}
                      className="text-red-500 cursor-pointer"
                    >
                      ✕
                    </span>
                  </span>
                ))}
              </div>
              {showInput2 ? (
                <input
                  ref={inputRef2}
                  type="text"
                  placeholder="Add value"
                  value={inputValue2}
                  onChange={(e) => setInputValue2(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd(inputValue2, 2);
                    }
                  }}
                  onBlur={() => handleAdd(inputValue2, 2)}
                  className="w-full px-2 py-1 rounded text-black"
                />
              ) : (
                <button
                  onClick={() => setShowInput2(true)}
                  className="text-blue-600 hover:underline"
                >
                  + Add value
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
