import { Request, Response } from 'express';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '../db/db';
import { products, productVariants, categories, inventory } from '../db/schema';

export async function getAllProducts(req: Request, res: Response): Promise<void> {
  try {
    const allProducts = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        brand: products.brand,
        imageUrl: products.imageUrl,
        rating: products.rating,
        reviewCount: products.reviewCount,
        badge: products.badge,
        originalPrice: products.originalPrice,
        status: products.status,
        createdAt: products.createdAt,
        category: categories.name,
        categorySlug: categories.slug,
        variantId: productVariants.id,
        price: productVariants.price,
        sku: productVariants.sku,
        color: productVariants.color,
        size: productVariants.size,
        stock: inventory.quantity,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
      .where(and(eq(products.status, 'published'), isNotNull(products.brand)));

    res.json({
      success: true,
      data: allProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getProductById(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Valid Product ID is required' });
      return;
    }

    const [product] = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        brand: products.brand,
        imageUrl: products.imageUrl,
        rating: products.rating,
        reviewCount: products.reviewCount,
        badge: products.badge,
        originalPrice: products.originalPrice,
        status: products.status,
        createdAt: products.createdAt,
        categoryId: products.categoryId,
        category: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const variants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        price: productVariants.price,
        size: productVariants.size,
        color: productVariants.color,
        imageUrl: productVariants.imageUrl,
        stock: inventory.quantity,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
      .where(eq(productVariants.productId, id));

    res.json({
      success: true,
      data: {
        ...product,
        variants,
      },
    });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, categoryId, status, price, sku } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        title,
        description,
        categoryId: categoryId || null,
        status: status || 'published',
      })
      .returning();

    if (price && sku) {
      const [newVariant] = await db
        .insert(productVariants)
        .values({
          productId: newProduct.id,
          sku,
          price: price.toString(),
        })
        .returning();

      res.status(201).json({
        success: true,
        data: {
          ...newProduct,
          variants: [newVariant],
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
}
