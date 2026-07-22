import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dryer Vent Superheroes Booking Assistant",
  description:
    "Book Dryer Vent Superheroes services by chatting with our booking assistant — dryer vent cleaning, air duct cleaning, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
