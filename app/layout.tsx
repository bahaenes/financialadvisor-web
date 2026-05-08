import type { Metadata } from "next";
import { Inter, Hanken_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hanken" });
const ibmPlex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["600"], variable: "--font-ibm-plex" });

export const metadata: Metadata = {
  title: "BIST Financial Advisor",
  description: "Profesyonel BIST hisse analiz platformu — teknik analiz, makro veriler ve portföy yönetimi",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${hanken.variable} ${ibmPlex.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: "#0a0e1a" }}>{children}</body>
    </html>
  );
}
