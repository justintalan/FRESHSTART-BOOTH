import type { Metadata, Viewport } from "next";
import { ibmPlexMono, pressStart2P } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "RECURSE",
  description:
    "A braided maze that carves itself in. Beat par, or forfeit and watch recursion solve it.",
};

export const viewport: Viewport = {
  themeColor: "#0e0b1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// No header, nav or footer. The stage is the entire page.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="h-full bg-cabinet">{children}</body>
    </html>
  );
}
