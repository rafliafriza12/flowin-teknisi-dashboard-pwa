"use client";
import { useState } from "react";
import Link from "next/link";
import BumiLogo from "@/components/atoms/BumiLogo";
import { LoginBg } from "@/components/atoms/LoginBg";
import EmailInput from "@/components/atoms/inputs/EmailInput";
import { BodySmallMedium } from "@/components/atoms/Typography";
import { useForgotPassword } from "@/services";
import { showToast, showErrorToast } from "@/libs/toast";
import { cn } from "@/libs/utils";
import ChevronLeftIcon from "@/components/atoms/icons/ChevronLeftIcon";

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

const MailSentIcon = () => (
  <svg
    className="w-16 h-16 text-moss-stone"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
      fill="currentColor"
    />
    <circle cx="18" cy="15" r="4" fill="currentColor" opacity="0.2" />
    <path
      d="M16.5 15L17.5 16L19.5 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ForgotPasswordOrganism: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await forgotPassword.mutateAsync({ input: { email } });
      setIsEmailSent(true);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await forgotPassword.mutateAsync({ input: { email } });
      showToast.success("Reset link has been resent to your email.");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() !== "";

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-neutral-01 via-white to-neutral-01/80 relative overflow-hidden">
      {/* Background SVG */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LoginBg className="opacity-20" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-moss-stone/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-charcoal-green/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-[400px]">
          {/* Card Container */}
          <div className="bg-white/5 backdrop-blur-[2px] shadow-xl shadow-charcoal-green/5 border border-moss-stone/40 p-8 sm:p-10 rounded-2xl">
            {/* Logo & Header */}
            <div className="flex flex-col items-center">
              <BumiLogo />

              {!isEmailSent ? (
                <div className="mt-6 text-center">
                  <h1 className="text-xl font-semibold text-charcoal-green">
                    Forgot password?
                  </h1>
                  <p className="mt-1.5 text-sm text-grey">
                    Enter your email and we&apos;ll send you a link to reset
                    your password.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center text-center">
                  <MailSentIcon />
                  <h1 className="mt-4 text-xl font-semibold text-charcoal-green">
                    Check your email
                  </h1>
                  <p className="mt-1.5 text-sm text-grey">
                    We&apos;ve sent a password reset link to{" "}
                    <span className="font-medium text-charcoal-green">
                      {email}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {!isEmailSent ? (
              /* Email Form */
              <div className="mt-8 w-full">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block">
                      <BodySmallMedium className="text-neutral-03">
                        Email address
                      </BodySmallMedium>
                    </label>
                    <EmailInput
                      id="email"
                      name="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-11 px-4 bg-white border-grey-stroke focus:border-moss-stone focus:ring-2 focus:ring-moss-stone/20 transition-all duration-200"
                    />
                  </div>

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
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send reset link</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success state */
              <div className="mt-8 space-y-4">
                <p className="text-xs text-grey text-center">
                  Didn&apos;t receive the email? Check your spam folder or
                </p>
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 rounded-lg",
                    "text-sm font-semibold transition-all duration-200 border",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss-stone",
                    !isLoading
                      ? "border-charcoal-green text-charcoal-green hover:bg-charcoal-green/5 active:scale-[0.98]"
                      : "border-grey-stroke text-grey cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <span>Resend reset link</span>
                  )}
                </button>
              </div>
            )}

            {/* Back to login */}
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

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-grey">
            © {new Date().getFullYear()} Bumi Resources. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordOrganism;
