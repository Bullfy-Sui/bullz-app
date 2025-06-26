import RootProvider from "@/components/providers/root-provider";
import type { Metadata } from "next";
import "./globals.css";

import localFont from "next/font/local";
const offbit = localFont({
  src: [
    {
      path: "../../public/assets/fonts/offbit/OffBit-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/offbit/OffBit-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-offbit",
});

export const metadata: Metadata = {
  title: "Bullz",
  description: "Crypto fantasy H2H gaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${offbit.variable} font-offbit antialiased`}>
        <RootProvider>
          <div className="max-w-[26.875rem] w-full mx-auto">{children}</div>
        </RootProvider>
      </body>
    </html>
  );
}
