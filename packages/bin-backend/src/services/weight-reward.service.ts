/**
 * Diaper Weighing & Reward Issuance Service
 * Calculates weight-based percentage discounts, issues HMAC-signed Code 128 barcodes,
 * stores 7-day TTL reward records, and prints physical thermal receipts.
 * Satisfies Rule 8 (Financial Integrity), Rule 3 (Zero Leaks), and Rule 4 (SOLID).
 */

import { Db } from 'mongodb';
import { Reward, RewardAccount, User } from '@sdds/shared';
import { ValidationError, AppError, ErrorCode, generateBarcodeIdentifier, DatabaseManager } from '@sdds/shared';
import { IThermalPrinterDriver } from '../hardware/thermal-printer.js';
import { ILoadCellDriver } from '../hardware/hx711-driver.js';

export interface IssueRewardInput {
  binId: string;
  userId: string;
  measuredWeightGrams: number;
}

export interface IssuedRewardResult {
  barcode: string;
  weightGrams: number;
  rewardPercentage: number;
  expiresAt: Date;
  accumulatedTotalPercentage: number;
  printed: boolean;
}

export class WeightRewardService {
  private db: Db;
  private loadCellDriver: ILoadCellDriver;
  private printerDriver: IThermalPrinterDriver;

  private readonly MIN_WEIGHT_GRAMS = 50; // Minimum weight to qualify as a diaper
  private readonly MAX_DISCOUNT_PER_DEPOSIT = 25.0; // 25% maximum discount per individual diaper
  private readonly REWARD_EXPIRY_DAYS = 7; // Exactly 7-day TTL

  constructor(db: Db, loadCellDriver: ILoadCellDriver, printerDriver: IThermalPrinterDriver) {
    this.db = db;
    this.loadCellDriver = loadCellDriver;
    this.printerDriver = printerDriver;
  }

  /**
   * Calculates the percentage discount based on measured weight in grams.
   * Formula: 5% base discount + 1% per 50g above minimum threshold.
   */
  public calculateRewardPercentage(weightGrams: number): number {
    if (weightGrams < this.MIN_WEIGHT_GRAMS) {
      throw new ValidationError(`Weight (${weightGrams}g) is below the minimum threshold (${this.MIN_WEIGHT_GRAMS}g) for reward issuance.`);
    }

    const additionalWeight = Math.max(0, weightGrams - this.MIN_WEIGHT_GRAMS);
    const incrementalReward = Math.floor(additionalWeight / 50) * 1.0;
    const totalPercentage = 5.0 + incrementalReward;

    return Math.min(totalPercentage, this.MAX_DISCOUNT_PER_DEPOSIT);
  }

  /**
   * Reads weight from load cell and issues a signed Code 128 barcode receipt.
   */
  public async processDisposalAndIssueReward(binId: string, userId: string): Promise<IssuedRewardResult> {
    const user = await this.db.collection<User>('users').findOne({ _id: userId });
    if (!user) {
      throw new AppError(`User '${userId}' not registered.`, ErrorCode.NOT_FOUND, 404);
    }

    // 1. Read weight from load cell sensor
    const weightGrams = await this.loadCellDriver.readWeightGrams();
    const rewardPercentage = this.calculateRewardPercentage(weightGrams);

    // 2. Generate HMAC-signed Code 128 Barcode Token
    const barcode = generateBarcodeIdentifier(userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.REWARD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const disposalId = `DISP-${binId}-${Date.now()}`;

    const newReward: Reward = {
      _id: barcode,
      userId,
      disposalId,
      weightGrams,
      rewardPercentage,
      status: 'available',
      createdAt: now,
      expiresAt,
    };

    // 3. Atomically save reward event and update customer reward account
    const dbManager = DatabaseManager.getInstance();
    let accumulatedTotal = rewardPercentage;

    await dbManager.withTransaction(async (session, transactionDb) => {
      // Insert reward event document
      await transactionDb.collection<Reward>('rewards').insertOne(newReward as any, { session });

      // Upsert customer reward account
      const accountUpdate = await transactionDb.collection<RewardAccount>('reward_accounts').findOneAndUpdate(
        { _id: userId },
        {
          $inc: {
            accumulatedPercentage: rewardPercentage,
            totalRewardsEarned: 1,
          },
          $set: { updatedAt: now },
        },
        { upsert: true, returnDocument: 'after', session }
      );

      if (accountUpdate) {
        accumulatedTotal = accountUpdate.accumulatedPercentage;
      }
    });

    // 4. Print physical Code 128 thermal receipt
    const printResult = await this.printerDriver.printRewardReceipt({
      binId,
      userName: user.name,
      mobileNumber: user.mobileNumber,
      weightGrams,
      rewardPercentage,
      barcode,
      expiresAt,
    });

    return {
      barcode,
      weightGrams,
      rewardPercentage,
      expiresAt,
      accumulatedTotalPercentage: accumulatedTotal,
      printed: printResult.success,
    };
  }
}

