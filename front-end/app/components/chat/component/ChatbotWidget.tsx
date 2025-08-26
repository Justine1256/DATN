"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
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

type ChatbotResponse = { message: string; reply: string; products?: ChatProduct[] };

type BotMsg = {
  id: string | number;
  role: "user" | "bot";
  text: string;
  created_at: string;
  products?: ChatProduct[];
};

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<BotMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const storageKey = "chatbot_messages_v1";
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = (smooth = false) =>
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });

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
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(msgs.slice(-200)));
    } catch {}
    scrollToEnd(true);
  }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;

    const userMsg: BotMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMsgs((p) => [...p, userMsg]);

    const content = input.trim();
    setInput("");
    setTyping(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chatbot`, { message: content });
      const data = (res.data || {}) as ChatbotResponse;

      const botMsg: BotMsg = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: data.reply || data.message || "Xin lỗi, tôi chưa hiểu. Bạn mô tả rõ hơn nhé!",
        created_at: new Date().toISOString(),
        products: data.products || [],
      };
      setMsgs((p) => [...p, botMsg]);
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
    } catch {}
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return `${STATIC_BASE_URL}${raw}`;
    return `${STATIC_BASE_URL}/${raw}`;
  };

  return (
    <>
      {/* Nút mở bot */}
      <div className="fixed right-5 bottom-24 z-[9999]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl ring-2 ring-white/50 hover:scale-105 transition"
          aria-label="Open chatbot"
        >
          <Bot size={22} />
        </button>
      </div>

      {open && (
        <div className="fixed z-[9998] inset-x-2 bottom-2 md:inset-auto md:bottom-5 md:right-5 w-auto md:w-[420px] max-w-[95vw] h-[70vh] bg-white/95 backdrop-blur rounded-2xl border border-gray-200/70 shadow-[0_10px_35px_-10px_rgba(79,70,229,0.4)] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
                  <Bot size={18} />
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-sm">AI Assistant</p>
                  <p className="text-[11px] opacity-90">{typing ? "Đang nhập…" : "Sẵn sàng hỗ trợ"}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full hover:bg-white/10 grid place-items-center">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] p-3 rounded-2xl border",
                      m.role === "user" ? "bg-rose-50 border-rose-200 rounded-br-md" : "bg-white border-gray-200 rounded-bl-md",
                    ].join(" ")}
                  >
                    <div className="text-sm whitespace-pre-line">{m.text}</div>

                    {!!m.products?.length && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[12px] font-medium text-gray-600 mb-1">Sản phẩm gợi ý</div>
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
                              className="block bg-white rounded-xl p-3 border border-gray-200 hover:border-indigo-300 hover:shadow transition-colors"
                            >
                              <div className="flex gap-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {p.image?.length ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={`${STATIC_BASE_URL}/${p.image[0]}`}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => ((e.target as HTMLImageElement).src = "/modern-tech-product.png")}
                                    />
                                  ) : (
                                    <div className="w-full h-full grid place-items-center text-gray-400">—</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 line-clamp-2">{p.name}</div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <a href={shopUrl} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2" title={p.shop.name}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={getShopLogoUrl(p.shop.logo)}
                                        alt={p.shop.name}
                                        className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-200"
                                      />
                                      <span className="text-[12px] text-gray-600 hover:text-gray-800 truncate">{p.shop.name}</span>
                                    </a>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-indigo-600 font-semibold text-sm">{priceLabel}</span>
                                    {typeof p.similarity === "number" && (
                                      <span className="text-[11px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
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
                  <div className="p-3 rounded-2xl bg-white border border-gray-200">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi chatbot…"
                    rows={1}
                    className="w-full px-4 py-3 text-sm rounded-2xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
                  className={`w-10 h-10 rounded-full grid place-items-center transition ${
                    !input.trim() ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
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
