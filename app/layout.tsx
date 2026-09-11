import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import NavBar from "@/components/NavBar";
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
  title: "PrimeFlix",
  description: "Browse and watch movies & shows.",
};

// viewportFit: "cover" lets the page draw under the notch/rounded-corner
// safe area instead of the browser padding it out with its own background —
// without it, the fullscreen video player shows black bars at the screen
// edges in landscape on notched phones since the page's own viewport never
// extended there in the first place.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <NavBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
