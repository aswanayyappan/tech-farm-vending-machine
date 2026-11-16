/**
 * Express Application Setup for Diaper Collection Bin
 * Enforces body size limits, CORS, route binding, and centralized error handling.
 * Satisfies Rule 3 (Resource Constraints), Rule 8 (Security), and Rule 4 (Modularity).
 */

import express, { Express } from 'express';
import cors from 'cors';
import { Db } from 'mongodb';
import { BinController } from './controllers/bin.controller';
import { OtpService } from './services/otp.service';
import { WeightRewardService } from './services/weight-reward.service';
import { IHatchDriver, ICameraDriver } from './hardware/hatch-camera';
import { ILoadCellDriver } from './hardware/hx711-driver';
import { IThermalPrinterDriver } from './hardware/thermal-printer';
import { AppError } from '@sdds/shared';

export function createBinApp(
  db: Db,
  hatchDriver: IHatchDriver,
  cameraDriver: ICameraDriver,
  loadCellDriver: ILoadCellDriver,
  printerDriver: IThermalPrinterDriver,
  binId: string
): Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '256kb' }));

  const otpService = new OtpService();
  const weightRewardService = new WeightRewardService(db, loadCellDriver, printerDriver);
  const controller = new BinController(
    db,
    otpService,
    weightRewardService,
    hatchDriver,
    cameraDriver,
    loadCellDriver,
    binId
  );

  // Health and status
  app.get('/health', (_req, res) => res.json({ status: 'HEALTHY', binId, timestamp: Date.now() }));
  app.get('/api/v1/bin/status', controller.getStatus);

  // User Auth & OTP
  app.post('/api/v1/bin/user/register-or-login', controller.registerOrLogin);
  app.post('/api/v1/bin/otp/verify', controller.verifyOtp);

  // Hardware Actions
  app.post('/api/v1/bin/hatch/open', controller.openHatch);
  app.post('/api/v1/bin/weigh', controller.measureWeight);
  app.post('/api/v1/bin/reward/generate', controller.generateReward);

  // Centralized Error Boundary
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
        timestamp: err.timestamp,
      });
      return;
    }

    console.error('[BIN_UNHANDLED_ERROR]', err);
    res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected system error occurred.',
      timestamp: Date.now(),
    });
  });

  return app;
}

