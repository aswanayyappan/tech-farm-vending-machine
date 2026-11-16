/**
 * Dispensing Authorization & Execution Service
 * Coordinates hardware actuation, drop sensor verification, atomic inventory deduction,
 * and single-use reward redemption.
 * Satisfies Rule 8 (Hardware & Financial Safety) and Rule 4 (SOLID Architecture).
 */

import { Db } from 'mongodb';
import { Order, DispenseCommand, DispenseResult, InventorySlot } from '@sdds/shared';
import { AppError, ErrorCode, NotFoundError, StockError } from '@sdds/shared';
import { IHardwareDriver } from '../hardware/esp32-driver.js';
import { DatabaseManager } from '@sdds/shared';

export class DispensingService {
  private db: Db;
  private hardwareDriver: IHardwareDriver;

  constructor(db: Db, hardwareDriver: IHardwareDriver) {
    this.db = db;
    this.hardwareDriver = hardwareDriver;
  }

  /**
   * Authorizes dispensing for a paid order and commands the hardware controller.
   */
  public async authorizeAndDispense(orderId: string): Promise<{ order: Order; results: DispenseResult[] }> {
    const order = await this.db.collection<Order>('orders').findOne({ _id: orderId });
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (order.status !== 'PAYMENT_VERIFIED') {
      throw new AppError(
        `Dispensing unauthorized: Order '${orderId}' payment is not verified (status: ${order.status}).`,
        ErrorCode.UNAUTHORIZED,
        403
      );
    }

    // Mark dispensing in progress
    await this.db.collection('orders').updateOne(
      { _id: orderId },
      { $set: { status: 'DISPENSING', dispenseStatus: 'IN_PROGRESS' } }
    );

    const dispenseResults: DispenseResult[] = [];

    try {
      // Actuate hardware for each order item
      for (const item of order.items) {
        const command: DispenseCommand = {
          commandId: `CMD-${orderId}-${item.assignedSlotId}-${Date.now()}`,
          orderId: order._id,
          slotId: item.assignedSlotId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          timestamp: Date.now(),
        };

        const result = await this.hardwareDriver.dispense(command);
        dispenseResults.push(result);

        // Record hardware dispense event in audit log
        await this.db.collection('dispense_events').insertOne(result as any);

        if (result.status !== 'SUCCESS' || !result.sensorConfirmed) {
          throw new AppError(
            `Dispensing failure at slot ${item.assignedSlotId}: status ${result.status}`,
            ErrorCode.HARDWARE_TIMEOUT,
            500
          );
        }
      }

      // Hardware confirmed! Atomically finalize inventory, reward, and order completion
      const dbManager = DatabaseManager.getInstance();
      await dbManager.withTransaction(async (session, transactionDb) => {
        // 1. Decrement inventory for each slot
        for (const item of order.items) {
          const updateResult = await transactionDb.collection<InventorySlot>('inventory').updateOne(
            {
              machineId: order.machineId,
              slotId: item.assignedSlotId,
              currentQuantity: { $gte: item.quantity },
            },
            {
              $inc: { currentQuantity: -item.quantity },
              $set: { updatedAt: new Date() },
            },
            { session }
          );

          if (updateResult.modifiedCount === 0) {
            throw new StockError(`Critical stock deduction race condition on slot ${item.assignedSlotId}`);
          }
        }

        // 2. Mark reward barcode as redeemed (if used)
        if (order.appliedBarcodeId) {
          await transactionDb.collection('rewards').updateOne(
            { _id: order.appliedBarcodeId, status: 'available' },
            {
              $set: {
                status: 'redeemed',
                redeemedAt: new Date(),
                orderId: order._id,
              },
            },
            { session }
          );
        }

        // 3. Mark order as COMPLETED
        await transactionDb.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'COMPLETED',
              dispenseStatus: 'DISPENSED',
              completedAt: new Date(),
            },
          },
          { session }
        );
      });

      const completedOrder = (await this.db.collection<Order>('orders').findOne({ _id: orderId }))!;
      return { order: completedOrder, results: dispenseResults };
    } catch (dispenseError) {
      // Retain unresolved failure state. Never blindly retry dispensing after error!
      await this.db.collection('orders').updateOne(
        { _id: orderId },
        {
          $set: {
            status: 'FAILED',
            dispenseStatus: 'FAILED',
            failureReason: (dispenseError as Error).message,
          },
        }
      );
      throw dispenseError;
    }
  }
}

