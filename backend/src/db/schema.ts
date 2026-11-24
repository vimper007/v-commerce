import { pgTable, pgEnum, timestamp, uuid, varchar, text, numeric, boolean, integer, AnyPgColumn } from "drizzle-orm/pg-core";

// ==========================================
// 1. USERS & ADDRESSES DOMAIN
// ==========================================

export const roleEnum = pgEnum('role', ['customer', 'admin']);

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email').notNull().unique(),
    password: varchar('password').notNull(),
    role: roleEnum('role').default('customer').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const addresses = pgTable('addresses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. PRODUCT CATALOG DOMAIN
// ==========================================

export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
});

export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    brand: varchar('brand', { length: 100 }),
    imageUrl: varchar('image_url', { length: 500 }),
    rating: numeric('rating', { precision: 3, scale: 2 }).default('4.80'),
    reviewCount: integer('review_count').default(120),
    badge: varchar('badge', { length: 50 }),
    originalPrice: numeric('original_price', { precision: 10, scale: 2 }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    status: productStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    size: varchar('size', { length: 50 }),
    color: varchar('color', { length: 50 }),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 3. INVENTORY DOMAIN (1:1 with Variant)
// ==========================================

export const inventory = pgTable('inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    variantId: uuid('variant_id').notNull().unique().references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    reserved: integer('reserved').notNull().default(0), // Reserved for items in active checkout
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 4. ORDERS & TRANSACTIONS DOMAIN
// ==========================================

export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'shipped', 'cancelled', 'refunded']);

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    status: orderStatusEnum('status').default('pending').notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    shippingAddressId: uuid('shipping_address_id').references(() => addresses.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'restrict' }),
    priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
});

// ==========================================
// 5. WEBHOOK IDEMPOTENCY & AUDIT
// ==========================================

export const webhookEvents = pgTable('webhook_events', {
    id: varchar('id', { length: 255 }).primaryKey(), // provider event id (e.g. evt_...)
    type: varchar('type', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('processed'),
    payload: text('payload'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
 