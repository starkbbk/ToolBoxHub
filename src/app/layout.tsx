import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import DynamicBackground from "@/components/layout/DynamicBackground";
import ScrollbarControl from "@/components/layout/ScrollbarControl";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "@/constants";

import { ThemeProvider } from "@/context/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col relative`}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <ThemeProvider>
              <TooltipProvider>
                <ScrollbarControl />
                <DynamicBackground />
                <Navbar />
                <main className="flex-1 container mx-auto px-4 pt-28 pb-10 relative z-10">
                  {children}
                </main>
                <Footer />
                <Toaster position="top-right" richColors theme="dark" />
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
