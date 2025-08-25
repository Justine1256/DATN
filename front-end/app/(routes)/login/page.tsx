import LoginForm from "@/app/components/login/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Image Section */}
      <div className="hidden md:block md:w-1/2 h-64 md:h-screen relative">
      <Image
        src="/signupimg.jpg"
        alt="Signup Image"
        fill
        className="object-cover"
        priority // optional: preload ảnh
      />
    </div>

      {/* Right Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white md:px-4">
        <div className="w-full max-w-full md:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
