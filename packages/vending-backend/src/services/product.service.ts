/**
 * Product & Inventory Management Service
 * Handles product catalogue retrieval, category/brand filtering, and slot stock querying.
 * Satisfies Rule 4 (Clean Architecture) and Rule 8 (Input Bounds).
 */

import { Db } from 'mongodb';
import { Product, ProductVariant, InventorySlot, DiaperCategory, DiaperSize } from '@sdds/shared';
import { NotFoundError } from '@sdds/shared';

export interface ProductCatalogueItem extends Product {
  variants: ProductVariant[];
}

export class ProductService {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Retrieves active products filtered by category and optional brand/size.
   */
  public async getCatalogue(category?: DiaperCategory, size?: DiaperSize): Promise<ProductCatalogueItem[]> {
    const productQuery: Record<string, unknown> = { isActive: true };
    if (category) {
      productQuery.category = category;
    }

    const products = await this.db.collection<Product>('products').find(productQuery).toArray();
    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((p) => p._id);
    const variantQuery: Record<string, unknown> = { productId: { $in: productIds } };
    if (size) {
      variantQuery.size = size;
    }

    const variants = await this.db.collection<ProductVariant>('product_variants').find(variantQuery).toArray();

    // Group variants under their respective products
    const variantMap = new Map<string, ProductVariant[]>();
    for (const v of variants) {
      const existing = variantMap.get(v.productId) || [];
      existing.push(v);
      variantMap.set(v.productId, existing);
    }

    return products
      .map((p) => ({
        ...p,
        variants: variantMap.get(p._id) || [],
      }))
      .filter((p) => p.variants.length > 0);
  }

  /**
   * Retrieves single product variant with associated slot inventory.
   */
  public async getVariantWithInventory(variantId: string, machineId: string): Promise<{ variant: ProductVariant; slot: InventorySlot }> {
    const variant = await this.db.collection<ProductVariant>('product_variants').findOne({ _id: variantId });
    if (!variant) {
      throw new NotFoundError('Product variant', variantId);
    }

    const slot = await this.db.collection<InventorySlot>('inventory').findOne({
      machineId,
      productVariantId: variantId,
      isOperational: true,
    });

    if (!slot) {
      throw new NotFoundError('Inventory slot for variant', variantId);
    }

    return { variant, slot };
  }

  /**
   * Seeds demo data (Baby & Adult diapers) if the database is initially empty.
   */
  public async seedDefaultCatalogueIfEmpty(machineId: string): Promise<void> {
    const count = await this.db.collection('products').countDocuments();
    if (count > 0) return;

    const sampleProducts: Product[] = [
      {
        _id: 'PROD-BABY-01',
        name: 'MamyPoko Pants Standard',
        brand: 'MamyPoko',
        category: 'baby',
        description: 'Extra absorb diaper pants for all-night dryness and baby comfort.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'PROD-BABY-02',
        name: 'Pampers Active Baby Diapers',
        brand: 'Pampers',
        category: 'baby',
        description: 'Magic gel channels with 12-hour leak lock protection.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'PROD-ADULT-01',
        name: 'Friends Premium Adult Diaper Pants',
        brand: 'Friends',
        category: 'adult',
        description: 'High absorbency overnight incontinence protection with wetness indicator.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'PROD-ADULT-02',
        name: 'Kare In Adult Diapers Briefs',
        brand: 'Kare In',
        category: 'adult',
        description: 'Soft breathable cottony feel with odor neutralization technology.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sampleVariants: ProductVariant[] = [
      {
        _id: 'VAR-BABY-01-S',
        productId: 'PROD-BABY-01',
        sku: 'MAMPY-S-10',
        size: 'S',
        packQuantity: 10,
        price: 180,
        imageUrl: '/images/products/baby-mampy-s.png',
        inStock: true,
        totalAvailableStock: 15,
      },
      {
        _id: 'VAR-BABY-01-M',
        productId: 'PROD-BABY-01',
        sku: 'MAMPY-M-10',
        size: 'M',
        packQuantity: 10,
        price: 220,
        imageUrl: '/images/products/baby-mampy-m.png',
        inStock: true,
        totalAvailableStock: 12,
      },
      {
        _id: 'VAR-BABY-02-L',
        productId: 'PROD-BABY-02',
        sku: 'PAMP-L-10',
        size: 'L',
        packQuantity: 10,
        price: 260,
        imageUrl: '/images/products/baby-pampers-l.png',
        inStock: true,
        totalAvailableStock: 8,
      },
      {
        _id: 'VAR-ADULT-01-M',
        productId: 'PROD-ADULT-01',
        sku: 'FRNDS-M-10',
        size: 'M',
        packQuantity: 10,
        price: 450,
        imageUrl: '/images/products/adult-friends-m.png',
        inStock: true,
        totalAvailableStock: 10,
      },
      {
        _id: 'VAR-ADULT-01-L',
        productId: 'PROD-ADULT-01',
        sku: 'FRNDS-L-10',
        size: 'L',
        packQuantity: 10,
        price: 520,
        imageUrl: '/images/products/adult-friends-l.png',
        inStock: true,
        totalAvailableStock: 6,
      },
      {
        _id: 'VAR-ADULT-02-XL',
        productId: 'PROD-ADULT-02',
        sku: 'KARE-XL-10',
        size: 'XL',
        packQuantity: 10,
        price: 590,
        imageUrl: '/images/products/adult-kare-xl.png',
        inStock: true,
        totalAvailableStock: 5,
      },
    ];

    const sampleSlots: InventorySlot[] = [
      {
        _id: 'SLOT-01',
        machineId,
        slotId: 'SLOT_A1',
        productVariantId: 'VAR-BABY-01-S',
        sku: 'MAMPY-S-10',
        currentQuantity: 15,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
      {
        _id: 'SLOT-02',
        machineId,
        slotId: 'SLOT_A2',
        productVariantId: 'VAR-BABY-01-M',
        sku: 'MAMPY-M-10',
        currentQuantity: 12,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
      {
        _id: 'SLOT-03',
        machineId,
        slotId: 'SLOT_A3',
        productVariantId: 'VAR-BABY-02-L',
        sku: 'PAMP-L-10',
        currentQuantity: 8,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
      {
        _id: 'SLOT-04',
        machineId,
        slotId: 'SLOT_B1',
        productVariantId: 'VAR-ADULT-01-M',
        sku: 'FRNDS-M-10',
        currentQuantity: 10,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
      {
        _id: 'SLOT-05',
        machineId,
        slotId: 'SLOT_B2',
        productVariantId: 'VAR-ADULT-01-L',
        sku: 'FRNDS-L-10',
        currentQuantity: 6,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
      {
        _id: 'SLOT-06',
        machineId,
        slotId: 'SLOT_B3',
        productVariantId: 'VAR-ADULT-02-XL',
        sku: 'KARE-XL-10',
        currentQuantity: 5,
        maxCapacity: 20,
        isOperational: true,
        updatedAt: new Date(),
      },
    ];

    await this.db.collection('products').insertMany(sampleProducts);
    await this.db.collection('product_variants').insertMany(sampleVariants);
    await this.db.collection('inventory').insertMany(sampleSlots);
  }
}

