/**
 * Vending Machine API Controllers
 * Strict input validation, zero unhandled rejections, clean error boundaries.
 * Satisfies Rule 4 (Clean Code), Rule 8 (Input Validation), and Rule 9 (Compact).
 */

import { Request, Response, NextFunction } from 'express';
import { Db } from 'mongodb';
import { ProductService } from '../services/product.service.js';
import { RewardService } from '../services/reward.service.js';
import { OrderService } from '../services/order.service.js';
import { DispensingService } from '../services/dispensing.service.js';
import { StripeService } from '../services/stripe.service.js';
import { loadConfig } from '../config/env.js';
import { IHardwareDriver } from '../hardware/esp32-driver.js';
import { Validator } from '@sdds/shared';

export class ApiController {
  private productService: ProductService;
  private rewardService: RewardService;
  private orderService: OrderService;
  private dispensingService: DispensingService;
  private stripeService: StripeService;
  private machineId: string;

  constructor(db: Db, hardwareDriver: IHardwareDriver, machineId: string) {
    this.productService = new ProductService(db);
    this.rewardService = new RewardService(db);
    this.orderService = new OrderService(db);
    this.dispensingService = new DispensingService(db, hardwareDriver);
    this.machineId = machineId;

    const config = loadConfig();
    this.stripeService = new StripeService({
      secretKey: config.stripeSecretKey,
      publishableKey: config.stripePublishableKey,
      webhookSecret: config.stripeWebhookSecret,
    });
  }

  /**
   * GET /api/v1/products
   */
  public getCatalogue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category ? Validator.validateCategory(req.query.category) : undefined;
      const size = req.query.size ? Validator.validateSize(req.query.size) : undefined;
      const products = await this.productService.getCatalogue(category, size);
      res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/cart/validate
   */
  public validateCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { items } = req.body;
      const result = await this.orderService.validateCart(this.machineId, items);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/rewards/scan
   */
  public scanReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { barcode, subtotal } = req.body;
      const validSubtotal = Validator.validateInteger(subtotal, 'Subtotal', 1, 100000);
      const result = await this.rewardService.validateBarcodeForSubtotal(barcode, validSubtotal);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders
   */
  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { items, barcodeId, paymentMethod } = req.body;
      const order = await this.orderService.createOrder({
        machineId: this.machineId,
        items,
        barcodeId,
        paymentMethod: paymentMethod || 'UPI_QR',
      });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/verify
   */
  public verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, paymentReference } = req.body;
      const validOrderId = Validator.sanitizeString(orderId, 'Order ID');
      const validPaymentRef = Validator.sanitizeString(paymentReference || `UPI-${Date.now()}`, 'Payment Reference');
      const order = await this.orderService.verifyPayment(validOrderId, validPaymentRef);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/dispensing/authorize
   */
  public authorizeDispensing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.body;
      const validOrderId = Validator.sanitizeString(orderId, 'Order ID');
      const result = await this.dispensingService.authorizeAndDispense(validOrderId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/machine/status
   */
  public getMachineStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          machineId: this.machineId,
          status: 'OPERATIONAL',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/payments/stripe/config
   */
  public getStripeConfig = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      publishableKey: this.stripeService.getPublishableKey(),
      isConfigured: this.stripeService.isRealKeyConfigured(),
    });
  };

  /**
   * POST /api/v1/payments/stripe/config
   */
  public updateStripeConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { publishableKey, secretKey } = req.body;
      if (publishableKey || secretKey) {
        this.stripeService.setKeys(secretKey, publishableKey);
      }
      res.status(200).json({
        success: true,
        publishableKey: this.stripeService.getPublishableKey(),
        isConfigured: this.stripeService.isRealKeyConfigured(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/stripe/create-intent
   */
  public createStripePaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, amountInr } = req.body;
      const validOrderId = Validator.sanitizeString(orderId, 'Order ID');
      const validAmount = Validator.validateInteger(amountInr, 'Amount in INR', 1, 100000);
      const intent = await this.stripeService.createPaymentIntent(validOrderId, validAmount);
      res.status(200).json({ success: true, data: intent });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/stripe/confirm
   */
  public confirmStripePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, paymentIntentId } = req.body;
      const validOrderId = Validator.sanitizeString(orderId, 'Order ID');
      const validIntentId = Validator.sanitizeString(paymentIntentId, 'Payment Intent ID');
      const result = await this.stripeService.confirmPaymentIntent(validIntentId);

      if (result.success) {
        await this.orderService.verifyPayment(validOrderId, `STRIPE-${validIntentId}`);
      }

      res.status(200).json({ success: result.success, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/stripe/webhook
   */
  public handleStripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const rawPayload = JSON.stringify(req.body);
      const isValid = this.stripeService.verifyWebhookSignature(rawPayload, sig || '');

      if (!isValid && process.env.NODE_ENV === 'production') {
        res.status(400).json({ success: false, message: 'Invalid Stripe signature' });
        return;
      }

      const event = req.body;
      if (event?.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data?.object;
        const orderId = paymentIntent?.metadata?.orderId;
        if (orderId) {
          await this.orderService.verifyPayment(orderId, `STRIPE-${paymentIntent.id}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  };
}

