import { getRedis } from "./redis-client.js";
import * as store from "./redis-store.js";
import type { StoredProduct } from "./types.js";

function img(slug: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/800/800`;
}

const catRows = [
  { id: "cat_accessories", slug: "accessories", name: "Accessories" },
  { id: "cat_gadgets", slug: "gadgets", name: "Gadgets" },
  { id: "cat_gift", slug: "gift-items", name: "Gift Items" },
  { id: "cat_medicine", slug: "medicine", name: "Medicine" },
  { id: "cat_punjabi", slug: "punjabi", name: "Punjabi" },
] as const;

type CatSlug = (typeof catRows)[number]["slug"];

const productDefs: {
  id: string;
  slug: string;
  category: CatSlug;
  name: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  badges: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featuredNew?: boolean;
  featuredBest?: boolean;
}[] = [
  {
    id: "p_charger_120w",
    slug: "120w-6a-3in1-cable",
    category: "accessories",
    name: "120W 6A High-speed 3 in 1 Charger Cable (Type-C / Micro / Lightning), 180° rotatable",
    description: "Reinforced connectors, fast-charge friendly, tangle-resistant weave — desk and travel ready.",
    priceCents: 890_00,
    compareAtCents: 1290_00,
    badges: ["New", "Fast charge"],
    stock: 120,
    rating: 4.8,
    reviewCount: 312,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_turbo_fan",
    slug: "ultra-premium-turbo-fan-1800",
    category: "gadgets",
    name: "Ultra Premium Portable Turbo Fan | 1800mAh",
    description: "Quiet blades, three speeds, USB-C charging, and a premium metal finish.",
    priceCents: 2490_00,
    compareAtCents: 3190_00,
    badges: ["Bestseller"],
    stock: 64,
    rating: 4.7,
    reviewCount: 540,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_bamboo_toothpaste",
    slug: "clever-doctor-bamboo-charcoal-toothpaste",
    category: "medicine",
    name: "Clever Doctor Bamboo Charcoal Toothpaste",
    description: "Charcoal polish with a fresh mint finish — daily care routine staple.",
    priceCents: 390_00,
    badges: ["Wellness"],
    stock: 400,
    rating: 4.4,
    reviewCount: 980,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_mini_fan_usb",
    slug: "portable-mini-fan-usb-2000mah",
    category: "gadgets",
    name: "Portable Mini Fan — USB, 3 speeds, 2000mAh power bank",
    description: "Pocketable breeze with a built-in battery bank for phones in a pinch.",
    priceCents: 1590_00,
    compareAtCents: 1990_00,
    badges: ["Combo"],
    stock: 88,
    rating: 4.5,
    reviewCount: 210,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_clip_fan",
    slug: "portable-rechargeable-clip-fan",
    category: "gadgets",
    name: "Portable Rechargeable Clip Fan — stay cool anywhere",
    description: "Clip to strollers, desks, or gym equipment — wide oscillation, long runtime.",
    priceCents: 1890_00,
    badges: ["Outdoor"],
    stock: 72,
    rating: 4.6,
    reviewCount: 164,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_rayhong_coating",
    slug: "rayhong-plastic-coating-premium",
    category: "accessories",
    name: "Rayhong Plastic Coating (Premium)",
    description: "Restores shine on automotive trim and household plastics.",
    priceCents: 990_00,
    badges: ["Pro"],
    stock: 55,
    rating: 4.3,
    reviewCount: 92,
    featuredBest: true,
  },
  {
    id: "p_mini_iron",
    slug: "mini-dry-iron-with-spray",
    category: "gadgets",
    name: "Mini Dry Iron with Spray",
    description: "Travel iron with micro spray — smooths collars and linen on the go.",
    priceCents: 2190_00,
    badges: ["Travel"],
    stock: 40,
    rating: 4.2,
    reviewCount: 74,
    featuredBest: true,
  },
  {
    id: "p_cable_box",
    slug: "data-cable-storage-box-60w",
    category: "accessories",
    name: "Data Cable Storage Box — 60W fast charging hub",
    description: "Keeps cables routed while delivering up to 60W when paired with PD bricks.",
    priceCents: 1390_00,
    compareAtCents: 1690_00,
    badges: ["Desk"],
    stock: 95,
    rating: 4.5,
    reviewCount: 201,
    featuredNew: true,
    featuredBest: true,
  },
  {
    id: "p_lipoma_spray",
    slug: "lipoma-removal-spray",
    category: "medicine",
    name: "Lipoma Removal Spray",
    description: "Topical spray marketed for firm bump areas — always follow label guidance.",
    priceCents: 1290_00,
    badges: ["Topical"],
    stock: 33,
    rating: 4.0,
    reviewCount: 58,
    featuredBest: true,
  },
  {
    id: "p_propolis_ointment",
    slug: "sol-lora-propolis-pain-relief",
    category: "medicine",
    name: "SOL LORA Propolis Pain Relief Ointment",
    description: "Soothing propolis blend for minor muscle and joint discomfort.",
    priceCents: 790_00,
    badges: ["Relief"],
    stock: 150,
    rating: 4.5,
    reviewCount: 412,
    featuredBest: true,
  },
  {
    id: "p_smart_light",
    slug: "smart-light-controller",
    category: "gadgets",
    name: "Smart Light Controller",
    description: "Schedules, scenes, and voice-assistant friendly automations out of the box.",
    priceCents: 1790_00,
    compareAtCents: 2290_00,
    badges: ["Smart home"],
    stock: 60,
    rating: 4.6,
    reviewCount: 188,
    featuredBest: true,
  },
  {
    id: "p_embroidery_punjabi",
    slug: "premium-embroidered-punjabi",
    category: "punjabi",
    name: "Premium Embroidered Punjabi — breathable cotton",
    description: "Tailored fit with contrast threadwork — event ready without the fuss.",
    priceCents: 3490_00,
    compareAtCents: 4290_00,
    badges: ["Apparel"],
    stock: 28,
    rating: 4.9,
    reviewCount: 64,
    featuredNew: true,
  },
  {
    id: "p_gift_bundle",
    slug: "curated-gift-bundle",
    category: "gift-items",
    name: "Curated Gift Bundle — fan + cable + pouch",
    description: "A ready-to-wrap trio for students and commuters.",
    priceCents: 2990_00,
    badges: ["Gift"],
    stock: 45,
    rating: 4.7,
    reviewCount: 120,
    featuredNew: true,
  },
];

async function main() {
  await getRedis();
  const existing = await store.exportAll();
  for (const p of existing.products) await store.deleteProduct(p.id);
  for (const c of existing.categories) {
    const r = await store.deleteCategory(c.id);
    if (!r.ok) console.warn(`Category ${c.id}: ${r.reason}`);
  }

  for (const c of catRows) {
    await store.saveCategory({ id: c.id, slug: c.slug, name: c.name });
  }

  const now = Date.now();
  for (const p of productDefs) {
    const cat = catRows.find((x) => x.slug === p.category);
    if (!cat) throw new Error(`Missing category ${p.category}`);
    const row: StoredProduct = {
      id: p.id,
      slug: p.slug,
      categoryId: cat.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents ?? null,
      currency: "BDT",
      imageUrl: img(p.slug),
      badges: p.badges,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featuredNew: p.featuredNew ?? false,
      featuredBest: p.featuredBest ?? false,
      createdAt: now,
    };
    await store.saveProduct(row);
  }

  const after = await store.exportAll();
  console.log(`Seeded ${after.products.length} products and ${after.categories.length} categories.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
