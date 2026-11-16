/**
 * MongoDB Database Connection Manager & Transaction Engine
 * Implements connection pooling, lifecycle management, and atomic transaction execution.
 * Satisfies Rule 3 (Zero Leaks), Rule 8 (Atomic Transactions), and Rule 9 (Compact).
 */

import { MongoClient, Db, ClientSession, TransactionOptions } from 'mongodb';
import { AppError, ErrorCode } from '../errors/app-error';

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  connectTimeoutMS?: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initializes the MongoDB connection pool.
   */
  public async connect(config: DatabaseConfig): Promise<Db> {
    if (this.db && this.client) {
      return this.db;
    }

    try {
      this.client = new MongoClient(config.uri, {
        maxPoolSize: config.maxPoolSize || 20,
        minPoolSize: config.minPoolSize || 5,
        connectTimeoutMS: config.connectTimeoutMS || 10000,
        retryWrites: true,
        w: 'majority',
      });

      await this.client.connect();
      this.db = this.client.db(config.dbName);
      return this.db;
    } catch (error) {
      throw new AppError(
        `Failed to connect to MongoDB: ${(error as Error).message}`,
        ErrorCode.DATABASE_TRANSACTION_FAILED,
        500
      );
    }
  }

  /**
   * Retrieves the active database instance.
   */
  public getDb(): Db {
    if (!this.db) {
      throw new AppError('Database not initialized. Call connect() first.', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
    return this.db;
  }

  /**
   * Executes an atomic ACID transaction across multiple collections.
   * Guarantees rollback on failure to prevent reward double-spending or inventory discrepancies.
   */
  public async withTransaction<T>(
    operation: (session: ClientSession, db: Db) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    if (!this.client || !this.db) {
      throw new AppError('Database client is not connected.', ErrorCode.DATABASE_TRANSACTION_FAILED, 500);
    }

    const session = this.client.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await operation(session, this.db!);
      }, options);
      return result!;
    } catch (error) {
      throw new AppError(
        `Transaction aborted: ${(error as Error).message}`,
        ErrorCode.DATABASE_TRANSACTION_FAILED,
        500
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Gracefully closes the database connection and cleans up all active pools.
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

