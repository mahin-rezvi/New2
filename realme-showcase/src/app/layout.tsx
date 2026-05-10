import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Star Tech Atlas - Product Catalog",
  description: "Fast, modern product catalog built from live Star Tech website data. Search 20,000+ products across all categories.",
  metadataBase: new URL("https://startech-atlas.example.com"),
  
  // Performance and SEO metadata
  openGraph: {
    title: "Star Tech Atlas",
    description: "Fast, modern product catalog",
    type: "website",
  },
  
  // Charset and viewport for optimal rendering
  other: {
    "charset": "utf-8",
    "X-UA-Compatible": "ie=edge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const stored = localStorage.getItem('startech-atlas-theme');
                  const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  const theme = stored === 'light' || stored === 'dark' ? stored : system;
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch {
                  document.documentElement.dataset.theme = 'dark';
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://www.startech.com.bd" />
        <link rel="dns-prefetch" href="https://www.startech.com.bd" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#09111c" />
      </head>
      <body suppressHydrationWarning>
        <div className="app-backdrop" />
        <SiteHeader />
        {children}
        
        {/* Service Worker registration for offline support */}
        {typeof window !== "undefined" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('SW registration failed:', err);
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
