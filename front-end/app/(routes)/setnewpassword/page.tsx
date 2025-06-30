import ResetPasswordForm from "@/app/components/setnewpassword/ResetPasswordForm";
import Image from "next/image";

export default function SetNewPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white pt-16 pb-16">
      {/* Left Image Section */}
      <div className="hidden md:block md:w-1/2 h-64 md:h-screen relative">
        <Image
          src="/signupimg.png"
          alt="Set Password Image"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-full p-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
