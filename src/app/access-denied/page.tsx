"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  return (
    <main className="min-h-screen bg-white-mineral flex items-center justify-center font-parkinsans">
      <div className="bg-neutral-01 rounded-lg border border-grey-stroke p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
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
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-charcoal-green mb-2">
            Access Denied
          </h1>

          <p className="text-neutral-06 mb-4">
            Dashboard ini hanya bisa diakses oleh <strong>Technician</strong>.
          </p>

          {role && (
            <p className="text-sm text-neutral-05 mb-6">
              Role kamu saat ini: <span className="font-semibold">{role}</span>
            </p>
          )}

          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-6 py-2 bg-charcoal-green text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Login Ulang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
