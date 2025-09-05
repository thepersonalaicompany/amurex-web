export const defaultSEOConfig = {
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
        url: "/og_amurex.jpg", // You'll need to add this image to your public folder
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
