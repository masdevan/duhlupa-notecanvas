import type { Metadata } from "next";
import Script from "next/script";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "duhlupa",
  description: "duhlupa",
  manifest: "/core/favicon/site.webmanifest",
  icons: {
    icon: "/core/favicon/favicon.ico",
    apple: "/core/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <head>
        <Script src="/init.js" strategy="beforeInteractive" />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
