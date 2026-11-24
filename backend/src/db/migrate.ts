import { pool, db } from './db';
import { categories, products, productVariants, inventory } from './schema';
import { eq, isNull } from 'drizzle-orm';

const CATALOG_DATA = [
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
      { sku: 'SONY-XM5-BLK', price: '299.99', color: 'Midnight Black', stock: 45 },
      { sku: 'SONY-XM5-SLV', price: '299.99', color: 'Platinum Silver', stock: 25 },
    ],
  },
  {
    title: 'Apple AirPods Pro (2nd Generation) Wireless Earbuds with USB-C',
    brand: 'Apple',
    description: 'Up to 2x more Active Noise Cancellation. Transparency mode lets outside sound in. Personalized Spatial Audio with dynamic head tracking. MagSafe Case (USB-C) with speaker and lanyard loop.',
    categorySlug: 'audio',
    categoryName: 'Audio & Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
    rating: '4.90',
    reviewCount: 8950,
    badge: "Amazon's Choice",
    originalPrice: '249.00',
    variants: [
      { sku: 'APP-AIRPOD-PRO2', price: '189.99', color: 'White', stock: 60 },
    ],
  },
  {
    title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Over-Ear Headphones',
    brand: 'Bose',
    description: 'Breakthrough spatialized audio for more immersive listening. World-class Active Noise Cancelling and CustomTune technology for personalized sound shaped to your ears.',
    categorySlug: 'audio',
    categoryName: 'Audio & Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    rating: '4.75',
    reviewCount: 1820,
    badge: 'Limited Deal',
    originalPrice: '429.00',
    variants: [
      { sku: 'BOSE-QC-ULTRA-BLK', price: '379.00', color: 'Black', stock: 20 },
      { sku: 'BOSE-QC-ULTRA-WHT', price: '379.00', color: 'White Smoke', stock: 15 },
    ],
  },
  {
    title: 'Apple MacBook Pro 16" (M3 Max Chip, 36GB Unified Memory, 1TB SSD)',
    brand: 'Apple',
    description: 'With a 14-core CPU and 30-core GPU, the M3 Max chip delivers blistering performance for extreme workflows. Liquid Retina XDR display with 1000 nits sustained brightness.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    rating: '4.92',
    reviewCount: 1420,
    badge: '#1 Best Seller',
    originalPrice: '3499.00',
    variants: [
      { sku: 'MBP-16-M3MAX-BLK', price: '3199.00', color: 'Space Black', size: '16 inch', stock: 12 },
      { sku: 'MBP-16-M3MAX-SLV', price: '3199.00', color: 'Silver', size: '16 inch', stock: 8 },
    ],
  },
  {
    title: 'Dell XPS 15 9530 (15.6" 3.5K OLED Touchscreen, Intel i9-13900H, RTX 4070)',
    brand: 'Dell',
    description: 'Stunning 3.5K OLED InfinityEdge display with 100% DCI-P3 color. Powered by 13th Gen Intel Core i9 and NVIDIA GeForce RTX 4070 8GB GDDR6 graphics.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
    rating: '4.65',
    reviewCount: 840,
    badge: 'Save $300',
    originalPrice: '2299.00',
    variants: [
      { sku: 'DELL-XPS15-OLED', price: '1999.00', color: 'Platinum Silver', size: '15.6 inch', stock: 14 },
    ],
  },
  {
    title: 'Logitech MX Master 3S Wireless Performance Mouse with Quiet Clicks',
    brand: 'Logitech',
    description: '8000 DPI track-on-glass optical sensor with quiet click switches that deliver a satisfying tactile feel with 90% less click noise. MagSpeed electromagnetic scrolling.',
    categorySlug: 'computing',
    categoryName: 'Computers & Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    rating: '4.88',
    reviewCount: 12400,
    badge: "Amazon's Choice",
    originalPrice: '109.99',
    variants: [
      { sku: 'LOGI-MXM3S-GRPH', price: '99.99', color: 'Graphite', stock: 80 },
      { sku: 'LOGI-MXM3S-GRY', price: '99.99', color: 'Pale Gray', stock: 45 },
    ],
  },
  {
    title: 'Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard',
    brand: 'Keychron',
    description: 'Full CNC machined 6063 aluminum body with double-gasket acoustic mounting. Hot-swappable Keychron K Pro mechanical switches. Bluetooth 5.1 or wired Type-C.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    rating: '4.80',
    reviewCount: 960,
    badge: 'Popular Pick',
    originalPrice: '219.99',
    variants: [
      { sku: 'KEYCHRON-Q1P-RED', price: '189.99', color: 'Carbon Black (Red Switch)', stock: 30 },
      { sku: 'KEYCHRON-Q1P-BRN', price: '189.99', color: 'Shell White (Brown Switch)', stock: 25 },
    ],
  },
  {
    title: 'Samsung Odyssey OLED G9 49" Curved Dual QHD 240Hz 0.03ms Gaming Monitor',
    brand: 'Samsung',
    description: '49" 1800R curved display wraps around your field of view with Dual QHD resolution (5120 x 1440). Neo Quantum Processor Pro optimizes every frame on the OLED panel.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    rating: '4.70',
    reviewCount: 1100,
    badge: 'Save 25%',
    originalPrice: '1799.99',
    variants: [
      { sku: 'SAMS-G9-OLED', price: '1349.99', size: '49 inch', stock: 10 },
    ],
  },
  {
    title: 'SteelSeries Arctis Nova Pro Wireless Multi-System Gaming Headset',
    brand: 'SteelSeries',
    description: 'Almighty Audio with premium high fidelity drivers and 360 Spatial Audio. Active Noise Cancellation with 4-mic hybrid system. Hot-swappable battery system.',
    categorySlug: 'gaming',
    categoryName: 'Gaming & Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    rating: '4.78',
    reviewCount: 2150,
    badge: "Amazon's Choice",
    originalPrice: '349.99',
    variants: [
      { sku: 'STEEL-NOVA-PRO', price: '299.99', color: 'Stealth Black', stock: 22 },
    ],
  },
  {
    title: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium Case)',
    brand: 'Apple',
    description: 'Rugged and capable titanium case with 3000-nit display. Dual-frequency GPS and advanced metric tracking for athletes and outdoor explorers.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    rating: '4.90',
    reviewCount: 4200,
    badge: '#1 Best Seller',
    originalPrice: '799.00',
    variants: [
      { sku: 'AW-ULTRA2-ORG', price: '749.00', color: 'Orange Ocean Band', size: '49mm', stock: 18 },
      { sku: 'AW-ULTRA2-BLU', price: '749.00', color: 'Blue Alpine Loop', size: '49mm', stock: 14 },
    ],
  },
  {
    title: 'Sonos Era 300 Spatial Audio Smart Speaker with Dolby Atmos',
    brand: 'Sonos',
    description: 'Featuring six optimally positioned drivers all around the front, sides, and top to support Dolby Atmos Music, projecting sound from wall to wall.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    rating: '4.82',
    reviewCount: 1650,
    badge: "Amazon's Choice",
    originalPrice: '449.00',
    variants: [
      { sku: 'SONOS-ERA300-BLK', price: '399.00', color: 'Matte Black', stock: 25 },
      { sku: 'SONOS-ERA300-WHT', price: '399.00', color: 'Matte White', stock: 20 },
    ],
  },
  {
    title: 'Kindle Paperwhite Signature Edition (32 GB) with Wireless Charging',
    brand: 'Amazon',
    description: 'Wireless charging, auto-adjusting front light, and 32 GB storage. 300 ppi glare-free display that reads like real paper in bright sunlight.',
    categorySlug: 'wearables',
    categoryName: 'Smart Tech & Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    rating: '4.86',
    reviewCount: 15300,
    badge: '#1 Best Seller',
    originalPrice: '189.99',
    variants: [
      { sku: 'KINDLE-SIG-BLK', price: '149.99', color: 'Black', stock: 50 },
      { sku: 'KINDLE-SIG-GRN', price: '149.99', color: 'Agave Green', stock: 35 },
    ],
  },
];

export async function runMigrations() {
  const client = await pool.connect();
  try {
    // 1. Enums
    await client.query(`
      DO $$ BEGIN CREATE TYPE role AS ENUM ('customer', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role role NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(2) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        brand VARCHAR(100),
        image_url VARCHAR(500),
        rating NUMERIC(3, 2) DEFAULT 4.80,
        review_count INTEGER DEFAULT 120,
        badge VARCHAR(50),
        original_price NUMERIC(10, 2),
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        status product_status NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) NOT NULL UNIQUE,
        price NUMERIC(10, 2) NOT NULL,
        size VARCHAR(50),
        color VARCHAR(50),
        image_url VARCHAR(500),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        reserved INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status order_status NOT NULL DEFAULT 'pending',
        total_amount NUMERIC(10, 2) NOT NULL,
        shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
        price_at_purchase NUMERIC(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS webhook_events (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'processed',
        payload TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('[Migration] Database schema tables and enums verified/created successfully.');

    // 3. Auto-seed if empty
    const checkRes = await client.query('SELECT COUNT(*) as count FROM products WHERE status = \'published\'');
    const productCount = parseInt(checkRes.rows[0]?.count || '0', 10);

    if (productCount === 0) {
      console.log('[Migration] Empty product catalog detected. Auto-seeding 12 commercial products...');
      await autoSeedCatalog();
      console.log('[Migration] Auto-seeding finished.');
    } else {
      console.log(`[Migration] Existing product catalog found (${productCount} published items). Skipping seed.`);
    }
  } catch (error) {
    console.error('[Migration] Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function autoSeedCatalog() {
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
          .values({ name: item.categoryName, slug: item.categorySlug })
          .returning();
        categoryMap.set(item.categorySlug, inserted.id);
      }
    }
  }

  for (const item of CATALOG_DATA) {
    const categoryId = categoryMap.get(item.categorySlug);
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

    for (const v of item.variants) {
      const [newVar] = await db
        .insert(productVariants)
        .values({
          productId: newProd.id,
          sku: v.sku,
          price: v.price,
          color: v.color || null,
          size: (v as any).size || null,
          imageUrl: item.imageUrl,
        })
        .returning();

      await db.insert(inventory).values({
        variantId: newVar.id,
        quantity: v.stock,
        reserved: 0,
      });
    }
  }
}
