/**
 * USB Barcode Scanner Keystroke Listener Hook
 * Intercepts high-speed HID keyboard emulation from laser barcode scanners.
 * Satisfies Rule 3 (Zero Leaks), Rule 8 (Input Bounds), and Rule 11 (Scanner Feedback).
 */

import { useEffect, useRef } from 'react';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minBarcodeLength = 8,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners transmit characters in rapid bursts (< 60ms between keys)
      // If time between keystrokes is large (> 200ms), assume manual typing and reset buffer
      if (timeDiff > 200) {
        bufferRef.current = '';
      }

      if (event.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';
        if (scannedCode.length >= minBarcodeLength) {
          onScan(scannedCode);
        }
        return;
      }

      // Buffer printable characters
      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Rule 3: Zero memory leaks
      window.removeEventListener('keydown', handleKeyDown);
      bufferRef.current = '';
    };
  }, [enabled, minBarcodeLength, onScan]);
}

