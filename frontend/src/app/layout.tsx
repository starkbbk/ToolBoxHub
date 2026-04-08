import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import DynamicBackground from "@/components/layout/DynamicBackground";
import ScrollbarControl from "@/components/layout/ScrollbarControl";
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
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-[#050505] text-white min-h-screen flex flex-col relative overflow-x-hidden`}>
        <ScrollbarControl />
        <DynamicBackground />
        <Navbar />
        <main className="flex-1 container mx-auto px-4 pt-12 pb-8">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
