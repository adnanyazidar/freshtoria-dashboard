import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freshtoria Dashboard",
  description: "Manajemen inventaris dan keuangan Freshtoria",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} flex h-full min-h-screen bg-zinc-50 dark:bg-zinc-900 antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
