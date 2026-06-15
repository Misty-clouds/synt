import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "synt",
  description: "Next.js + NestJS Turborepo",
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
