import 'dotenv/config';
import { eq, isNull } from 'drizzle-orm';
import { db, pool } from './db';
import { categories, products, productVariants, inventory } from './schema';

interface SeedProduct {
  title: string;
  brand: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string;
  rating: string;
  reviewCount: number;
  badge?: string;
  originalPrice?: string;
  variants: Array<{
    sku: string;
    price: string;
    color?: string;
    size?: string;
    stock: number;
    imageUrl?: string;
  }>;
}

const CATALOG_DATA: SeedProduct[] = [
  {
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
    brand: 'Sony',
    description: 'Two processors and 8 microphones for unprecedented noise cancellation. Superlative call quality with 4 beamforming microphones and AI noise reduction. Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback).',
    categorySlug: 'audio',
    categoryName: 'Audio & Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    rating: '4.85',
    reviewCount: 3420,
    badge: '#1 Best Seller',
    originalPrice: '399.99',
    variants: [
      {
        sku: 'SONY-XM5-BLK',
        price: '299.99',
        color: 'Midnight Black',
        stock: 45,
      },
      {
        sku: 'SONY-XM5-SLV',
        price: '299.99',
        color: 'Platinum Silver',
        stock: 25,
      },
    ],
  },
  {
    title: 'Apple AirPods Pro (2nd Generation) Wireless Earbuds with USB-C',
    brand: 'Apple',
    description: 'Up to 2x more Active Noise Cancellation. Transparency mode lets outside sound in, so you can hear what is going on around you. Personalized Spatial Audio with dynamic head tracking places sound all around you. MagSafe Case (USB-C) with speaker and lanyard loop.',
    categorySlug: 'audio',
    categoryName: 'Audio & Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
    rating: '4.90',
    reviewCount: 8950,
    badge: "Amazon's Choice",
    originalPrice: '249.00',
    variants: [
      {
        sku: 'APP-AIRPOD-PRO2',
        price: '189.99',
        color: 'White',
        stock: 60,
      },
    ],
  },
  {
    title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Over-Ear Headphones',
    brand: 'Bose',
    description: 'Breakthrough spatialized audio for more immersive listening that makes your music feel realer than ever before. World-class Active Noise Cancelling and CustomTune technology for personalized sound shaped to your ears.',
    categorySlug: 'audio',
    categoryName: 'Audio & Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    rating: '4.75',
    reviewCount: 1820,
    badge: 'Limited Deal',
    originalPrice: '429.00',
    variants: [
      {
        sku: 'BOSE-QC-ULTRA-BLK',
        price: '379.00',
        color: 'Black',
        stock: 20,
      },
      {
        sku: 'BOSE-QC-ULTRA-WHT',
        price: '379.00',
        color: 'White Smoke',
        stock: 15,
      },
    ],
  },
  {
    title: 'Apple MacBook Pro 16" (M3 Max Chip, 36GB Unified Memory, 1TB SSD)',
    brand: 'Apple',
    description: 'With a 14-core CPU and 30-core GPU, the M3 Max chip delivers blistering performance for extreme workflows like rendering intricate 3D content or developing transformer models. Liquid Retina XDR display with 1000 nits sustained brightness.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    rating: '4.92',
    reviewCount: 1420,
    badge: '#1 Best Seller',
    originalPrice: '3499.00',
    variants: [
      {
        sku: 'MBP-16-M3MAX-BLK',
        price: '3199.00',
        color: 'Space Black',
        size: '16 inch',
        stock: 12,
      },
      {
        sku: 'MBP-16-M3MAX-SLV',
        price: '3199.00',
        color: 'Silver',
        size: '16 inch',
        stock: 8,
      },
    ],
  },
  {
    title: 'Dell XPS 15 9530 (15.6" 3.5K OLED Touchscreen, Intel i9-13900H, RTX 4070)',
    brand: 'Dell',
    description: 'Stunning 3.5K OLED InfinityEdge display with 100% DCI-P3 color. Powered by 13th Gen Intel Core i9 and NVIDIA GeForce RTX 4070 8GB GDDR6 graphics. Precision-machined aluminum chassis with carbon fiber palm rest.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
    rating: '4.65',
    reviewCount: 840,
    badge: 'Save $300',
    originalPrice: '2299.00',
    variants: [
      {
        sku: 'DELL-XPS15-OLED',
        price: '1999.00',
        color: 'Platinum Silver',
        size: '15.6 inch',
        stock: 14,
      },
    ],
  },
  {
    title: 'Logitech MX Master 3S Wireless Performance Mouse with Quiet Clicks',
    brand: 'Logitech',
    description: '8000 DPI track-on-glass optical sensor with quiet click switches that deliver a satisfying tactile feel with 90% less click noise. MagSpeed electromagnetic scrolling delivers 1,000 lines per second in near silence.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    rating: '4.88',
    reviewCount: 12400,
    badge: "Amazon's Choice",
    originalPrice: '109.99',
    variants: [
      {
        sku: 'LOGI-MXM3S-GRPH',
        price: '99.99',
        color: 'Graphite',
        stock: 80,
      },
      {
        sku: 'LOGI-MXM3S-GRY',
        price: '99.99',
        color: 'Pale Gray',
        stock: 45,
      },
    ],
  },
  {
    title: 'Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard',
    brand: 'Keychron',
    description: 'Full CNC machined 6063 aluminum body with double-gasket acoustic mounting. Hot-swappable Keychron K Pro mechanical switches. Connects via Bluetooth 5.1 or ultra-low-latency Type-C wired mode.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    rating: '4.80',
    reviewCount: 960,
    badge: 'Popular Pick',
    originalPrice: '219.99',
    variants: [
      {
        sku: 'KEYCHRON-Q1P-RED',
        price: '189.99',
        color: 'Carbon Black (Red Switch)',
        stock: 30,
      },
      {
        sku: 'KEYCHRON-Q1P-BRN',
        price: '189.99',
        color: 'Shell White (Brown Switch)',
        stock: 25,
      },
    ],
  },
  {
    title: 'Samsung Odyssey OLED G9 49" Curved Dual QHD 240Hz 0.03ms Gaming Monitor',
    brand: 'Samsung',
    description: '49" 1800R curved display wraps around your field of view with Dual QHD resolution (5120 x 1440). Neo Quantum Processor Pro optimizes every frame on the OLED panel for near-instant 0.03ms response time and 240Hz refresh rate.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    rating: '4.70',
    reviewCount: 1100,
    badge: 'Save 25%',
    originalPrice: '1799.99',
    variants: [
      {
        sku: 'SAMS-G9-OLED',
        price: '1349.99',
        size: '49 inch',
        stock: 10,
      },
    ],
  },
  {
    title: 'SteelSeries Arctis Nova Pro Wireless Multi-System Gaming Headset',
    brand: 'SteelSeries',
    description: 'Almighty Audio with premium high fidelity drivers and 360 Spatial Audio. Active Noise Cancellation with 4-mic hybrid system. Infinity Power System with 2 hot-swappable batteries for non-stop gaming sessions.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    rating: '4.78',
    reviewCount: 2150,
    badge: "Amazon's Choice",
    originalPrice: '349.99',
    variants: [
      {
        sku: 'STEEL-NOVA-PRO',
        price: '299.99',
        color: 'Stealth Black',
        stock: 22,
      },
    ],
  },
  {
    title: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium Case)',
    brand: 'Apple',
    description: 'Rugged and capable, built to meet the demands of endurance athletes, outdoor adventurers, and water sports enthusiasts. The S9 SiP enables a supersunlight-readable 3000-nit display and a magical new double-tap gesture.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    rating: '4.90',
    reviewCount: 4200,
    badge: '#1 Best Seller',
    originalPrice: '799.00',
    variants: [
      {
        sku: 'AW-ULTRA2-ORG',
        price: '749.00',
        color: 'Orange Ocean Band',
        size: '49mm',
        stock: 18,
      },
      {
        sku: 'AW-ULTRA2-BLU',
        price: '749.00',
        color: 'Blue Alpine Loop',
        size: '49mm',
        stock: 14,
      },
    ],
  },
  {
    title: 'Sonos Era 300 Spatial Audio Smart Speaker with Dolby Atmos',
    brand: 'Sonos',
    description: 'Featuring six optimally positioned drivers all around the front, sides, and top to support Dolby Atmos Music, the breakthrough acoustic design projects sound from wall to wall and floor to ceiling, immersing you in every dimension of the song.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    rating: '4.82',
    reviewCount: 1650,
    badge: "Amazon's Choice",
    originalPrice: '449.00',
    variants: [
      {
        sku: 'SONOS-ERA300-BLK',
        price: '399.00',
        color: 'Matte Black',
        stock: 25,
      },
      {
        sku: 'SONOS-ERA300-WHT',
        price: '399.00',
        color: 'Matte White',
        stock: 20,
      },
    ],
  },
  {
    title: 'Kindle Paperwhite Signature Edition (32 GB) with Wireless Charging',
    brand: 'Amazon',
    description: 'Get everything in the Kindle Paperwhite, plus wireless charging, auto-adjusting front light, and 32 GB storage. Purpose-built for reading with a flush-front design and 300 ppi glare-free display that reads like real paper.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    rating: '4.86',
    reviewCount: 15300,
    badge: '#1 Best Seller',
    originalPrice: '189.99',
    variants: [
      {
        sku: 'KINDLE-SIG-BLK',
        price: '149.99',
        color: 'Black',
        stock: 50,
      },
      {
        sku: 'KINDLE-SIG-GRN',
        price: '149.99',
        color: 'Agave Green',
        stock: 35,
      },
    ],
  },
];

async function seed() {
  console.log('[Seed] Seeding complete commercial product catalog...');

  // Archive legacy unbranded placeholders
  await db.update(products).set({ status: 'archived' }).where(isNull(products.brand));

  // 1. Categories
  const categoryMap = new Map<string, string>();
  for (const item of CATALOG_DATA) {
    if (!categoryMap.has(item.categorySlug)) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, item.categorySlug))
        .limit(1);

      if (existing.length > 0) {
        categoryMap.set(item.categorySlug, existing[0].id);
      } else {
        const [inserted] = await db
          .insert(categories)
          .values({
            name: item.categoryName,
            slug: item.categorySlug,
          })
          .returning();
        categoryMap.set(item.categorySlug, inserted.id);
        console.log(`[Seed] Created category "${item.categoryName}"`);
      }
    }
  }

  // 2. Products and variants
  for (const item of CATALOG_DATA) {
    const categoryId = categoryMap.get(item.categorySlug);

    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.title, item.title))
      .limit(1);

    let productId: string;

    if (existingProduct) {
      productId = existingProduct.id;
      await db
        .update(products)
        .set({
          brand: item.brand,
          imageUrl: item.imageUrl,
          rating: item.rating,
          reviewCount: item.reviewCount,
          badge: item.badge || null,
          originalPrice: item.originalPrice || null,
          description: item.description,
          status: 'published',
          categoryId: categoryId || null,
        })
        .where(eq(products.id, productId));
      console.log(`[Seed] Updated product "${item.title}"`);
    } else {
      const [newProd] = await db
        .insert(products)
        .values({
          title: item.title,
          brand: item.brand,
          imageUrl: item.imageUrl,
          rating: item.rating,
          reviewCount: item.reviewCount,
          badge: item.badge || null,
          originalPrice: item.originalPrice || null,
          description: item.description,
          status: 'published',
          categoryId: categoryId || null,
        })
        .returning();
      productId = newProd.id;
      console.log(`[Seed] Inserted product "${item.title}"`);
    }

    // Variants and Inventory
    for (const v of item.variants) {
      const [existingVar] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.sku, v.sku))
        .limit(1);

      let variantId: string;
      if (existingVar) {
        variantId = existingVar.id;
        await db
          .update(productVariants)
          .set({
            price: v.price,
            color: v.color || null,
            size: v.size || null,
            imageUrl: v.imageUrl || item.imageUrl,
          })
          .where(eq(productVariants.id, variantId));
      } else {
        const [newVar] = await db
          .insert(productVariants)
          .values({
            productId,
            sku: v.sku,
            price: v.price,
            color: v.color || null,
            size: v.size || null,
            imageUrl: v.imageUrl || item.imageUrl,
          })
          .returning();
        variantId = newVar.id;
      }

      // Inventory
      const [existingInv] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, variantId))
        .limit(1);

      if (existingInv) {
        await db
          .update(inventory)
          .set({
            quantity: v.stock,
            reserved: 0,
          })
          .where(eq(inventory.id, existingInv.id));
      } else {
        await db.insert(inventory).values({
          variantId,
          quantity: v.stock,
          reserved: 0,
        });
      }
    }
  }

  console.log('[Seed] 12 Enterprise-Grade Commercial Products Seeded Successfully.');
  await pool.end();
}

seed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
