/**
 * Diaper Collection Bin REST API Controllers
 * Manages user authentication, OTP verification, pre-disposal inspection photo capture,
 * hatch locking/unlocking, diaper weight measurement, and reward receipt printing.
 *
 * Satisfies Rule 4 (Clean Architecture), Rule 8 (Security), and Rule 9 (Compact Dependencies).
 */

import { Request, Response, NextFunction } from 'express';
import { Db } from 'mongodb';
import { User, Validator, AppError, ErrorCode } from '@sdds/shared';
import { OtpService } from '../services/otp.service';
import { WeightRewardService } from '../services/weight-reward.service';
import { IHatchDriver, ICameraDriver } from '../hardware/hatch-camera';
import { ILoadCellDriver } from '../hardware/hx711-driver';

export class BinController {
  private db: Db;
  private otpService: OtpService;
  private weightRewardService: WeightRewardService;
  private hatchDriver: IHatchDriver;
  private cameraDriver: ICameraDriver;
  private loadCellDriver: ILoadCellDriver;
  private binId: string;

  constructor(
    db: Db,
    otpService: OtpService,
    weightRewardService: WeightRewardService,
    hatchDriver: IHatchDriver,
    cameraDriver: ICameraDriver,
    loadCellDriver: ILoadCellDriver,
    binId: string
  ) {
    this.db = db;
    this.otpService = otpService;
    this.weightRewardService = weightRewardService;
    this.hatchDriver = hatchDriver;
    this.cameraDriver = cameraDriver;
    this.loadCellDriver = loadCellDriver;
    this.binId = binId;
  }

  /**
   * POST /api/v1/bin/user/register-or-login
   * Registers a customer or retrieves existing profile, then sends an OTP.
   */
  public registerOrLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mobileNumber, name } = req.body;
      const validMobile = Validator.validateMobileNumber(mobileNumber);
      const validName = Validator.sanitizeString(name || 'Customer', 'Customer name', 1, 60);

      let user = await this.db.collection<User>('users').findOne({ mobileNumber: validMobile });
      if (!user) {
        const newUser: User = {
          _id: `USER-${Date.now().toString(36).toUpperCase()}`,
          mobileNumber: validMobile,
          name: validName,
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.db.collection<User>('users').insertOne(newUser as any);
        user = newUser;
      }

      const { expiresAt } = this.otpService.generateOtp(validMobile);

      res.status(200).json({
        success: true,
        message: 'OTP sent to customer mobile number.',
        data: {
          userId: user._id,
          mobileNumber: validMobile,
          otpExpiresAt: expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/bin/otp/verify
   * Verifies the 6-digit OTP and authenticates customer session.
   */
  public verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mobileNumber, otp } = req.body;
      const validMobile = Validator.validateMobileNumber(mobileNumber);
      const validOtp = Validator.sanitizeString(otp, 'OTP code', 6, 6);

      const isVerified = this.otpService.verifyOtp(validMobile, validOtp);
      if (!isVerified) {
        throw new AppError('OTP verification failed.', ErrorCode.UNAUTHORIZED, 401);
      }

      await this.db.collection('users').updateOne(
        { mobileNumber: validMobile },
        { $set: { isVerified: true, updatedAt: new Date() } }
      );

      const user = await this.db.collection<User>('users').findOne({ mobileNumber: validMobile });

      res.status(200).json({
        success: true,
        message: 'Mobile number verified successfully.',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/bin/hatch/open
   * Captures inspection camera image and unlocks the disposal door.
   */
  public openHatch = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Camera capture before hatch opens
      const inspectionImage = await this.cameraDriver.captureInspectionImage();

      // Step 2: Unlock hatch solenoid latch
      const hatchStatus = await this.hatchDriver.unlockHatch();

      res.status(200).json({
        success: true,
        data: {
          inspectionImage,
          hatchStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/bin/weigh
   * Locks the hatch and measures weight on the load cell.
   */
  public measureWeight = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Lock hatch to prevent external interference during weighing
      await this.hatchDriver.lockHatch();

      const weightGrams = await this.loadCellDriver.readWeightGrams();
      const preliminaryReward = this.weightRewardService.calculateRewardPercentage(weightGrams);

      res.status(200).json({
        success: true,
        data: {
          weightGrams,
          eligibleDiscountPercentage: preliminaryReward,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/bin/reward/generate
   * Saves reward to MongoDB, updates customer ledger, and prints physical Code 128 thermal receipt.
   */
  public generateReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body;
      const validUserId = Validator.sanitizeString(userId, 'User ID');

      const result = await this.weightRewardService.processDisposalAndIssueReward(this.binId, validUserId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/bin/status
   */
  public getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isClosed = await this.hatchDriver.isHatchClosed();
      res.status(200).json({
        success: true,
        data: {
          binId: this.binId,
          hatchClosed: isClosed,
          status: 'READY',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

