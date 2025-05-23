import SignupForm from "@/app/components/signup/SignupForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-white pt-16">
      {/* Left Image Section - chiếm nửa trái và chạm sát lề */}
      <div className="w-1/2 h-screen ">
        <img
          src="/signupimg.png"
          alt="Signup Image"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Form Section - chiếm nửa phải, căn giữa form */}
      <div className="w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

