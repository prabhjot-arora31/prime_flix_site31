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
        {/* min-w-0 overrides the flex item default of min-width:auto — without
            it, a horizontally-scrolling row (e.g. Related People) with wide
            unwrapped content forces this whole flex item (and so the entire
            page) wider than the viewport instead of just scrolling within
            its own bounds. */}
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
