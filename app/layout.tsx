import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duhlupa",
  description: "Duhlupa",
  manifest: "/core/favicon/site.webmanifest",
  icons: {
    icon: "/core/favicon/favicon.ico",
    apple: "/core/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ backgroundColor: "#090909" }}
      className="h-full antialiased"
    >
      <head>
        <link
          rel="preload"
          href="/fonts/roboto.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/rouge-script.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`@font-face {
          font-family: "Roboto";
          src: url(/fonts/roboto.woff2) format("woff2");
          font-weight: 400 700;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: "Rouge Script";
          src: url(/fonts/rouge-script.woff2) format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }`}</style>
        <Script src="/init.js" strategy="beforeInteractive" />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
