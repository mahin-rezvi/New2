import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMyOrders } from "@/lib/api";
import { useAuthSession } from "@/lib/auth-client";

export function AccountPage() {
  const session = useAuthSession();
  const orders = useQuery({
    queryKey: ["orders", "me"],
    queryFn: fetchMyOrders,
    enabled: !!session.data?.user,
  });

  if (!session.data?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-white">Sign in required</h1>
        <p className="mt-2 text-zinc-400">Log in to view orders and saved activity.</p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-white">Your account</h1>
      <p className="mt-1 text-zinc-400">{session.data.user.email}</p>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-white">Orders</h2>
        {orders.isLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : orders.data?.length ? (
          <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10">
            {orders.data.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-zinc-500">{o.id}</span>
                <span className="text-zinc-300">
                  {(o.totalCents / 100).toLocaleString("en-BD", { style: "currency", currency: o.currency })}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-200">{o.status}</span>
                <span className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No orders yet.</p>
        )}
      </section>
    </div>
  );
}
