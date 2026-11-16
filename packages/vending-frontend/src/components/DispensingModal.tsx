/**
 * Dispensing Progress & Product Collection Modal
 * Live state tracker showing motor movement, sensor drop confirmation, and collection alert.
 * Satisfies Rule 11 (Dispensing Feedback & Auto-reset).
 */

import React, { useState, useEffect } from 'react';

interface DispensingModalProps {
  orderId: string;
  onFinish: () => void;
}

export const DispensingModal: React.FC<DispensingModalProps> = ({ orderId, onFinish }) => {
  const [step, setStep] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(8);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const triggerDispense = async () => {
      try {
        setStep(2); // Motor actuating
        const response = await fetch('http://localhost:4000/api/v1/dispensing/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Dispensing mechanism encountered an error.');
        }

        if (isMounted) {
          setStep(3); // Sensor drop verified & product delivered
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage((err as Error).message);
        }
      }
    };

    triggerDispense();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (step !== 3) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, onFinish]);

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h2 className="modal-title" style={{ justifyContent: 'center' }}>
          {step === 3 ? '🎉 Purchase Complete!' : '⚙️ Dispensing in Progress'}
        </h2>

        {errorMessage ? (
          <div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
              Dispensing Issue Detected
            </p>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '24px' }}>{errorMessage}</p>
            <p style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '24px' }}>
              Your order is recorded safely. Please contact machine support or scan barcode again.
            </p>
            <button className="category-btn active" style={{ width: '100%' }} onClick={onFinish}>
              Return to Home
            </button>
          </div>
        ) : (
          <div className="dispense-progress-box">
            {step < 3 ? (
              <div>
                <div className="dispense-spinner" />
                <p className="dispense-status-msg">
                  {step === 1 && 'Authenticating Dispensing Command...'}
                  {step === 2 && 'Actuating Dispensing Spiral Motors...'}
                </p>
                <p style={{ fontSize: '16px', color: '#94a3b8' }}>
                  Please wait while the machine dispenses your selected diaper pack...
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '72px', marginBottom: '16px' }}>📦</div>
                <div className="dispense-chute-alert">
                  ✓ Drop Verified! Please collect your diaper pack from the bottom chute.
                </div>
                <p style={{ fontSize: '18px', color: '#94a3b8', marginTop: '24px' }}>
                  Returning to welcome screen in <strong style={{ color: '#ffffff' }}>{countdown}s</strong>
                </p>
                <button
                  className="btn-checkout-cta"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={onFinish}
                >
                  Done / Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

