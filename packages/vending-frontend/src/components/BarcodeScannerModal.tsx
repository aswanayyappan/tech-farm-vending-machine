/**
 * Barcode Scanner Modal Component
 * Listens for physical USB scanner input and provides on-screen manual/test scan options.
 * Satisfies Rule 8 (Validation) and Rule 11 (Scanner Feedback & Visual Laser).
 */

import React, { useState } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner.js';

interface BarcodeScannerModalProps {
  subtotal: number;
  onApplyReward: (barcode: string, discountAmount: number, percentage: number) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  subtotal,
  onApplyReward,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processBarcode = async (barcode: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:4000/api/v1/rewards/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.trim(), subtotal }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired barcode.');
      }

      onApplyReward(data.data.barcode, data.data.discountAmount, data.data.rewardPercentage);
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Hardware USB Barcode Scanner Hook
  useBarcodeScanner({
    onScan: (scanned) => processBarcode(scanned),
    enabled: true,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>📷 Scan Reward Barcode</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-viewport">
          <div className="scanner-laser" />
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏷️</div>
          <p className="scanner-hint">Hold barcode under the red laser scanner</p>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Supports physical USB Laser Scanner & Emulated Input
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              color: '#f87171',
              marginBottom: '16px',
              fontSize: '15px',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
            Or enter/test barcode manually:
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. SDDS-19A62B-FA48-E92A"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              style={{
                flex: 1,
                minHeight: '52px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '2px solid #334155',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '16px',
              }}
            />
            <button
              className="btn-add-touch"
              disabled={loading || !manualCode.trim()}
              onClick={() => processBarcode(manualCode)}
            >
              {loading ? 'Verifying...' : 'Validate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

