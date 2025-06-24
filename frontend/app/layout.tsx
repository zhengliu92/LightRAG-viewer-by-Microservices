import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "知识图谱引擎",
  description: "知识图谱引擎",
  icons: {
    icon: "/network-color.png",
    shortcut: "/network-color.png",
    apple: "/network-color.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh'>
      <body className={`font-alibaba-regular antialiased`}>{children}</body>
    </html>
  );
}
