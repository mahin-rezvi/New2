import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCart } from "@/lib/api";
import { authClient, useAuthSession } from "@/lib/auth-client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
];

export function AppLayout() {
  const session = useAuthSession();
  const cart = useQuery({ queryKey: ["cart"], queryFn: fetchCart });

  const count = cart.data?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-brand-400 to-brand-700 text-sm font-bold text-white shadow-lg shadow-brand-900/40">
              DH
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Dealhaven<span className="text-brand-400">Pro</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-zinc-300">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 transition-colors",
                    isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/cart"
              className="relative rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"
            >
              Cart
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
            {session.data?.user ? (
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 transition-colors",
                    isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                Account
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2 transition-colors",
                      isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-white shadow-md shadow-brand-900/30 hover:bg-brand-500"
                >
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <p className="font-display text-lg font-semibold text-white">Dealhaven Pro</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              Inspired by the Bangladesh deals storefront ecosystem — rebuilt with modern auth, catalog search, and
              flexible checkout.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            <div>
              <p className="font-medium text-zinc-200">Company</p>
              <ul className="mt-2 space-y-1">
                <li>About</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-200">Policies</p>
              <ul className="mt-2 space-y-1">
                <li>Privacy</li>
                <li>Returns</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-500">
          {session.data?.user ? (
            <button
              type="button"
              className="underline-offset-2 hover:underline"
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      void session.refetch();
                    },
                  },
                });
              }}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
