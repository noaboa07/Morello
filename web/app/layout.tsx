import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "LoL.tracker | League of Legends Stats & Match Insights",
    template: "%s | LoL.tracker",
  },
  description:
    "A polished League of Legends stats app with live game tracking, match explainability, champion insights, and portfolio-ready product polish.",
  applicationName: "LoL.tracker",
  openGraph: {
    title: "LoL.tracker",
    description:
      "Search any Riot ID and explore live games, ranked history, match insights, and polished analytics.",
    siteName: "LoL.tracker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoL.tracker",
    description:
      "League of Legends stats, live game tracking, and explainable match insights.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <QueryProvider>
          <Navbar />
          <main className="container py-8 sm:py-10">{children}</main>
          <footer className="container pb-10 pt-2 text-center text-xs text-muted-foreground">
            LoL.tracker isn&apos;t endorsed by Riot Games. League of Legends is a
            trademark of Riot Games, Inc.
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
