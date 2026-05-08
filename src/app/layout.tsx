import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "अर्थसाथी ArthSathi — On-Device Vernacular Financial Advisor",
  description:
    "ArthSathi is a DPDPA-compliant, on-device AI financial advisor powered by fine-tuned Qwen3-4B. Get expert guidance on FD, MF, SIP, tax planning, and government schemes in 12 Indian languages — all without sending PII to the cloud.",
  keywords: [
    "ArthSathi",
    "on-device AI",
    "vernacular finance",
    "Indian financial advisor",
    "Hindi finance AI",
    "FD rates India",
    "tax saving calculator",
    "mutual fund advisor",
    "SIP calculator",
    "PPF",
    "NPS",
    "SCSS",
    "DICGC",
    "Qwen3-4B",
    "privacy-first AI",
    "DPDPA compliant",
    "BhashaBench",
  ],
  authors: [{ name: "ArthSathi AI Lab" }],
  creator: "ArthSathi AI Lab",
  publisher: "ArthSathi",
  robots: { index: true, follow: true },
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "अर्थसाथी ArthSathi — On-Device Vernacular Financial Advisor",
    description:
      "Privacy-first, DPDPA-compliant AI financial advisor for 1.4B Indians. Expert guidance in 12 languages. Powered by fine-tuned Qwen3-4B running 100% on-device.",
    type: "website",
    locale: "en_IN",
    siteName: "ArthSathi",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArthSathi — On-Device Vernacular Financial Advisor",
    description:
      "Expert financial advice in 12 Indian languages. 100% on-device, DPDPA-compliant, powered by fine-tuned Qwen3-4B.",
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
