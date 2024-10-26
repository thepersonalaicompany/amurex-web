import localFont from "next/font/local";
import "./globals.css";
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

export const metadata = {
  title: "Brainex",
  description: "The second brain killer app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <span className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--surface-color-2)" }}>
          <Navbar />
          <main className="flex-1 overflow-y-auto ml-16" style={{ backgroundColor: "var(--surface-color-2)" }}>
            {children}
          </main>
        </span>
      </body>
    </html>
  );
}
