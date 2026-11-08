import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "MyMoney Buddy", template: "%s · MyMoney Buddy" },
  description: "Teman kecilmu untuk mencatat pemasukan, pengeluaran, dan anggaran bulanan.",
};

export const viewport: Viewport = {
  themeColor: "#07061c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={nunito.variable}>
      <body className="min-h-dvh">
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          toastOptions={{ style: { borderRadius: "1rem", fontFamily: "var(--font-nunito)", fontWeight: 700 } }}
        />
      </body>
    </html>
  );
}
