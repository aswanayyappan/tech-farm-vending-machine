/**
 * Express Application Setup
 * Configures security headers, memory-aligned body parsing, and REST route bindings.
 * Satisfies Rule 3 (Resource Constraints), Rule 8 (Security), and Rule 4 (Modularity).
 */

import express, { Express } from 'express';
import cors from 'cors';
import { Db } from 'mongodb';
import { IHardwareDriver } from './hardware/esp32-driver.js';
import { ApiController } from './controllers/api.controller.js';
import { AdminController } from './controllers/admin.controller.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp(db: Db, hardwareDriver: IHardwareDriver, machineId: string): Express {
  const app = express();

  // Middleware: CORS for local Kiosk Next.js frontend
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-PIN'],
    })
  );

  // Security: Payload body parser strictly capped at 256KB to prevent memory exhaustion (Rule 3 & 8)
  app.use(express.json({ limit: '256kb' }));

  const controller = new ApiController(db, hardwareDriver, machineId);
  const adminController = new AdminController(db, hardwareDriver, machineId);

  // Health and machine status
  app.get('/health', (_req, res) => res.json({ status: 'HEALTHY', timestamp: Date.now() }));
  app.get('/api/v1/machine/status', controller.getMachineStatus);

  // Catalogue
  app.get('/api/v1/products', controller.getCatalogue);

  // Cart & Reward Validation
  app.post('/api/v1/cart/validate', controller.validateCart);
  app.post('/api/v1/rewards/scan', controller.scanReward);

  // Orders & Payment
  app.post('/api/v1/orders', controller.createOrder);
  app.post('/api/v1/payments/verify', controller.verifyPayment);

  // Stripe Payment Gateway
  app.get('/api/v1/payments/stripe/config', controller.getStripeConfig);
  app.post('/api/v1/payments/stripe/config', controller.updateStripeConfig);
  app.post('/api/v1/payments/stripe/create-intent', controller.createStripePaymentIntent);
  app.post('/api/v1/payments/stripe/confirm', controller.confirmStripePayment);
  app.post('/api/v1/payments/stripe/webhook', controller.handleStripeWebhook);

  // Dispensing
  app.post('/api/v1/dispensing/authorize', controller.authorizeDispensing);

  // Administrator & Telemetry APIs (Protected by PIN verification)
  app.get('/api/v1/admin/overview', adminController.verifyAdminAuth, adminController.getOverviewMetrics);
  app.get('/api/v1/admin/inventory', adminController.verifyAdminAuth, adminController.getInventorySlots);
  app.post('/api/v1/admin/inventory/restock', adminController.verifyAdminAuth, adminController.restockSlot);
  app.post('/api/v1/admin/inventory/toggle-status', adminController.verifyAdminAuth, adminController.toggleSlotStatus);
  app.get('/api/v1/admin/orders', adminController.verifyAdminAuth, adminController.getAllOrders);
  app.get('/api/v1/admin/telemetry', adminController.verifyAdminAuth, adminController.getMachineTelemetry);
  app.post('/api/v1/admin/diagnostics/dispense-test', adminController.verifyAdminAuth, adminController.triggerDiagnosticDispense);

  // Global Centralized Error Boundary
  app.use(errorHandler);

  return app;
}

