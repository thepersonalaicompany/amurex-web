import localFont from "next/font/local";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Noto_Serif } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { defaultSEOConfig } from "./seo";
import { Inter } from "next/font/google";
import IntercomProvider from "@/components/IntercomProvider";
import { Navbar } from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Amurex",
  description: "Your AI copilot for work and life",
  metadataBase: new URL("https://app.amurex.ai"),
  openGraph: {
    title: "Amurex",
    description: "Your AI copilot for work and life",
    url: "https://app.amurex.ai",
    siteName: "Amurex",
    images: [
      {
        url: "/og_amurex.jpg",
        width: 1200,
        height: 630,
        alt: "Amurex Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amurex",
    description: "Your AI copilot for work and life",
    creator: "@thepersonalaico",
    images: ["/og_amurex.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <meta
          property="og:image"
          content={defaultSEOConfig.openGraph.images[0].url}
        />
        <meta
          property="og:image:width"
          content={defaultSEOConfig.openGraph.images[0].width}
        />
        <meta
          property="og:image:height"
          content={defaultSEOConfig.openGraph.images[0].height}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} antialiased ${inter.className} bg-black`}
      >
        <AuthProvider>
          <IntercomProvider>
            <span
              className="flex h-screen overflow-hidden"
              // style={{ backgroundColor: "var(--surface-color-2)" }}
            >
              <main
                className={`flex-1 overflow-y-auto`}

                // style={{ backgroundColor: "var(--surface-color-2)" }}
              >
                <div className="flex h-screen flex-row">
                  <Navbar />
                  <div className="flex-1 overflow-y-auto">{children}</div>
                </div>
              </main>
            </span>
            <SpeedInsights />
            <Analytics />
          </IntercomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
