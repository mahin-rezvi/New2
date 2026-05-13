import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminBulkDelete,
  adminCreateCategory,
  adminCreateProduct,
  adminDeleteCategory,
  adminDeleteProduct,
  adminExport,
  adminImport,
  adminListCategories,
  adminListProducts,
  adminPatchProduct,
  getStoredAdminKey,
  setStoredAdminKey,
  type AdminCategory,
  type AdminStoredProduct,
} from "@/lib/admin-api";

const emptyProduct: Partial<AdminStoredProduct> & {
  slug: string;
  categoryId: string;
  name: string;
  priceCents: number;
  stock: number;
} = {
  slug: "",
  categoryId: "",
  name: "",
  description: "",
  priceCents: 0,
  compareAtCents: null,
  currency: "BDT",
  imageUrl: "",
  badges: [],
  stock: 0,
  rating: 4.5,
  reviewCount: 0,
  featuredNew: false,
  featuredBest: false,
};

export function AdminPage() {
  const qc = useQueryClient();
  const [adminKey, setAdminKey] = useState(getStoredAdminKey);
  const [draftKey, setDraftKey] = useState(adminKey);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminStoredProduct | null>(null);
  const [createForm, setCreateForm] = useState(emptyProduct);
  const [catSlug, setCatSlug] = useState("");
  const [catName, setCatName] = useState("");

  const hint = import.meta.env.VITE_ADMIN_HINT ?? "";

  const productsQ = useQuery({
    queryKey: ["admin", "products", adminKey],
    queryFn: () => adminListProducts(adminKey),
    enabled: !!adminKey,
  });

  const categoriesQ = useQuery({
    queryKey: ["admin", "categories", adminKey],
    queryFn: () => adminListCategories(adminKey),
    enabled: !!adminKey,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["session"] });
  };

  const saveKey = () => {
    setStoredAdminKey(draftKey.trim());
    setAdminKey(draftKey.trim());
    setImportMsg(null);
  };

  const delOne = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id, adminKey),
    onSuccess: invalidate,
  });

  const bulkDel = useMutation({
    mutationFn: (ids: string[]) => adminBulkDelete(ids, adminKey),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });

  const patch = useMutation({
    mutationFn: (p: AdminStoredProduct) => adminPatchProduct(p.id, p, adminKey),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
  });

  const create = useMutation({
    mutationFn: () =>
      adminCreateProduct(
        {
          slug: createForm.slug,
          categoryId: createForm.categoryId,
          name: createForm.name,
          description: createForm.description || null,
          priceCents: Number(createForm.priceCents),
          compareAtCents: createForm.compareAtCents ?? null,
          currency: createForm.currency ?? "BDT",
          imageUrl: createForm.imageUrl || null,
          badges: Array.isArray(createForm.badges) ? createForm.badges : [],
          stock: Number(createForm.stock),
          rating: Number(createForm.rating ?? 4.5),
          reviewCount: Number(createForm.reviewCount ?? 0),
          featuredNew: !!createForm.featuredNew,
          featuredBest: !!createForm.featuredBest,
        },
        adminKey,
      ),
    onSuccess: () => {
      setCreateForm(emptyProduct);
      invalidate();
    },
  });

  const importMut = useMutation({
    mutationFn: (merge: boolean) => {
      let raw: unknown;
      try {
        raw = JSON.parse(importText);
      } catch {
        throw new Error("Invalid JSON");
      }
      const payload = Array.isArray(raw)
        ? { products: raw as Record<string, unknown>[], merge }
        : (raw as { categories?: AdminCategory[]; products?: Record<string, unknown>[]; merge?: boolean });
      return adminImport({ ...payload, merge: merge ?? payload.merge }, adminKey);
    },
    onSuccess: (res) => {
      setImportMsg(
        `Imported categories: ${res.categoriesUpserted}, products: ${res.productsUpserted}. Errors: ${res.errors.length}`,
      );
      if (res.errors.length) console.warn(res.errors);
      invalidate();
    },
    onError: (e: Error) => setImportMsg(e.message),
  });

  const addCat = useMutation({
    mutationFn: () => adminCreateCategory({ slug: catSlug.trim(), name: catName.trim() }, adminKey),
    onSuccess: () => {
      setCatSlug("");
      setCatName("");
      invalidate();
    },
  });

  const delCat = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(id, adminKey),
    onSuccess: invalidate,
  });

  const categoryOptions = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);

  async function downloadExport() {
    const data = await adminExport(adminKey);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dealhaven-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Admin / CRUD</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Redis-backed catalog. Set the same key as server <code className="text-zinc-400">ADMIN_API_KEY</code>.
            {hint ? ` ${hint}` : ""}
          </p>
        </div>
        <Link to="/shop" className="text-sm text-brand-400 hover:underline">
          ← Storefront
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">X-Admin-Key</label>
          <input
            type="password"
            autoComplete="off"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none ring-brand-500 focus:ring-2"
            placeholder="Paste admin API key"
          />
        </div>
        <button
          type="button"
          onClick={saveKey}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Save key
        </button>
      </div>

      {!adminKey ? (
        <p className="mt-6 text-sm text-amber-400">Save an admin key to load data.</p>
      ) : (
        <>
          {productsQ.isError ? (
            <p className="mt-4 text-sm text-red-400">{(productsQ.error as Error).message}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void productsQ.refetch()}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => void downloadExport()}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
            >
              Export JSON
            </button>
            <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">
              Import file
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
            </label>
            <button
              type="button"
              disabled={!importText.trim() || importMut.isPending}
              onClick={() => importMut.mutate(true)}
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-40"
            >
              Apply import (merge)
            </button>
            <button
              type="button"
              disabled={!importText.trim() || importMut.isPending}
              onClick={() => importMut.mutate(false)}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
            >
              Apply import (no merge)
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => bulkDel.mutate([...selected])}
              className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-200 hover:bg-red-900 disabled:opacity-40"
            >
              Bulk delete ({selected.size})
            </button>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='JSON: { "categories": [...], "products": [...] } or a products array'
            rows={5}
            className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200 outline-none ring-brand-500 focus:ring-2"
          />
          {importMsg ? <p className="mt-2 text-xs text-zinc-400">{importMsg}</p> : null}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-white">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="slug"
                className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
              />
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="name"
                className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
              />
              <button
                type="button"
                disabled={!catSlug.trim() || !catName.trim()}
                onClick={() => addCat.mutate()}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                Add category
              </button>
            </div>
            <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
              {(categoriesQ.data ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="text-zinc-200">
                    {c.name} <span className="text-zinc-500">({c.slug})</span>
                  </span>
                  <button type="button" className="text-red-400 hover:underline" onClick={() => delCat.mutate(c.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 overflow-x-auto">
            <h2 className="text-lg font-semibold text-white">Products</h2>
            <table className="mt-4 w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={productsQ.data?.length ? selected.size === productsQ.data.length : false}
                      onChange={() => {
                        const all = productsQ.data?.map((p) => p.id) ?? [];
                        setSelected(selected.size === all.length ? new Set() : new Set(all));
                      }}
                    />
                  </th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {(productsQ.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 pr-2">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    </td>
                    <td className="max-w-[220px] truncate py-2 text-zinc-200">{p.name}</td>
                    <td className="py-2 font-mono text-xs text-zinc-400">{p.slug}</td>
                    <td className="py-2 text-zinc-300">{(p.priceCents / 100).toFixed(0)}</td>
                    <td className="py-2 text-zinc-300">{p.stock}</td>
                    <td className="py-2 text-right">
                      <button type="button" className="text-brand-400 hover:underline" onClick={() => setEditing(p)}>
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="text-red-400 hover:underline"
                        onClick={() => {
                          if (confirm("Delete this product?")) delOne.mutate(p.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {editing ? (
            <div className="mt-8 rounded-2xl border border-brand-500/30 bg-zinc-900/60 p-4">
              <h3 className="font-medium text-white">Edit product</h3>
              <EditForm
                value={editing}
                categories={categoryOptions}
                onChange={setEditing}
                onSave={() => patch.mutate(editing)}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : null}

          <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
            <h3 className="font-medium text-white">Create product</h3>
            <EditForm
              value={
                {
                  ...createForm,
                  id: "new",
                  createdAt: Date.now(),
                  compareAtCents: createForm.compareAtCents ?? null,
                  description: (createForm.description as string) || null,
                  imageUrl: (createForm.imageUrl as string) || null,
                  badges: (createForm.badges as string[]) ?? [],
                  currency: createForm.currency ?? "BDT",
                  featuredNew: !!createForm.featuredNew,
                  featuredBest: !!createForm.featuredBest,
                } as AdminStoredProduct
              }
              categories={categoryOptions}
              onChange={(v) =>
                setCreateForm({
                  slug: v.slug,
                  categoryId: v.categoryId,
                  name: v.name,
                  description: v.description ?? "",
                  priceCents: v.priceCents,
                  compareAtCents: v.compareAtCents,
                  currency: v.currency,
                  imageUrl: v.imageUrl ?? "",
                  badges: v.badges,
                  stock: v.stock,
                  rating: v.rating,
                  reviewCount: v.reviewCount,
                  featuredNew: v.featuredNew,
                  featuredBest: v.featuredBest,
                })
              }
              onSave={() => create.mutate()}
              onCancel={() => setCreateForm(emptyProduct)}
              saveLabel="Create"
            />
          </div>
        </>
      )}
    </div>
  );
}

function EditForm({
  value,
  categories,
  onChange,
  onSave,
  onCancel,
  saveLabel = "Save",
}: {
  value: AdminStoredProduct;
  categories: AdminCategory[];
  onChange: (v: AdminStoredProduct) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-zinc-400">
        Name
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <label className="text-xs text-zinc-400">
        Slug
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 font-mono text-sm text-white"
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
        />
      </label>
      <label className="text-xs text-zinc-400 sm:col-span-2">
        Category
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.categoryId}
          onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-zinc-400 sm:col-span-2">
        Description
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value || null })}
        />
      </label>
      <label className="text-xs text-zinc-400">
        Price (cents)
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.priceCents}
          onChange={(e) => onChange({ ...value, priceCents: Number(e.target.value) })}
        />
      </label>
      <label className="text-xs text-zinc-400">
        Stock
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.stock}
          onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })}
        />
      </label>
      <label className="text-xs text-zinc-400 sm:col-span-2">
        Image URL
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          value={value.imageUrl ?? ""}
          onChange={(e) => onChange({ ...value, imageUrl: e.target.value || null })}
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input type="checkbox" checked={value.featuredNew} onChange={(e) => onChange({ ...value, featuredNew: e.target.checked })} />
        New arrival
      </label>
      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input type="checkbox" checked={value.featuredBest} onChange={(e) => onChange({ ...value, featuredBest: e.target.checked })} />
        Best seller
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="button" onClick={onSave} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500">
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
          Cancel
        </button>
      </div>
    </div>
  );
}
