"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

export default function ShopRegisterPage() {
    const [step, setStep] = useState<number>(0);
    const [form, setForm] = useState({
        name: "",
        description: "",
        phone: "",
        email: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [popup, setPopup] = useState<string>("");
    const [cooldown, setCooldown] = useState(60);
    const [loading, setLoading] = useState(false);

    const showPopup = (msg: string) => {
        setPopup(msg);
        setTimeout(() => setPopup(""), 3000);
    };

    const handleSendOtp = async () => {
        let errors: string[] = [];
        if (!form.name.trim()) errors.push("Tên shop không được để trống.");
        if (!form.description.trim()) errors.push("Mô tả shop không được để trống.");
        if (!/^(0\d{9})$/.test(form.phone)) errors.push("Số điện thoại không hợp lệ.");
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) errors.push("Email không hợp lệ.");
        if (!file) errors.push("Vui lòng chọn logo.");

        if (errors.length > 0) return showPopup(errors.join(" "));

        try {
            setLoading(true);
            const token = Cookies.get("authToken");
            const data = new FormData();
            data.append("name", form.name);
            data.append("description", form.description);
            data.append("phone", form.phone);
            data.append("email", form.email);
            data.append("image", file as Blob);

            const res = await fetch(`${API_BASE_URL}/shopregister`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: data,
            });

            const json = await res.json();
            if (!res.ok) throw json;
            showPopup("Đã gửi OTP tới email của bạn.");
            setStep(1);
            setCooldown(60);
            startCooldown();
        } catch (err: any) {
            showPopup(JSON.stringify(err.errors || err.error || err));
        } finally {
            setLoading(false);
        }
    };
    
    

    const handleConfirmOtp = async () => {
        try {
            const token = Cookies.get("authToken");
            const res = await fetch(`${API_BASE_URL}/shopotp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ otp }),
            });
            const json = await res.json();
            if (!res.ok) throw json;
            showPopup("Tạo shop thành công!");
            setTimeout(() => (window.location.href = `/shop/${json.shop.slug}`), 1000);
        } catch (err: any) {
            showPopup(JSON.stringify(err.errors || err.error || err));
        }
    };

    const startCooldown = () => {
        let cd = 60;
        const timer = setInterval(() => {
            cd -= 1;
            setCooldown(cd);
            if (cd <= 0) clearInterval(timer);
        }, 1000);
    };

    const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded shadow w-full max-w-xl">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Đăng ký Shop</h1>
                        <p className="text-gray-600">Hoàn thành 2 bước để đăng ký shop của bạn</p>
                    </div>
                    <ShopStepper currentStep={step} />

                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div
                                    className="w-32 h-32 rounded-full bg-gray-200 mx-auto flex items-center justify-center text-gray-400 border-4 border-dashed cursor-pointer"
                                    onClick={() => document.getElementById("fileInput")?.click()}
                                >
                                    {preview ? (
                                        <img src={preview} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                    ) : "Chọn logo"}
                                </div>
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleChooseFile}
                                    className="hidden"
                                />
                            </div>
                            <input type="text" placeholder="Tên shop"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 border rounded focus:outline-none"
                            />
                            <textarea placeholder="Mô tả shop"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-4 py-3 border rounded focus:outline-none"
                                rows={3}></textarea>
                            <input type="text" placeholder="Số điện thoại"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-4 py-3 border rounded focus:outline-none"
                            />
                            <input type="text" placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 border rounded focus:outline-none"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    className={`bg-[#db4444] text-white px-6 py-3 rounded hover:bg-[#c23333] font-semibold flex items-center justify-center min-w-[150px] ${loading ? "opacity-70 cursor-not-allowed" : ""
                                        }`}
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : null}
                                    {loading ? "Đang gửi..." : "Gửi OTP & Đăng ký"}
                                </button>
                            </div>

                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="relative w-full">
                                <input type="text" placeholder="Mã OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 pr-28 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444]"
                                />
                                <button
                                    onClick={() => {
                                        handleSendOtp();
                                        startCooldown();
                                    }}
                                    disabled={cooldown > 0}
                                    className={`absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold ${cooldown > 0
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-[#db4444] hover:underline"
                                        }`}>
                                    {cooldown > 0 ? `(${cooldown}s)` : "Gửi lại"}
                                </button>
                            </div>
                            <div className="flex justify-between pt-6">
                                <button
                                    onClick={() => setStep(0)}
                                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 font-semibold"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={handleConfirmOtp}
                                    className="bg-[#db4444] text-white px-6 py-3 rounded hover:bg-[#c23333] font-semibold"
                                >
                                    Xác nhận OTP
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {popup && (
                <div className="fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 border-[#db4444] animate-slideInFade">
                    {popup}
                </div>
            )}
            <style jsx global>{`
                @keyframes slideInFade {
                  0% { opacity: 0; transform: translateX(50%); }
                  50% { opacity: 1; transform: translateX(0); }
                  100% { opacity: 1; transform: translateX(0); }
                }
                .animate-slideInFade { animation: slideInFade 0.5s ease forwards; }
            `}</style>
        </>
    );
}

function ShopStepper({ currentStep }: { currentStep: number }) {
    const steps = ["Thông tin & Logo", "Nhập OTP"];
    return (
        <div className="relative w-full mb-10">
            <div className="absolute top-[20px] left-7 right-5 h-1 bg-gray-200 rounded-full"></div>
            <div
                className="absolute top-[20px] left-5 h-1 bg-[#db4444] rounded-full transition-all duration-500"
                style={{
                    width:
                        currentStep === steps.length - 1
                            ? "calc(100% - 2.5rem)"
                            : `calc(${(currentStep / (steps.length - 1)) * 100}% - 0.2rem)`,
                }}
            ></div>
            <div className="flex justify-between items-center relative z-10 w-full">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${index <= currentStep
                                ? "bg-[#db4444] border-[#db4444] text-white"
                                : "bg-white border-gray-300 text-gray-400"
                                }`}
                        >
                            {index + 1}
                        </div>
                        <span
                            className={`mt-2 text-xs font-medium text-center ${index <= currentStep ? "text-[#db4444]" : "text-gray-400"
                                }`}
                        >
                            {step}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
