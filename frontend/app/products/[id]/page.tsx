import { notFound } from "next/navigation";
import { ProductDetailView, PDPProduct } from "@/components/product/product-detail-view";
import { API_BASE_URL } from "@/lib/api-config";

const fallbackProducts: Record<string, PDPProduct> = {
  "2d1a2ead-6453-445d-9de7-b9ede479a4cb": {
    id: "2d1a2ead-6453-445d-9de7-b9ede479a4cb",
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    description: "Two processors and 8 microphones for unprecedented noise cancellation. Superlative call quality with 4 beamforming microphones and AI noise reduction. Up to 30-hour battery life with quick charging.",
    brand: "Sony",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    rating: "4.85",
    reviewCount: 3420,
    badge: "#1 Best Seller",
    originalPrice: "399.99",
    status: "published",
    category: "Audio & Headphones",
    variants: [
      {
        id: "v-1",
        sku: "SONY-XM5-BLK",
        price: "299.99",
        color: "Midnight Black",
        stock: 35,
      },
    ],
  },
  "c5e2e586-421b-42d0-ba83-d841d2bda14f": {
    id: "c5e2e586-421b-42d0-ba83-d841d2bda14f",
    title: "Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard",
    description: "Full CNC machined 6063 aluminum body with double-gasket acoustic mounting. Hot-swappable Keychron K Pro mechanical switches. Connects via Bluetooth 5.1 or ultra-low-latency Type-C wired mode.",
    brand: "Keychron",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    rating: "4.80",
    reviewCount: 960,
    badge: "Popular Pick",
    originalPrice: "219.99",
    status: "published",
    category: "Gaming & Peripherals",
    variants: [
      {
        id: "v-2",
        sku: "KEYCHRON-Q1P-RED",
        price: "189.99",
        color: "Carbon Black",
        stock: 50,
      },
    ],
  },
  "d885ad44-6c7c-43b0-a880-2350b20bb789": {
    id: "d885ad44-6c7c-43b0-a880-2350b20bb789",
    title: "Samsung Odyssey OLED G9 49\" Curved Dual QHD 240Hz Gaming Monitor",
    description: "49\" 1800R curved display wraps around your field of view with Dual QHD resolution (5120 x 1440). Neo Quantum Processor Pro optimizes every frame on the OLED panel for near-instant 0.03ms response time and 240Hz refresh rate.",
    brand: "Samsung",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    rating: "4.70",
    reviewCount: 1100,
    badge: "Save 25%",
    originalPrice: "1799.99",
    status: "published",
    category: "Gaming & Peripherals",
    variants: [
      {
        id: "v-3",
        sku: "SAMS-G9-OLED",
        price: "1349.99",
        size: "49 inch",
        stock: 15,
      },
    ],
  },
};

async function getProduct(id: string): Promise<PDPProduct | null> {
  "use cache";
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.status}`);
    }
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn(`[PDP] Backend unavailable for ${id}, using static fallback:`, error);
    return fallbackProducts[id] || null;
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((p: { id: string }) => ({ id: p.id }));
      }
    }
  } catch {
    // Fallback to static IDs
  }

  return [
    { id: "2d1a2ead-6453-445d-9de7-b9ede479a4cb" },
    { id: "c5e2e586-421b-42d0-ba83-d841d2bda14f" },
    { id: "d885ad44-6c7c-43b0-a880-2350b20bb789" },
  ];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
