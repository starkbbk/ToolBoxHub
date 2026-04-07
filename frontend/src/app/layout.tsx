import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ToolboxHub | AI-Powered Multi-Tool Suite",
  description: "A professional collection of free tools for video, PDF, images, and text powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
