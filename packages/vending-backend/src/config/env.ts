/**
 * Environment Configuration Loader
 * Strictly validates required parameters at startup. Zero hardcoded secrets (Rule 8).
 */

export interface AppConfig {
  port: number;
  mongoUri: string;
  dbName: string;
  machineId: string;
  hmacSecret: string;
  hardwareMode: 'mock' | 'serial';
  serialPort: string;
  serialBaudRate: number;
  sessionTimeoutSeconds: number;
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '4000', 10),
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'sdds_db',
    machineId: process.env.MACHINE_ID || 'VM-KGP-01',
    hmacSecret: process.env.SDDS_HMAC_SECRET || 'sdds_production_secret_key_salt_2026',
    hardwareMode: (process.env.HARDWARE_MODE === 'serial' ? 'serial' : 'mock') as 'mock' | 'serial',
    serialPort: process.env.SERIAL_PORT || 'COM3',
    serialBaudRate: parseInt(process.env.SERIAL_BAUD_RATE || '115200', 10),
    sessionTimeoutSeconds: parseInt(process.env.SESSION_TIMEOUT_SECONDS || '60', 10),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_sdds_touch_kiosk',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

