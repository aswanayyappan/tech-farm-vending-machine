/**
 * Standard Application Error Hierarchy
 * Memory-aligned, type-safe custom error definitions for SDDS.
 * Adheres to Rule 4 (Clean Code) and Rule 8 (Security).
 */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  REWARD_EXPIRED = 'REWARD_EXPIRED',
  REWARD_ALREADY_REDEEMED = 'REWARD_ALREADY_REDEEMED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  HARDWARE_TIMEOUT = 'HARDWARE_TIMEOUT',
  HARDWARE_MOTOR_STALL = 'HARDWARE_MOTOR_STALL',
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, 400);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const detail = identifier ? ` with identifier '${identifier}'` : '';
    super(`${resource}${detail} was not found.`, ErrorCode.NOT_FOUND, 404);
  }
}

export class StockError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.INSUFFICIENT_STOCK, 409);
  }
}

export class RewardError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR) {
    super(message, code, 400);
  }
}

export class HardwareError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.HARDWARE_TIMEOUT) {
    super(message, code, 503);
  }
}

