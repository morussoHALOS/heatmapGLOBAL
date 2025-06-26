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
  title: "HALOS Global Heatmap",
  description: "Created by Mo",
  icons: {
    icon: "/halos_favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/halos_favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>HALOS Global Heatmap</title>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
