/**
 * OTP Generation & Verification Service
 * Cryptographically random 6-digit tokens, rate limiting, and time-bounded expiry.
 * Satisfies Rule 8 (Security) and Rule 4 (Clean Architecture).
 */

import { randomInt, createHash } from 'node:crypto';
import { ValidationError, AppError, ErrorCode } from '@sdds/shared';

interface OtpRecord {
  hashedOtp: string;
  mobileNumber: string;
  expiresAt: number;
  attempts: number;
}

export class OtpService {
  // In-memory token store with TTL (or Redis in large clusters)
  private otpStore = new Map<string, OtpRecord>();
  private readonly OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes expiry
  private readonly MAX_ATTEMPTS = 3;

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Generates a 6-digit OTP and dispatches/stores it.
   */
  public generateOtp(mobileNumber: string): { otp: string; expiresAt: Date } {
    if (!mobileNumber) {
      throw new ValidationError('Mobile number is required to send OTP.');
    }

    // Cryptographically secure 6-digit generation (100000 - 999999)
    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + this.OTP_TTL_MS;

    this.otpStore.set(mobileNumber, {
      hashedOtp: this.hashOtp(otp),
      mobileNumber,
      expiresAt,
      attempts: 0,
    });

    console.log(`[SECURE_OTP] Generated OTP for ${mobileNumber}: ${otp} (Expires in 2 mins)`);
    return { otp, expiresAt: new Date(expiresAt) };
  }

  /**
   * Verifies customer-submitted OTP against hash.
   */
  public verifyOtp(mobileNumber: string, submittedOtp: string): boolean {
    const record = this.otpStore.get(mobileNumber);
    if (!record) {
      throw new AppError('OTP expired or not requested.', ErrorCode.NOT_FOUND, 404);
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(mobileNumber);
      throw new ValidationError('OTP has expired. Please request a new one.');
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(mobileNumber);
      throw new AppError('Too many failed OTP attempts. Please request a new code.', ErrorCode.UNAUTHORIZED, 429);
    }

    const hashedInput = this.hashOtp(submittedOtp.trim());
    if (hashedInput !== record.hashedOtp) {
      record.attempts += 1;
      throw new ValidationError(`Incorrect OTP. ${this.MAX_ATTEMPTS - record.attempts} attempts remaining.`);
    }

    // Success: consume OTP immediately (prevent replay)
    this.otpStore.delete(mobileNumber);
    return true;
  }
}

