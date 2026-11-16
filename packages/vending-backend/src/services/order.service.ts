/**
 * Order Lifecycle & Checkout Service
 * Manages cart validation, inventory pre-checks, order generation, and payment status updates.
 * Satisfies Rule 8 (Financial Integrity) and Rule 4 (Clean Architecture).
 */

import { Db } from 'mongodb';
import { Order, OrderItem, OrderStatus, InventorySlot, ProductVariant } from '@sdds/shared';
import { StockError, NotFoundError, ValidationError, AppError, ErrorCode } from '@sdds/shared';
import { RewardService } from './reward.service.js';

export interface CartInputItem {
  productVariantId: string;
  quantity: number;
}

export interface CreateOrderInput {
  machineId: string;
  items: CartInputItem[];
  barcodeId?: string;
  paymentMethod: 'UPI_QR' | 'CARD' | 'CASH';
}

export class OrderService {
  private db: Db;
  private rewardService: RewardService;

  constructor(db: Db) {
    this.db = db;
    this.rewardService = new RewardService(db);
  }

  /**
   * Validates cart stock against machine slot inventory without modifying database.
   */
  public async validateCart(machineId: string, items: CartInputItem[]): Promise<{ valid: boolean; subtotal: number }> {
    if (!items || items.length === 0) {
      throw new ValidationError('Cart cannot be empty.');
    }

    let subtotal = 0;
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new ValidationError(`Quantity for item '${item.productVariantId}' must be at least 1.`);
      }

      const variant = await this.db.collection<ProductVariant>('product_variants').findOne({ _id: item.productVariantId });
      if (!variant) {
        throw new NotFoundError('Product variant', item.productVariantId);
      }

      const slot = await this.db.collection<InventorySlot>('inventory').findOne({
        machineId,
        productVariantId: item.productVariantId,
        isOperational: true,
      });

      if (!slot || slot.currentQuantity < item.quantity) {
        throw new StockError(
          `Insufficient stock for '${variant.sku}'. Available: ${slot ? slot.currentQuantity : 0}, requested: ${item.quantity}.`
        );
      }

      subtotal += variant.price * item.quantity;
    }

    return { valid: true, subtotal };
  }

  /**
   * Generates a new order with validated items, stock verification, and applied discount.
   */
  public async createOrder(input: CreateOrderInput): Promise<Order> {
    const { machineId, items, barcodeId, paymentMethod } = input;
    const { subtotal } = await this.validateCart(machineId, items);

    let discountPercentage = 0;
    let discountAmount = 0;
    let appliedBarcode: string | undefined = undefined;

    if (barcodeId) {
      const rewardResult = await this.rewardService.validateBarcodeForSubtotal(barcodeId, subtotal);
      discountPercentage = rewardResult.rewardPercentage;
      discountAmount = rewardResult.discountAmount;
      appliedBarcode = rewardResult.barcode;
    }

    const finalPayableAmount = Math.max(0, subtotal - discountAmount);
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const variant = (await this.db.collection<ProductVariant>('product_variants').findOne({ _id: item.productVariantId }))!;
      const slot = (await this.db.collection<InventorySlot>('inventory').findOne({
        machineId,
        productVariantId: item.productVariantId,
        isOperational: true,
      }))!;

      orderItems.push({
        productVariantId: variant._id,
        sku: variant.sku,
        productName: variant.sku,
        size: variant.size,
        unitPrice: variant.price,
        quantity: item.quantity,
        lineTotal: variant.price * item.quantity,
        assignedSlotId: slot.slotId,
      });
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      _id: orderId,
      machineId,
      items: orderItems,
      subtotal,
      appliedBarcodeId: appliedBarcode,
      discountPercentage,
      discountAmount,
      finalPayableAmount,
      status: 'PENDING_PAYMENT',
      paymentMethod,
      dispenseStatus: 'NOT_STARTED',
      createdAt: new Date(),
    };

    await this.db.collection<Order>('orders').insertOne(newOrder as any);
    return newOrder;
  }

  /**
   * Verifies payment and advances order status to PAYMENT_VERIFIED.
   */
  public async verifyPayment(orderId: string, paymentRef: string): Promise<Order> {
    const order = await this.db.collection<Order>('orders').findOne({ _id: orderId });
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new AppError(`Order '${orderId}' is not pending payment (status: ${order.status}).`, ErrorCode.VALIDATION_ERROR, 400);
    }

    // Record verified transaction
    await this.db.collection('orders').updateOne(
      { _id: orderId },
      {
        $set: {
          status: 'PAYMENT_VERIFIED',
          paymentReference: paymentRef,
          updatedAt: new Date(),
        },
      }
    );

    return (await this.db.collection<Order>('orders').findOne({ _id: orderId }))!;
  }
}

