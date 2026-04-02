"use client";
import Link from "next/link";
import { Container } from "@/components/atoms/Container";
import BumiLogo from "@/components/atoms/BumiLogo";
import GroundVector from "@/components/atoms/vectors/GroundVector";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-charcoal-green relative flex items-center justify-center overflow-hidden">
      {/* Background Decorative SVG */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 1920 1080"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M221.496 -77.3723C226.811 -62.1975 235.015 -49.6995 245.047 -36.4788C250.568 -23.3276 262.084 -0.390254 272.574 10.008C279.84 14.4896 285.285 18.642 292.17 24.2248C302.096 29.0328 314.248 29.367 322.128 38.3164C389.323 123.208 447.859 89.7501 423.791 221.568C426.393 290.489 377.482 288.664 359.065 339.672C350.48 396.185 301.386 406.286 267.593 441.878C245.668 475.393 238.285 520.326 204.037 544.873C191.256 553.563 182.412 557.394 173.964 570.849C160.947 588.804 150.667 610.234 127.585 616.516C106.003 639.208 100.128 621.321 75.7081 615.898C61.0914 617.509 48.8541 628.567 34.2447 631.571C22.464 649.277 25.963 675.973 11.3654 691.789C-7.0499 695.559 -20.089 674.33 -24.1125 658.527C-24.5533 644.749 -22.3814 629.685 -24.7998 615.386C-30.6685 569.472 -50.905 526.219 -63.6249 481.104C-77.25 439.237 -83.4472 391.542 -44.9694 367.449C-21.1247 353.789 2.32576 342.023 13.9837 315.672C102.056 233.205 50.8157 246.752 78.5369 167.932C91.0468 135.16 79.2908 86.4436 117.865 71.5501C138.389 51.259 127.08 10.3524 148.216 -10.2659C171.239 -22.0434 177.873 -46.5107 185.039 -69.7901C186.743 -96.3296 206.373 -112.692 221.497 -77.3599L221.496 -77.3723Z"
            fill="#CAD4BA"
            opacity="0.3"
          />
          <path
            d="M1700 800C1650 750 1600 700 1550 680C1500 660 1450 650 1400 670C1350 690 1300 740 1280 800C1260 860 1270 920 1300 970C1330 1020 1380 1060 1440 1070C1500 1080 1560 1060 1600 1020C1640 980 1670 920 1700 860L1700 800Z"
            fill="#A0AC67"
            opacity="0.2"
          />
        </svg>
      </div>

      {/* Ground Vector at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-0 opacity-20">
        <GroundVector />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center justify-center text-center gap-8 py-20">
          {/* Logo */}
          <div className="w-32 lg:w-40 mb-4 animate-pulse">
            <BumiLogo variant="white" />
          </div>

          {/* 404 Text */}
          <div className="relative">
            <h1 className="text-[120px] sm:text-[180px] lg:text-[240px] font-bold text-moss-stone/20 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-light text-white-mineral">
                Page Not Found
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-2xl space-y-4">
            <p className="text-lg sm:text-xl text-earth-craft font-light leading-relaxed">
              The page you are looking for might have been removed, had its name
              changed, or is temporarily unavailable.
            </p>
            <p className="text-base text-white-mineral/80">
              Mari kembali ke halaman utama untuk melanjutkan eksplorasi tentang
              Bumi Resources.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/"
              className="group relative px-8 py-4 bg-moss-stone text-charcoal-green font-medium rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-moss-stone/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg
                  className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </span>
              <div className="absolute inset-0 bg-earth-craft transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>

            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.history.back();
              }}
              className="px-8 py-4 border-2 border-earth-craft text-earth-craft font-medium rounded-lg transition-all duration-300 hover:bg-earth-craft hover:text-charcoal-green hover:scale-105"
            >
              Go Back
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-white-mineral/20">
            <p className="text-sm text-white-mineral/60 mb-4">
              Need help? Try these popular pages:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="text-earth-craft hover:text-moss-stone transition-colors underline underline-offset-4"
              >
                Home
              </Link>
              <span className="text-white-mineral/30">•</span>
              <Link
                href="/#about"
                className="text-earth-craft hover:text-moss-stone transition-colors underline underline-offset-4"
              >
                About Us
              </Link>
              <span className="text-white-mineral/30">•</span>
              <Link
                href="/#contact"
                className="text-earth-craft hover:text-moss-stone transition-colors underline underline-offset-4"
              >
                Contact
              </Link>
              <span className="text-white-mineral/30">•</span>
              <Link
                href="/#news"
                className="text-earth-craft hover:text-moss-stone transition-colors underline underline-offset-4"
              >
                News
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
