"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/utils/api";
import Cookies from "js-cookie";

// Types
type PopupType = "success" | "error";

interface FormData {
    name: string;
    description: string;
    phone: string;
    email: string;
}

export default function ShopRegisterPage() {
    // State management
    const [step, setStep] = useState<number>(0);
    const [form, setForm] = useState<FormData>({
        name: "",
        description: "",
        phone: "",
        email: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [popup, setPopup] = useState<string>("");
    const [popupType, setPopupType] = useState<PopupType>("error");
    const [cooldown, setCooldown] = useState(60);
    const [loading, setLoading] = useState(false);

    // Constants
    const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const PHONE_REGEX = /^(0\d{9})$/;
    const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

    // Utility functions
    const showPopup = (msg: string, type: PopupType = "error") => {
        setPopup(msg);
        setPopupType(type);
        setTimeout(() => setPopup(""), 3000);
    };

    const getErrorMessage = (err: any): string => {
        // Handle network errors for large file uploads
        if (err.message === "Failed to fetch") {
            return "Kích thước ảnh vượt quá giới hạn cho phép.<br/>Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB.";
        }

        // Handle 413 Request Entity Too Large
        if (err.status === 413) {
            return "Kích thước ảnh vượt quá giới hạn cho phép.<br/>Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB.";
        }

        // Handle validation errors
        if (err.errors) {
            const errorMessages = Object.values(err.errors).flat();
            return Array.isArray(errorMessages) ? errorMessages.join(", ") : String(errorMessages);
        }

        // Handle single error messages
        if (err.error) {
            return typeof err.error === "string" ? err.error : err.error.message || "Đã có lỗi xảy ra";
        }

        // Fallback to message or default
        return err.message || "Đã có lỗi xảy ra";
    };

    const validateForm = (): string[] => {
        const errors: string[] = [];
        
        if (!form.name.trim()) errors.push("Tên shop không được để trống.");
        if (!form.description.trim()) errors.push("Mô tả shop không được để trống.");
        if (!PHONE_REGEX.test(form.phone)) errors.push("Số điện thoại không hợp lệ.");
        if (!EMAIL_REGEX.test(form.email)) errors.push("Email không hợp lệ.");
        if (!file) errors.push("Vui lòng chọn logo.");

        return errors;
    };

    const startCooldown = () => {
        let cd = 60;
        const timer = setInterval(() => {
            cd -= 1;
            setCooldown(cd);
            if (cd <= 0) clearInterval(timer);
        }, 1000);
    };

    // Event handlers
    const handleSendOtp = async () => {
        const errors = validateForm();
        
        if (errors.length > 0) {
            return showPopup(errors.join(" "));
        }

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
            
            if (!res.ok) {
                const error = { ...json, status: res.status };
                throw error;
            }
            
            showPopup("Đã gửi OTP tới email của bạn.", "success");
            setStep(1);
            setCooldown(60);
            startCooldown();
        } catch (err: any) {
            showPopup(getErrorMessage(err));
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
            
            if (!res.ok) {
                const error = { ...json, status: res.status };
                throw error;
            }
            
            showPopup("Tạo shop thành công!", "success");
            setTimeout(() => (window.location.href = `/shop/${json.shop.slug}`), 1000);
        } catch (err: any) {
            showPopup(getErrorMessage(err));
        }
    };

    const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        
        if (!selectedFile) return;

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
            showPopup("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc GIF");
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };


    // Render methods
    const renderFileInput = () => (
        <div className="text-center">
            <div
                className="w-32 h-32 rounded-full bg-gray-200 mx-auto flex items-center justify-center text-gray-400 border-4 border-dashed cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => document.getElementById("fileInput")?.click()}
            >
                {preview ? (
                    <img 
                        src={preview} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover rounded-full" 
                    />
                ) : (
                    "Chọn logo"
                )}
            </div>
            <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleChooseFile}
                className="hidden"
            />
        </div>
    );

    const renderStepOne = () => (
        <div className="space-y-4">
            {renderFileInput()}
            
            <input 
                type="text" 
                placeholder="Tên shop"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent"
            />
            
            <textarea 
                placeholder="Mô tả shop"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent resize-none"
                rows={3}
            />
            
            <input 
                type="text" 
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent"
            />
            
            <input 
                type="email" 
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent"
            />
            
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className={`bg-[#db4444] text-white px-6 py-3 rounded hover:bg-[#c23333] font-semibold flex items-center justify-center min-w-[150px] transition-colors ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {loading && (
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
                            />
                        </svg>
                    )}
                    {loading ? "Đang gửi..." : "Đăng Ký"}
                </button>
            </div>
        </div>
    );

    const renderStepTwo = () => (
        <div className="space-y-6">
            <div className="relative w-full">
                <input 
                    type="text" 
                    placeholder="Mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 pr-28 border rounded focus:outline-none focus:ring-2 focus:ring-[#db4444] focus:border-transparent"
                />
                <button
                    onClick={() => {
                        handleSendOtp();
                        startCooldown();
                    }}
                    disabled={cooldown > 0}
                    className={`absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold transition-colors ${
                        cooldown > 0
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#db4444] hover:underline"
                    }`}
                >
                    {cooldown > 0 ? `(${cooldown}s)` : "Gửi lại"}
                </button>
            </div>
            
            <div className="flex justify-between pt-6">
                <button
                    onClick={() => setStep(0)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 font-semibold transition-colors"
                >
                    Quay lại
                </button>
                <button
                    onClick={handleConfirmOtp}
                    className="bg-[#db4444] text-white px-6 py-3 rounded hover:bg-[#c23333] font-semibold transition-colors"
                >
                    Xác nhận OTP
                </button>
            </div>
        </div>
    );

    const renderPopup = () => popup && (
        <div 
            className={`fixed top-20 right-5 z-[9999] bg-white text-black text-sm px-4 py-2 rounded shadow-lg border-b-4 animate-slideInFade transition-colors ${
                popupType === "success" ? "border-green-500" : "border-[#db4444]"
            }`}
        >
            <div dangerouslySetInnerHTML={{ __html: popup }} />
        </div>
    );

    return (
        <>
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">
                            Đăng ký Shop
                        </h1>
                        <p className="text-gray-600">
                            Hoàn thành 2 bước để đăng ký shop của bạn
                        </p>
                    </div>
                    
                    <ShopStepper currentStep={step} />
                    
                    {step === 0 ? renderStepOne() : renderStepTwo()}
                </div>
            </div>

            {renderPopup()}

            <style jsx global>{`
                @keyframes slideInFade {
                    0% { opacity: 0; transform: translateX(50%); }
                    50% { opacity: 1; transform: translateX(0); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-slideInFade { 
                    animation: slideInFade 0.5s ease forwards; 
                }
            `}</style>
        </>
    );
}

// ShopStepper Component
interface ShopStepperProps {
    currentStep: number;
}

function ShopStepper({ currentStep }: ShopStepperProps) {
    const steps = ["Thông tin & Logo", "Nhập OTP"];
    
    return (
        <div className="relative w-full mb-10">
            {/* Progress line background */}
            <div className="absolute top-[19px] left-7 right-5 h-1 bg-gray-200 rounded-full" />
            
            {/* Active progress line */}
            <div
                className="absolute top-[19px] left-7 h-1 bg-[#db4444] rounded-full transition-all duration-500"
                style={{
                    width:
                        currentStep === steps.length - 1
                            ? "calc(100% - 2.5rem)"
                            : `calc(${(currentStep / (steps.length - 1)) * 100}% - 0.2rem)`,
                }}
            />
            
            {/* Step indicators */}
            <div className="flex justify-between items-center relative z-10 w-full">
                {steps.map((step, index) => (
                    <div key={step} className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-colors ${
                                index <= currentStep
                                    ? "bg-[#db4444] border-[#db4444] text-white"
                                    : "bg-white border-gray-300 text-gray-400"
                            }`}
                        >
                            {index + 1}
                        </div>
                        <span
                            className={`mt-2 text-xs font-medium text-center transition-colors ${
                                index <= currentStep ? "text-[#db4444]" : "text-gray-400"
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
