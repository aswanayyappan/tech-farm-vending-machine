/**
 * Kiosk Idle Warning Grace Modal
 * Alert shown before resetting abandoned session back to the idle advertisement mode.
 * Satisfies Rule 11 (Kiosk Session Hygiene & Privacy).
 */

import React from 'react';

interface IdleWarningModalProps {
  secondsRemaining: number;
  onStay: () => void;
}

export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({ secondsRemaining, onStay }) => {
  return (
    <div className="modal-overlay" onClick={onStay}>
      <div className="modal-card" style={{ maxWidth: '480px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏱️</div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
          Are You Still There?
        </h2>
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '24px' }}>
          Your session will reset in <strong style={{ color: '#f59e0b', fontSize: '24px' }}>{secondsRemaining}s</strong> to protect your privacy.
        </p>

        <button className="btn-checkout-cta" style={{ width: '100%' }} onClick={onStay}>
          Tap Anywhere to Continue Shopping
        </button>
      </div>
    </div>
  );
};

