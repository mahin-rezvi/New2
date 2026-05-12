import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteCartLine, fetchCart, patchCartLine } from "@/lib/api";

export function CartPage() {
  const qc = useQueryClient();
  const cart = useQuery({ queryKey: ["cart"], queryFn: fetchCart });

  const updateQty = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      patchCartLine(productId, quantity),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: (productId: string) => deleteCartLine(productId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (cart.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Loading cart…</div>
    );
  }

  const lines = cart.data?.lines ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-white">Cart</h1>
      {lines.length === 0 ? (
        <p className="mt-6 text-zinc-400">
          Your cart is empty.{" "}
          <Link to="/shop" className="text-brand-400 hover:underline">
            Browse the shop
          </Link>
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  {line.product.imageUrl ? (
                    <img src={line.product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <Link to={`/product/${line.product.slug}`} className="font-medium text-white hover:text-brand-300">
                    {line.product.name}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500">
                    {(line.product.priceCents / 100).toLocaleString("en-BD", {
                      style: "currency",
                      currency: line.product.currency,
                    })}{" "}
                    each
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                  Quantity
                </label>
                <input
                  id={`qty-${line.productId}`}
                  type="number"
                  min={1}
                  max={line.product.stock}
                  className="w-20 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-sm text-white"
                  defaultValue={line.quantity}
                  key={line.quantity}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v) || v < 1) return;
                    updateQty.mutate({ productId: line.productId, quantity: Math.min(v, line.product.stock) });
                  }}
                />
                <button
                  type="button"
                  className="text-sm text-red-400 hover:underline"
                  onClick={() => remove.mutate(line.productId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-col items-end gap-4 border-t border-white/10 pt-6">
            <p className="text-lg text-white">
              Subtotal:{" "}
              <span className="font-semibold">
                {((cart.data?.subtotalCents ?? 0) / 100).toLocaleString("en-BD", {
                  style: "currency",
                  currency: cart.data?.currency ?? "BDT",
                })}
              </span>
            </p>
            <Link
              to="/checkout"
              className="inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
