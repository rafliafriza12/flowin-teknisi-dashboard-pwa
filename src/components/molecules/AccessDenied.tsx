"use client";

import { Heading4 } from "@/components/atoms/Typography";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  errorCode?: string;
  requiredRole?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Access Denied",
  message = "You don't have permission to access this resource.",
  errorCode,
  requiredRole,
  showBackButton = true,
  showHomeButton = true,
  onRetry,
}) => {
  const router = useRouter();

  return (
    <div className="bg-neutral-01 rounded-lg border border-grey-stroke p-8">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {/* Lock Icon */}
        <div className="w-20 h-20 mb-6 rounded-full bg-error/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-error"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        <Heading4 className="text-xl font-semibold text-neutral-03 mb-3">
          {title}
        </Heading4>

        <p className="text-sm text-grey mb-2 max-w-md">{message}</p>

        {requiredRole && (
          <p className="text-xs text-grey-dark mb-4">
            Required role:{" "}
            <span className="font-medium text-neutral-03">{requiredRole}</span>
          </p>
        )}

        {errorCode && (
          <p className="text-xs text-grey-dark mb-6">
            Error code:{" "}
            <span className="font-mono bg-grey-lightest px-2 py-0.5 rounded">
              {errorCode}
            </span>
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-neutral-01 text-neutral-03 border border-grey-stroke rounded-lg text-sm font-medium hover:bg-grey-lightest transition-colors"
            >
              Go Back
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-moss-stone text-white rounded-lg text-sm font-medium hover:bg-moss-stone/90 transition-colors"
            >
              Go to Dashboard
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 bg-neutral-01 text-moss-stone border border-moss-stone rounded-lg text-sm font-medium hover:bg-moss-stone/5 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
