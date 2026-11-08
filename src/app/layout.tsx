import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "MyMoney Buddy", template: "%s · MyMoney Buddy" },
  description: "Teman kecilmu untuk mencatat pemasukan, pengeluaran, dan anggaran bulanan.",
};

export const viewport: Viewport = {
  themeColor: "#07061c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="min-h-dvh">
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          toastOptions={{ style: { borderRadius: "1rem", fontFamily: "var(--font-poppins)", fontWeight: 600 } }}
        />
      </body>
    </html>
  );
}
