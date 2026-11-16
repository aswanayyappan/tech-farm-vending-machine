/**
 * Touch Payment Modal Component
 * Displays payment method selector (UPI QR / Card / Cash), dynamic breakdown, and payment confirmation.
 * Satisfies Rule 11 (Touch Ergonomics & Payment State Flow).
 */

import React, { useState, useEffect } from 'react';

interface PaymentModalProps {
  orderId: string;
  finalAmount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  finalAmount,
  onPaymentSuccess,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI_QR' | 'CARD' | 'CASH'>('UPI_QR');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentReference: `PAY-${selectedMethod}-${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment verification failed.');
      }

      onPaymentSuccess();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>💳 Complete Payment</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="payment-grid">
          <button
            className={`payment-option-btn ${selectedMethod === 'UPI_QR' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('UPI_QR')}
          >
            <span style={{ fontSize: '26px' }}>📱</span>
            <span>UPI QR Code</span>
          </button>
          <button
            className={`payment-option-btn ${selectedMethod === 'CARD' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('CARD')}
          >
            <span style={{ fontSize: '26px' }}>💳</span>
            <span>Debit / Credit Card</span>
          </button>
        </div>

        {selectedMethod === 'UPI_QR' && (
          <div style={{ textAlign: 'center', padding: '16px 0', backgroundColor: '#0b0f19', borderRadius: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '180px',
                height: '180px',
                backgroundColor: '#ffffff',
                margin: '0 auto 12px',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {/* Scalable SVG QR representation */}
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <rect x="5" y="5" width="30" height="30" fill="#000" />
                <rect x="10" y="10" width="20" height="20" fill="#fff" />
                <rect x="15" y="15" width="10" height="10" fill="#000" />
                <rect x="65" y="5" width="30" height="30" fill="#000" />
                <rect x="70" y="10" width="20" height="20" fill="#fff" />
                <rect x="75" y="15" width="10" height="10" fill="#000" />
                <rect x="5" y="65" width="30" height="30" fill="#000" />
                <rect x="10" y="70" width="20" height="20" fill="#fff" />
                <rect x="15" y="75" width="10" height="10" fill="#000" />
                <rect x="45" y="20" width="10" height="20" fill="#000" />
                <rect x="50" y="50" width="25" height="15" fill="#000" />
                <rect x="80" y="75" width="15" height="15" fill="#000" />
              </svg>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Scan with GPay / PhonePe / Paytm</p>
            <p style={{ fontSize: '14px', color: '#f59e0b', marginTop: '4px' }}>
              Expires in {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', color: '#94a3b8' }}>Amount to Pay:</span>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff' }}>₹{finalAmount}</span>
        </div>

        <button
          className="btn-checkout-cta"
          style={{ width: '100%' }}
          disabled={loading}
          onClick={handleConfirmPayment}
        >
          {loading ? 'Verifying Payment...' : `Confirm & Pay ₹${finalAmount} (Simulate)`}
        </button>
      </div>
    </div>
  );
};

