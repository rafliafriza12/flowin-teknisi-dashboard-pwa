"use client";
import BumiLogo from "@/components/atoms/BumiLogo";
import { LoginBg } from "@/components/atoms/LoginBg";
import LoginForm from "@/components/molecules/login/LoginForm";

const LoginOrganism: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-neutral-01 via-white to-neutral-01/80 relative overflow-hidden">
      {/* Background SVG - Full coverage with explicit z-index */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LoginBg className="opacity-20" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-moss-stone/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-charcoal-green/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Content - Centered */}
      <div className="relative z-10 min-h-screen px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-[400px]">
          {/* Card Container */}
          <div className="bg-white/5 backdrop-blur-[2px] shadow-xl shadow-charcoal-green/5 border border-moss-stone/40 p-8 sm:p-10 rounded-2xl">
            {/* Logo & Header */}
            <div className="flex flex-col items-center">
              <BumiLogo />
              <div className="mt-6 text-center">
                <h1 className="text-xl font-semibold text-charcoal-green">
                  Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-grey">
                  Sign in to access your dashboard
                </p>
              </div>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-grey">
            © {new Date().getFullYear()} Bumi Resources. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginOrganism;
