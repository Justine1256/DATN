import SignupForm from "@/app/components/signup/SignupForm";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white pt-16 pb-16">
      {/* Left Image Section */}
      <div className="hidden md:block md:w-1/2 h-64 md:h-screen relative">
      <Image
        src="/signupimg.png"
        alt="Signup Image"
        fill
        className="object-cover"
        priority // optional: preload ảnh
      />
    </div>

      {/* Right Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-full p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
