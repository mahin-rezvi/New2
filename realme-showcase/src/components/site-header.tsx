import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link className="brand-lock" href="/">
          <span className="brand-mark">
            <Image
              src="https://www.startech.com.bd/image/catalog/logo.png"
              alt="Star Tech"
              width={168}
              height={48}
              className="brand-logo"
              style={{ width: "auto", height: "32px" }}
              priority
            />
          </span>
          <div className="brand-copy">
            <strong>Star Tech Atlas</strong>
            <span>Whole-site crawl, search, and product analysis</span>
          </div>
        </Link>

        <div className="site-header-actions">
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/catalog">Catalog</Link>
            <Link href="/insights">Insights</Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
