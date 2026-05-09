import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Code Recall | Master Python, One Line at a Time",
  description: "A gamified, distraction-free environment to master Python through hands-on practice and interactive challenges.",
};

import { CursorProvider } from "@/components/effects/CursorContext";
import CustomCursor from "@/components/effects/CustomCursor";
import CursorTrail from "@/components/effects/CursorTrail";
import BackgroundGlow from "@/components/effects/BackgroundGlow";
import ScrollProgress from "@/components/effects/ScrollProgress";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/30 overflow-x-hidden`}
      >
        <CursorProvider>
          <BackgroundGlow />
          <CursorTrail />
          <CustomCursor />
          <ScrollProgress />
          <Navbar />
          <main className="pt-24 min-h-screen relative z-10">
            {children}
          </main>
        </CursorProvider>
      </body>
    </html>
  );
}
