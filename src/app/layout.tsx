import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "अर्थसाथी ArthSathi — On-Device Vernacular Financial Advisor",
  description: "On-device LLM-powered financial advisory model that answers FD, savings, and tax questions in vernacular Indian languages without sending any PII to the cloud.",
  keywords: ["ArthSathi", "financial advisor", "Indian finance", "vernacular AI", "on-device AI", "Hindi finance", "FD rates", "tax saving", "PPF", "NPS"],
  authors: [{ name: "ArthSathi AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "अर्थसाथी ArthSathi — On-Device Vernacular Financial Advisor",
    description: "Privacy-first vernacular financial advisory AI for Indian citizens",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
