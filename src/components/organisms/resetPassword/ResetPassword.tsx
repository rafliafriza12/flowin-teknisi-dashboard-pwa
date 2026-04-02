"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BumiLogo from "@/components/atoms/BumiLogo";
import { LoginBg } from "@/components/atoms/LoginBg";
import { BodySmallMedium } from "@/components/atoms/Typography";
import EyeIcon from "@/components/atoms/icons/EyeIcon";
import EyeOffIcon from "@/components/atoms/icons/EyeOffIcon";
import ChevronLeftIcon from "@/components/atoms/icons/ChevronLeftIcon";
import { useResetPassword } from "@/services";
import { showToast, showErrorToast } from "@/libs/toast";
import { cn } from "@/libs/utils";

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

const SuccessCheckIcon = () => (
  <svg
    className="w-16 h-16 text-moss-stone"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
      fill="currentColor"
    />
  </svg>
);

// Password validation rules
const passwordRules = [
  {
    label: "At least 8 characters",
    test: (pw: string) => pw.length >= 8,
  },
  {
    label: "At least 1 uppercase letter",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "At least 1 special character",
    test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  },
];

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const resetPassword = useResetPassword();

  const allRulesPassed = passwordRules.every((rule) =>
    rule.test(newPassword)
  );
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword !== "";
  const isFormValid = allRulesPassed && passwordsMatch && !!token;

  // Redirect to login after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setIsLoading(true);
    try {
      const result = await resetPassword.mutateAsync({
        input: { token, newPassword },
      });
      showToast.success(result.resetPassword.message);
      setIsSuccess(true);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL — invalid access
  if (!token) {
    return (
      <div className="min-h-screen w-screen bg-linear-to-br from-neutral-01 via-white to-neutral-01/80 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <LoginBg className="opacity-20" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-moss-stone/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-charcoal-green/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 min-h-screen px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-[400px]">
            <div className="bg-white/5 backdrop-blur-[2px] shadow-xl shadow-charcoal-green/5 border border-moss-stone/40 p-8 sm:p-10 rounded-2xl">
              <div className="flex flex-col items-center">
                <BumiLogo />
                <div className="mt-6 text-center">
                  <h1 className="text-xl font-semibold text-charcoal-green">
                    Invalid reset link
                  </h1>
                  <p className="mt-1.5 text-sm text-grey">
                    This password reset link is invalid or has been used. Please
                    request a new one.
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  href="/login/forgot-password"
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 rounded-lg",
                    "text-sm font-semibold transition-all duration-200",
                    "bg-charcoal-green text-white hover:bg-charcoal-green/90 active:scale-[0.98]",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss-stone"
                  )}
                >
                  Request new reset link
                </Link>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-moss-stone hover:text-moss-stone/80 transition-colors font-medium"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-grey">
              © {new Date().getFullYear()} Bumi Resources. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-neutral-01 via-white to-neutral-01/80 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LoginBg className="opacity-20" />
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-moss-stone/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-charcoal-green/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 min-h-screen px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-[400px]">
          <div className="bg-white/5 backdrop-blur-[2px] shadow-xl shadow-charcoal-green/5 border border-moss-stone/40 p-8 sm:p-10 rounded-2xl">
            <div className="flex flex-col items-center">
              <BumiLogo />

              {!isSuccess ? (
                <div className="mt-6 text-center">
                  <h1 className="text-xl font-semibold text-charcoal-green">
                    Set new password
                  </h1>
                  <p className="mt-1.5 text-sm text-grey">
                    Create a strong password for your account.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center text-center">
                  <SuccessCheckIcon />
                  <h1 className="mt-4 text-xl font-semibold text-charcoal-green">
                    Password reset successful
                  </h1>
                  <p className="mt-1.5 text-sm text-grey">
                    Your password has been updated. You&apos;ll be redirected to
                    the sign in page shortly.
                  </p>
                </div>
              )}
            </div>

            {!isSuccess ? (
              <div className="mt-8 w-full">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="block">
                      <BodySmallMedium className="text-neutral-03">
                        New password
                      </BodySmallMedium>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        required
                        autoComplete="new-password"
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onFocus={() => setIsFocusedPassword(true)}
                        onBlur={() => setIsFocusedPassword(false)}
                        disabled={isLoading}
                        placeholder="Enter new password..."
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-grey hover:text-neutral-03 transition-colors rounded-md hover:bg-grey-lightest"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password strength indicators */}
                    {(isFocusedPassword || newPassword.length > 0) && (
                      <div className="mt-2 space-y-1">
                        {passwordRules.map((rule, index) => {
                          const passed = rule.test(newPassword);
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={cn(
                                  "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors",
                                  passed
                                    ? "bg-moss-stone"
                                    : "bg-grey-stroke"
                                )}
                              >
                                {passed && (
                                  <svg
                                    className="w-2 h-2 text-white"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                  >
                                    <path
                                      d="M10 3L4.5 8.5L2 6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-xs transition-colors",
                                  passed
                                    ? "text-moss-stone"
                                    : "text-grey"
                                )}
                              >
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block">
                      <BodySmallMedium className="text-neutral-03">
                        Confirm password
                      </BodySmallMedium>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder="Confirm your password..."
                        className={cn(
                          "block w-full h-11 rounded-lg border text-sm bg-white px-4 pr-11",
                          "shadow-sm",
                          "placeholder:text-gray-400",
                          "focus:outline-none focus:border-moss-stone focus:ring-2 focus:ring-moss-stone/20",
                          "transition-all duration-200",
                          "disabled:bg-grey-lightest disabled:cursor-not-allowed",
                          confirmPassword && !passwordsMatch
                            ? "border-red-400"
                            : "border-grey-stroke"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-grey hover:text-neutral-03 transition-colors rounded-md hover:bg-grey-lightest"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-500 mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Submit */}
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
                          <span>Resetting password...</span>
                        </>
                      ) : (
                        <span>Reset password</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success — auto redirect countdown */
              <div className="mt-8">
                <Link
                  href="/login"
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 rounded-lg",
                    "text-sm font-semibold transition-all duration-200",
                    "bg-charcoal-green text-white hover:bg-charcoal-green/90 active:scale-[0.98]",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss-stone"
                  )}
                >
                  Go to sign in
                </Link>
              </div>
            )}

            {/* Back to login (only show on form, not on success) */}
            {!isSuccess && (
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-moss-stone hover:text-moss-stone/80 transition-colors font-medium"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-grey">
            © {new Date().getFullYear()} Bumi Resources. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

const ResetPasswordOrganism: React.FC = () => {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordOrganism;
