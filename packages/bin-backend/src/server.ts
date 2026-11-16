/**
 * Diaper Collection Bin Server Bootstrap
 * Initializes MongoDB connection pool, instantiates hardware drivers,
 * mounts Express application, and handles graceful process termination.
 *
 * Satisfies Rule 3 (Zero Leaks) and Rule 8 (Security).
 */

import http from 'node:http';
import { DatabaseManager } from '@sdds/shared';
import { MockLoadCellDriver, HX711HardwareDriver, ILoadCellDriver } from './hardware/hx711-driver';
import { MockThermalPrinterDriver, SerialThermalPrinterDriver, IThermalPrinterDriver } from './hardware/thermal-printer';
import { MockHatchDriver, MockCameraDriver, IHatchDriver, ICameraDriver } from './hardware/hatch-camera';
import { createBinApp } from './app';

async function bootstrap() {
  const port = parseInt(process.env.BIN_PORT || '4001', 10);
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB_NAME || 'sdds_db';
  const binId = process.env.BIN_ID || 'BIN-KGP-01';
  const hardwareMode = process.env.HARDWARE_MODE === 'serial' ? 'serial' : 'mock';

  console.log(`[BOOT] Starting Smart Diaper Collection Bin Server (${binId})...`);

  // 1. Connect to shared MongoDB
  const dbManager = DatabaseManager.getInstance();
  const db = await dbManager.connect({
    uri: mongoUri,
    dbName,
    maxPoolSize: 15,
    minPoolSize: 3,
  });
  console.log(`[BOOT] Shared MongoDB connected: '${dbName}'.`);

  // 2. Hardware Driver Instantiation
  let loadCellDriver: ILoadCellDriver;
  let printerDriver: IThermalPrinterDriver;
  const hatchDriver: IHatchDriver = new MockHatchDriver();
  const cameraDriver: ICameraDriver = new MockCameraDriver();

  if (hardwareMode === 'serial') {
    console.log('[BOOT] Initializing Physical Serial HX711 & ESC/POS Printer...');
    loadCellDriver = new HX711HardwareDriver(parseFloat(process.env.LOAD_CELL_CALIBRATION_FACTOR || '420.0'));
    printerDriver = new SerialThermalPrinterDriver(process.env.PRINTER_PORT || 'COM4', 9600);
  } else {
    console.log('[BOOT] Initializing Mock Hardware Drivers for local testing...');
    loadCellDriver = new MockLoadCellDriver();
    printerDriver = new MockThermalPrinterDriver();
  }

  // 3. Create Express App
  const app = createBinApp(db, hatchDriver, cameraDriver, loadCellDriver, printerDriver, binId);
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`[READY] Collection Bin API Server active on http://localhost:${port}`);
  });

  // 4. Graceful Teardown Hooks (Rule 3)
  const shutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Releasing hardware ports and database connection...`);
    server.close(async () => {
      await loadCellDriver.close();
      await printerDriver.close();
      await hatchDriver.close();
      await cameraDriver.close();
      await dbManager.disconnect();
      console.log('[SHUTDOWN] Collection bin cleanly terminated.');
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

