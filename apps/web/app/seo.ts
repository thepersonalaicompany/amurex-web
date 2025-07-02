interface OpenGraphImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

interface OpenGraph {
  type: "website";
  locale: string;
  url: string;
  siteName: string;
  title: string;
  description: string;
  images: [OpenGraphImage, ...OpenGraphImage[]];
}

type TwitterCardType = "summary" | "summary_large_image" | "app" | "player";

interface Twitter {
  handle: string;
  site: string;
  cardType: TwitterCardType;
  images: string[];
  title: string;
  description: string;
}

interface SEOConfig {
  title: string;
  description: string;
  openGraph: OpenGraph;
  twitter: Twitter;
}

export const defaultSEOConfig: SEOConfig = {
  title: "Amurex",
  description: "Your AI copilot for work and life",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.amurex.ai",
    siteName: "Amurex",
    title: "Amurex - Your AI copilot for work and life",
    description: "Your AI copilot for work and life",
    images: [
      {
        url: "/og_amurex.jpg", // added image to public folder
        width: 1200,
        height: 630,
        alt: "Amurex Open Graph Image",
      },
    ],
  },
  twitter: {
    handle: "@thepersonalaico",
    site: "@thepersonalaico",
    cardType: "summary_large_image",
    images: ["/og_amurex.jpg"],
    title: "Amurex - Your AI copilot for work and life",
    description: "Your AI copilot for work and life",
  },
};
