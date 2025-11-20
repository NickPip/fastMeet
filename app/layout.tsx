import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastMeet - 10 Minute Rooms",
  description: "Meet people online in temporary 10-minute rooms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

