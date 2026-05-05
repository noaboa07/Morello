import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Morello — League of Legends Coaching & Performance Analytics",
    template: "%s | Morello",
  },
  description:
    "Understand why you lose, track your improvement, and climb faster with Morello's AI-powered match analysis.",
  applicationName: "Morello",
  openGraph: {
    title: "Morello",
    description:
      "Understand why you lose, track your improvement, and climb faster with Morello's AI-powered match analysis.",
    siteName: "Morello",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morello",
    description:
      "Coach-level League of Legends match analysis — ranked stats, live game detection, and explainable match breakdowns.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="antialiased">
        <QueryProvider>
          <Navbar />
          <main className="container py-8 sm:py-10">{children}</main>
          <footer className="container pb-10 pt-2 text-center text-xs text-muted-foreground">
            Morello isn&apos;t endorsed by Riot Games. League of Legends is a
            trademark of Riot Games, Inc.
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
