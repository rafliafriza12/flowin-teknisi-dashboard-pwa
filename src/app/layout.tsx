import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import NextTopLoader from "nextjs-toploader";
import MainLayout from "@/components/templates/layouts/MainLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "BUMI Resource CMS",
  description: "BUMI Resource Content Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-parkinsans antialiased bg-grey-lightest overflow-x-hidden overflow-y-auto thin-scrollbar`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#A0AC67"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          zIndex={99999}
        />
        <QueryProvider>{children}</QueryProvider>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
