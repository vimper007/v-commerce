import { StorefrontCatalog, CatalogProduct } from "@/components/storefront/storefront-catalog";
import { API_BASE_URL } from "@/lib/api-config";

async function getProducts(): Promise<CatalogProduct[]> {
  "use cache";
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn("Backend offline or unreachable, using fallback preview data:", error);
    return [
      {
        id: "2d1a2ead-6453-445d-9de7-b9ede479a4cb",
        title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
        description: "Studio-grade acoustics with 30-hour active noise cancellation and AI beamforming calls.",
        brand: "Sony",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        rating: "4.85",
        reviewCount: 3420,
        badge: "#1 Best Seller",
        originalPrice: "399.99",
        status: "published",
        category: "Audio & Headphones",
        categorySlug: "audio",
        variantId: "v-1",
        price: "299.99",
        sku: "SONY-XM5-BLK",
        stock: 35,
        color: "Midnight Black",
      },
      {
        id: "c5e2e586-421b-42d0-ba83-d841d2bda14f",
        title: "Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard",
        description: "Full CNC aluminum body, hot-swappable switches, and double-gasket acoustic dampening.",
        brand: "Keychron",
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
        rating: "4.80",
        reviewCount: 960,
        badge: "Popular Pick",
        originalPrice: "219.99",
        status: "published",
        category: "Gaming & Peripherals",
        categorySlug: "gaming",
        variantId: "v-2",
        price: "189.99",
        sku: "KEYCHRON-Q1P-RED",
        stock: 50,
        color: "Carbon Black",
      },
      {
        id: "d885ad44-6c7c-43b0-a880-2350b20bb789",
        title: "Samsung Odyssey OLED G9 49\" Curved Dual QHD 240Hz Gaming Monitor",
        description: "0.03ms response time, 240Hz refresh rate, and Neo Quantum Processor Pro optimization.",
        brand: "Samsung",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
        rating: "4.70",
        reviewCount: 1100,
        badge: "Save 25%",
        originalPrice: "1799.99",
        status: "published",
        category: "Gaming & Peripherals",
        categorySlug: "gaming",
        variantId: "v-3",
        price: "1349.99",
        sku: "SAMS-G9-OLED",
        stock: 15,
        size: "49 inch",
      },
    ];
  }
}

export default async function Home() {
  const products = await getProducts();
  return <StorefrontCatalog initialProducts={products} />;
}
