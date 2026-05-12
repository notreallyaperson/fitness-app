import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/register-sw";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Exercise Tracker",
  description: "Log workouts, track effort, get smarter sessions over time.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-dvh bg-background text-foreground`}
      >
        <Header />
        <RegisterSW />
        <main className="mx-auto max-w-2xl p-4 pb-24">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
