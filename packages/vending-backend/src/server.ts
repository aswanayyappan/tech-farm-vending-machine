/**
 * Vending Backend Server Bootstrap
 * Initializes MongoDB connection pool, selects hardware driver, seeds defaults,
 * and attaches graceful process termination hooks (Rule 3).
 */

import http from 'node:http';
import { DatabaseManager } from '@sdds/shared';
import { loadConfig } from './config/env.js';
import { MockHardwareDriver, SerialHardwareDriver, IHardwareDriver } from './hardware/esp32-driver.js';
import { ProductService } from './services/product.service.js';
import { createApp } from './app.js';

async function bootstrap() {
  const config = loadConfig();
  console.log(`[BOOT] Initializing Smart Diaper Vending Machine Server (${config.machineId})...`);

  // 1. Connect to shared MongoDB
  const dbManager = DatabaseManager.getInstance();
  const db = await dbManager.connect({
    uri: config.mongoUri,
    dbName: config.dbName,
    maxPoolSize: 20,
    minPoolSize: 5,
  });
  console.log(`[BOOT] MongoDB connected to database '${config.dbName}'.`);

  // 2. Instantiate Hardware Controller Driver
  let hardwareDriver: IHardwareDriver;
  if (config.hardwareMode === 'serial') {
    console.log(`[BOOT] Initializing ESP32 Serial Driver on ${config.serialPort} @ ${config.serialBaudRate}bps...`);
    hardwareDriver = new SerialHardwareDriver(config.serialPort, config.serialBaudRate);
  } else {
    console.log(`[BOOT] Initializing Mock Hardware Driver for simulation...`);
    hardwareDriver = new MockHardwareDriver();
  }

  // 3. Seed demo catalogue if empty
  const productService = new ProductService(db);
  await productService.seedDefaultCatalogueIfEmpty(config.machineId);
  console.log(`[BOOT] Default product catalogue and slot inventory verified.`);

  // 4. Create Express App & HTTP Server
  const app = createApp(db, hardwareDriver, config.machineId);
  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`[READY] Vending Machine API Server active on http://localhost:${config.port}`);
  });

  // 5. Graceful Teardown Hooks (Rule 3: Zero resource leaks)
  const shutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server, serial driver, and database connections...`);
    server.close(async () => {
      await hardwareDriver.close();
      await dbManager.disconnect();
      console.log(`[SHUTDOWN] All resources cleanly released. Process exiting.`);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[FATAL_BOOT_ERROR]', err);
  process.exit(1);
});

