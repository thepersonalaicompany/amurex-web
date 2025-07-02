import "@amurex/ui/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Noto_Serif } from "next/font/google";
import { defaultSEOConfig } from "./seo";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

// Fonts
const inter = Inter({ subsets: ["latin"] });
const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif",
});

// Metadata
export const metadata: Metadata = {
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

// Layout
const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <html lang="en">
      <head>
        <meta
          property="og:image"
          content={defaultSEOConfig.openGraph.images[0].url}
        />
        <meta
          property="og:image:width"
          content={String(defaultSEOConfig.openGraph.images[0].width)}
        />
        <meta
          property="og:image:height"
          content={String(defaultSEOConfig.openGraph.images[0].height)}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} antialiased ${inter.className}`}
      >
        <span
          className="flex h-screen overflow-hidden"
          // style={{ backgroundColor: "var(--surface-color-2)" }}
        >
          <main
            className={`flex-1 overflow-y-auto`}

            // style={{ backgroundColor: "var(--surface-color-2)" }}
          >
            {children}
          </main>
        </span>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
