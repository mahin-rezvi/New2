import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dealhaven Pro - Your Premium E-Commerce Marketplace",
  description: "Shop quality products with secure payments and fast delivery",
  keywords: ["ecommerce", "shopping", "deals", "marketplace"],
  authors: [{ name: "Dealhaven Team" }],
  creator: "Dealhaven Pro",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dealhaven-pro.vercel.app",
    title: "Dealhaven Pro",
    description: "Your premium e-commerce marketplace",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <MainNav />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
