"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Send, Bot } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

type ChatProduct = {
  id: number;
  name: string;
  price: string;
  similarity: number;
  slug: string;
  image: string[];
  shop: { id: number; name: string; slug: string; logo: string };
};

type ChatbotResponse = { message?: string; reply?: string; products?: ChatProduct[] };

type BotMsg = {
  id: string | number;
  role: "user" | "bot";
  text: string;
  created_at: string;
  products?: ChatProduct[];
};

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

/** Helper kiểm tra element có đang hiển thị không */
const isVisible = (el: Element) => {
  const s = window.getComputedStyle(el as HTMLElement);
  const r = (el as HTMLElement).getBoundingClientRect();
  return (
    s.visibility !== "hidden" &&
    s.display !== "none" &&
    r.width > 0 &&
    r.height > 0 &&
    r.bottom > 0 &&
    r.right > 0
  );
};

/** Phát hiện có UI “đáy” (footer chat/toolbar) để né FAB khỏi giữa */
function detectBottomUI(): boolean {
  // 1) Selector thường gặp (tuỳ hệ thống của bạn có thể thêm vào)
  const prefer = document.querySelector(
    ".chat-footer, .message-input, .bottom-sticky, .shop-chat-footer, [data-bottom-ui]"
  );
  if (prefer && isVisible(prefer)) return true;

  // 2) Heuristic: phần tử fixed bám đáy, cao > 44px
  const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
  for (const el of all) {
    const st = window.getComputedStyle(el);
    if (st.position === "fixed") {
      const rect = el.getBoundingClientRect();
      const bottomGap = Math.abs(window.innerHeight - rect.bottom);
      if (
        bottomGap <= 20 && // bám đáy
        rect.height > 44 &&
        rect.width > 160 &&
        isVisible(el)
      ) {
        return true;
      }
    }
  }
  return false;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<BotMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Vị trí FAB trên mobile: 'center' | 'right'
  const [fabPos, setFabPos] = useState<"center" | "right">("center");

  const storageKey = "chatbot_messages_v1";
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = (smooth = false) =>
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });

  // Load/persist messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMsgs(JSON.parse(saved));
      else
        setMsgs([
          {
            id: "hello",
            role: "bot",
            text: "Xin chào! Tôi là trợ lý mua sắm. Bạn muốn tìm sản phẩm gì hôm nay?",
            created_at: new Date().toISOString(),
          },
        ]);
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(msgs.slice(-200)));
    } catch { }
    scrollToEnd(true);
  }, [msgs]);

  // Khóa cuộn nền khi mở chat trên mobile
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (open && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Quan sát DOM: nếu xuất hiện/biến mất UI đáy thì đổi vị trí FAB
  useEffect(() => {
    const updateFab = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      if (!mobile) return; // desktop giữ cố định góc phải
      setFabPos(detectBottomUI() ? "right" : "center");
    };

    // set lần đầu
    updateFab();

    // Theo dõi thay đổi DOM
    const mo = new MutationObserver(() => {
      // debounce nhẹ
      window.requestAnimationFrame(updateFab);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Theo dõi resize/orientation change
    const onResize = () => updateFab();
    window.addEventListener("resize", onResize);

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const send = async () => {
    const content = input.trim();
    if (!content) return;

    setMsgs((p) => [
      ...p,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: content,
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");
    setTyping(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chatbot`, { message: content });
      const data = (res.data || {}) as ChatbotResponse;

      setMsgs((p) => [
        ...p,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: data.reply || data.message || "Xin lỗi, tôi chưa hiểu. Bạn mô tả rõ hơn nhé!",
          created_at: new Date().toISOString(),
          products: data.products || [],
        },
      ]);
    } catch {
      setMsgs((p) => [
        ...p,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const getShopLogoUrl = (logo?: string | null) => {
    const fallback = `${STATIC_BASE_URL}/shops/default-shop.jpg`;
    if (!logo) return fallback;
    let raw = String(logo).trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed[0]) raw = String(parsed[0]).trim();
    } catch { }
    if (/^(https?:|data:)/.test(raw)) return raw;
    if (raw.startsWith("/")) return `${STATIC_BASE_URL}${raw}`;
    return `${STATIC_BASE_URL}/${raw}`;
  };

  return (
    <>
      {/* FAB – luôn hiển thị khi đóng (open=false). 
          Mobile: tự chuyển giữa/góc phải; Desktop: góc phải.
      */}
      {!open && (
        <div
          className={[
            "fixed z-[10000] pointer-events-auto",
            fabPos === "center"
              ? "left-80 "
              : "right-4",
            // ⬇️ nâng nút lên: 6rem (~96px) + safe-area
            "bottom-[calc(6rem+env(safe-area-inset-bottom))]",
            // Desktop giữ như cũ
            "md:left-auto md:translate-x-0 md:right-5 md:bottom-24",
          ].join(" ")}
        >


          <button
            onClick={() => setOpen(true)}
            aria-label="Open chatbot"
            className="
              flex h-14 w-14 items-center justify-center rounded-full
              bg-gradient-to-br from-indigo-500 to-purple-600 text-white
              shadow-xl ring-2 ring-white/50 transition hover:scale-105
            "
          >
            <Bot size={22} />
          </button>
        </div>
      )}

      {/* PANEL */}
      {open && (
        <div
          className="
            fixed z-[9999] inset-x-0 bottom-0 md:inset-auto
            w-full md:w-[420px] md:max-w-[95vw]
            bg-white/95 backdrop-blur
            h-[min(82dvh,680px)] md:h-[70vh]
            rounded-t-2xl md:rounded-2xl
            border-t border-gray-200 md:border md:border-gray-200
            md:right-5 md:bottom-5
            shadow-[0_10px_35px_-10px_rgba(79,70,229,0.4)]
            overflow-hidden
          "
        >
          <div className="flex h-full flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Bot size={20} />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">AI Assistant</p>
                    <p className="text-[11px] opacity-90">
                      {typing ? "Đang nhập…" : "Sẵn sàng hỗ trợ"}
                    </p>
                  </div>
                </div>

                {/* <div className="leading-tight">
                  <p className="text-sm font-semibold">AI Assistant</p>
                  <p className="text-[11px] opacity-90">{typing ? "Đang nhập…" : "Sẵn sàng hỗ trợ"}</p>
                </div> */}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Đóng hộp thoại"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl border p-3",
                      m.role === "user" ? "rounded-br-md border-rose-200 bg-rose-50" : "rounded-bl-md border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-line text-sm">{m.text}</div>

                    {!!m.products?.length && (
                      <div className="mt-3 space-y-2">
                        <div className="mb-1 text-[12px] font-medium text-gray-600">Sản phẩm gợi ý</div>
                        {m.products.map((p) => {
                          const shopSlug = encodeURIComponent(p.shop.slug);
                          const productSlug = encodeURIComponent(p.slug);
                          const productUrl = `/shop/${shopSlug}/product/${productSlug}`;
                          const shopUrl = `/shop/${shopSlug}`;
                          const priceNum = Number(p.price);
                          const priceLabel = Number.isFinite(priceNum) ? VND.format(priceNum) : p.price;

                          return (
                            <a
                              key={p.id}
                              href={productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-indigo-300 hover:shadow"
                            >
                              <div className="flex gap-3">
                                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                  {p.image?.length ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={`${STATIC_BASE_URL}/${p.image[0]}`}
                                      alt={p.name}
                                      className="h-full w-full object-cover"
                                      onError={(e) => ((e.target as HTMLImageElement).src = "/modern-tech-product.png")}
                                    />
                                  ) : (
                                    <div className="grid h-full w-full place-items-center text-gray-400">—</div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:text-[#db4444]">
                                    {p.name}
                                  </div>

                                  <div className="mt-1 flex items-center gap-2 overflow-hidden">
                                    <a
                                      href={shopUrl}
                                      onClick={(e) => e.stopPropagation()}
                                      className="min-w-0 flex items-center gap-2"
                                      title={p.shop.name}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={getShopLogoUrl(p.shop.logo)}
                                        alt={p.shop.name}
                                        className="h-5 w-5 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                                      />
                                      <span className="truncate text-[12px] text-gray-600 hover:text-[#db4444]">{p.shop.name}</span>
                                    </a>
                                  </div>

                                  <div className="mt-1 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-indigo-600 group-hover:text-[#db4444]">{priceLabel}</span>
                                    {typeof p.similarity === "number" && (
                                      <span className="whitespace-nowrap rounded bg-purple-100 px-2 py-0.5 text-[11px] text-purple-600">
                                        {Math.round(p.similarity * 100)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* INPUT */}
            <div className="border-t bg-white p-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi chatbot…"
                    className="w-full resize-none rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className={`grid h-10 w-10 place-items-center rounded-full transition ${!input.trim() ? "cursor-not-allowed bg-gray-300 text-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
