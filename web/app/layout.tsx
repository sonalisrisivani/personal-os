import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Career OS",
  description: "A private career operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
