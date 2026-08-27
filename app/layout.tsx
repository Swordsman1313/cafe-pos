import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Daily Drip — Coffee POS & Management",
  description: "Touchscreen-first Coffee POS, Kitchen Display System, BOM Inventory, and Shift Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
