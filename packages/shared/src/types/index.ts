/**
 * Shared Type Definitions across SDDS Subsystems
 * Enforces strict typing, memory layout predictability, and domain boundaries.
 */

export interface User {
  _id: string; // MongoDB ObjectId string
  mobileNumber: string; // E.164 formatted (+91XXXXXXXXXX)
  name: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DiaperCategory = 'baby' | 'adult';
export type DiaperSize = 'S' | 'M' | 'L' | 'XL';

export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: DiaperCategory;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  _id: string;
  productId: string;
  sku: string; // e.g. BABY-MAMPY-M-20
  size: DiaperSize;
  packQuantity: number;
  price: number; // in INR (₹)
  imageUrl: string;
  inStock: boolean;
  totalAvailableStock: number;
}

export type RewardStatus = 'available' | 'redeemed' | 'expired';

export interface Reward {
  _id: string; // Code 128 unique barcode string (tamper-proof)
  userId: string;
  disposalId: string;
  weightGrams: number;
  rewardPercentage: number; // e.g., 5.0 for 5%
  status: RewardStatus;
  createdAt: Date;
  expiresAt: Date; // Exactly 7 days after createdAt
  redeemedAt?: Date;
  orderId?: string; // Associated order when redeemed
}

export interface RewardAccount {
  _id: string; // userId
  accumulatedPercentage: number;
  totalRewardsEarned: number;
  totalRewardsRedeemed: number;
  updatedAt: Date;
}

export interface InventorySlot {
  _id: string;
  machineId: string;
  slotId: string; // e.g. "SLOT_A1"
  productVariantId: string;
  sku: string;
  currentQuantity: number;
  maxCapacity: number;
  isOperational: boolean;
  updatedAt: Date;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_VERIFIED'
  | 'DISPENSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  productVariantId: string;
  sku: string;
  productName: string;
  size: DiaperSize;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  assignedSlotId: string;
}

export interface Order {
  _id: string; // e.g. ORD-YYYYMMDD-XXXX
  machineId: string;
  items: OrderItem[];
  subtotal: number;
  appliedBarcodeId?: string;
  discountPercentage: number;
  discountAmount: number;
  finalPayableAmount: number;
  status: OrderStatus;
  paymentMethod?: 'UPI_QR' | 'CARD' | 'CASH' | 'STRIPE_CARD';
  paymentReference?: string;
  dispenseStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'DISPENSED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
}

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amountPaise: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  orderId: string;
  createdAt: number;
}

export interface DispenseCommand {
  commandId: string; // Unique UUID for idempotency
  orderId: string;
  slotId: string;
  productVariantId: string;
  quantity: number;
  timestamp: number;
}

export interface DispenseResult {
  commandId: string;
  orderId: string;
  slotId: string;
  status: 'SUCCESS' | 'MOTOR_STALL' | 'SENSOR_TIMEOUT' | 'SLOT_EMPTY';
  dispensedQuantity: number;
  sensorConfirmed: boolean;
  timestamp: number;
}

export interface AdminMetrics {
  todaySalesInr: number;
  totalOrdersCount: number;
  totalDispensedUnits: number;
  lowStockSlotsCount: number;
  isMachineOnline: boolean;
  activeAlerts: string[];
}

export interface MachineTelemetry {
  machineId: string;
  isOnline: boolean;
  controllerStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  port: string;
  baudRate: number;
  hardwareMode: 'mock' | 'serial';
  lastHeartbeat: Date;
  uptimeSeconds: number;
  infraredDropSensorOk: boolean;
}


