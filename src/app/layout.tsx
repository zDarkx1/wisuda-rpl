import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buku Tamu Digital | Wisuda RPL 2026",
  description: "Sistem buku tamu digital untuk acara wisuda jurusan RPL.",
};

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToasterProvider } from "@/components/toaster-provider";
import 'goey-toast/styles.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>
          {children}
          <ToasterProvider />
        </TooltipProvider>
      </body>
    </html>
  );
}
