/**
 * Reward Redemption & Discount Calculation Service
 * Validates Code 128 barcodes, enforces 7-day TTL expiration,
 * prevents double redemption, and calculates eligible cart discount.
 * Satisfies Rule 8 (Security & Idempotency) and Rule 4 (Clean Architecture).
 */

import { Db } from 'mongodb';
import { Reward, RewardError, ErrorCode, Validator, verifyBarcodeSignature } from '@sdds/shared';

export interface RewardValidationResult {
  valid: boolean;
  barcode: string;
  userId: string;
  rewardPercentage: number;
  discountAmount: number;
  expiresAt: Date;
}

export class RewardService {
  private db: Db;
  // Configurable cap: maximum discount allowable per purchase (e.g. 50% max discount to prevent financial loss)
  private readonly MAX_DISCOUNT_PERCENTAGE = 50.0;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Validates a scanned barcode and calculates the discount for a given subtotal.
   */
  public async validateBarcodeForSubtotal(rawBarcode: string, subtotal: number): Promise<RewardValidationResult> {
    const barcode = Validator.validateBarcode(rawBarcode);

    if (subtotal <= 0) {
      throw new RewardError('Subtotal must be greater than zero to apply a reward.', ErrorCode.VALIDATION_ERROR);
    }

    const reward = await this.db.collection<Reward>('rewards').findOne({ _id: barcode });
    if (!reward) {
      throw new RewardError(`Reward barcode '${barcode}' not found in the system.`, ErrorCode.NOT_FOUND);
    }

    // Security check: verify HMAC signature against stored userId
    const isAuthentic = verifyBarcodeSignature(barcode, reward.userId);
    if (!isAuthentic) {
      throw new RewardError('Barcode signature validation failed. Counterfeit or tampered code.', ErrorCode.UNAUTHORIZED);
    }

    // Rule check: 7-Day TTL Expiration
    const now = new Date();
    if (new Date(reward.expiresAt) < now) {
      // Lazily update status to expired if not already marked
      if (reward.status !== 'expired') {
        await this.db.collection('rewards').updateOne({ _id: barcode }, { $set: { status: 'expired' } });
      }
      throw new RewardError('This reward barcode expired after 7 days and is no longer valid.', ErrorCode.REWARD_EXPIRED);
    }

    // Rule check: Already redeemed
    if (reward.status === 'redeemed') {
      throw new RewardError('This reward barcode has already been redeemed.', ErrorCode.REWARD_ALREADY_REDEEMED);
    }

    if (reward.status !== 'available') {
      throw new RewardError(`Reward barcode is currently in '${reward.status}' status and cannot be used.`, ErrorCode.VALIDATION_ERROR);
    }

    // Calculate discount with safety ceiling
    const effectivePercentage = Math.min(reward.rewardPercentage, this.MAX_DISCOUNT_PERCENTAGE);
    const calculatedDiscount = Math.round((subtotal * effectivePercentage) / 100);

    return {
      valid: true,
      barcode,
      userId: reward.userId,
      rewardPercentage: effectivePercentage,
      discountAmount: calculatedDiscount,
      expiresAt: reward.expiresAt,
    };
  }
}

