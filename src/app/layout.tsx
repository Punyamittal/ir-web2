import type { Metadata } from "next";
import {
  Caveat,
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Inter,
} from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const script = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "International Relations VIT Chennai",
  description: "International Relations — VIT Chennai",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${inter.variable} ${mono.variable} ${script.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="relative flex min-h-full flex-col bg-white font-[family-name:var(--font-inter)] text-cobalt-950">
        {/* Mark splash early so main stays veiled until PageLoader crossfades. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.splash="1";`,
          }}
        />
        <noscript>
          <style>{`html[data-splash] main{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {/* Subtle paper grain: a small pre-rendered tile (see .paper-grain in globals.css).
            A full-screen live feTurbulence filter with a blend mode repainted on every scroll frame. */}
        <div className="paper-grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
