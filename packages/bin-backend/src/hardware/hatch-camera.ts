/**
 * Bin Disposal Hatch & Camera Inspection Drivers
 * Controls the physical deposit door latch and handles pre-deposit camera inspection photos.
 * Satisfies Rule 8 (Hardware Boundary Safety) and Rule 3 (Stream/Memory Constraints).
 */

export interface IHatchDriver {
  unlockHatch(): Promise<{ unlocked: boolean; autoLockSeconds: number }>;
  lockHatch(): Promise<{ locked: boolean }>;
  isHatchClosed(): Promise<boolean>;
  close(): Promise<void>;
}

export interface ICameraDriver {
  captureInspectionImage(): Promise<{ imageId: string; timestamp: number; mockUrl: string }>;
  close(): Promise<void>;
}

export class MockHatchDriver implements IHatchDriver {
  private isClosed = true;

  public async unlockHatch(): Promise<{ unlocked: boolean; autoLockSeconds: number }> {
    this.isClosed = false;
    console.log('[HATCH] Solenoid latch unlocked. Door open for diaper deposit (30s window).');
    return { unlocked: true, autoLockSeconds: 30 };
  }

  public async lockHatch(): Promise<{ locked: boolean }> {
    this.isClosed = true;
    console.log('[HATCH] Solenoid latch engaged. Hatch securely locked for weighing.');
    return { locked: true };
  }

  public async isHatchClosed(): Promise<boolean> {
    return this.isClosed;
  }

  public async close(): Promise<void> {
    this.isClosed = true;
  }
}

export class MockCameraDriver implements ICameraDriver {
  public async captureInspectionImage(): Promise<{ imageId: string; timestamp: number; mockUrl: string }> {
    const timestamp = Date.now();
    const imageId = `IMG-INSPECT-${timestamp}`;
    console.log(`[CAMERA] Pre-disposal image captured: ${imageId}`);
    return {
      imageId,
      timestamp,
      mockUrl: `/captures/${imageId}.jpg`,
    };
  }

  public async close(): Promise<void> {
    // Release camera stream
  }
}

