"use client";
import Link from "next/link";
import { useState } from "react";
import { BodySmallMedium } from "@/components/atoms/Typography";
import EmailInput from "@/components/atoms/inputs/EmailInput";
import EyeIcon from "@/components/atoms/icons/EyeIcon";
import EyeOffIcon from "@/components/atoms/icons/EyeOffIcon";
import { useLogin } from "@/services";
import { showToast, showErrorToast } from "@/libs/toast";
import { useRouter } from "next/navigation";
import { cn } from "@/libs/utils";

// Loading Spinner Component
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const login = useLogin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      const result = await login.mutateAsync({ input: { email, password } });
      showToast.success(`Welcome back, ${result.login.user.fullname}!`);
      router.push("/");
    } catch (error) {
      showErrorToast(error);
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  return (
    <div className="mt-8 sm:mx-auto w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block">
            <BodySmallMedium className="text-neutral-03">Email address</BodySmallMedium>
          </label>
          <EmailInput
            id="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11 px-4 bg-white border-grey-stroke focus:border-moss-stone focus:ring-2 focus:ring-moss-stone/20 transition-all duration-200"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block">
              <BodySmallMedium className="text-neutral-03">Password</BodySmallMedium>
            </label>
            <Link 
              href="/login/forgot-password" 
              className="text-sm text-moss-stone hover:text-moss-stone/80 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your password..."
              className={cn(
                "block w-full h-11 rounded-lg border text-sm bg-white px-4 pr-11",
                "border-grey-stroke shadow-sm",
                "placeholder:text-gray-400",
                "focus:outline-none focus:border-moss-stone focus:ring-2 focus:ring-moss-stone/20",
                "transition-all duration-200",
                "disabled:bg-grey-lightest disabled:cursor-not-allowed"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-grey hover:text-neutral-03 transition-colors rounded-md hover:bg-grey-lightest"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={cn(
              "w-full h-11 flex items-center justify-center gap-2 rounded-lg",
              "text-sm font-semibold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss-stone",
              isFormValid && !isLoading
                ? "bg-charcoal-green text-white hover:bg-charcoal-green/90 active:scale-[0.98]"
                : "bg-grey-stroke text-grey cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
