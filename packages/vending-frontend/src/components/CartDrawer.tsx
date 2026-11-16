/**
 * Shopping Cart Drawer Component
 * Manages item quantities, displays reward discounts, and triggers checkout.
 * Satisfies Rule 11 (Interactive Cart & Touch Ergonomics).
 */

import React from 'react';
import { ProductVariant } from '@sdds/shared';

export interface CartItem {
  variant: ProductVariant;
  productName: string;
  quantity: number;
}

interface CartDrawerProps {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  appliedBarcode?: string;
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onOpenBarcodeScanner: () => void;
  onProceedToCheckout: () => void;
  onCloseCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  subtotal,
  discountAmount,
  finalAmount,
  appliedBarcode,
  onUpdateQuantity,
  onRemoveItem,
  onOpenBarcodeScanner,
  onProceedToCheckout,
  onCloseCart,
}) => {
  return (
    <div className="modal-overlay" onClick={onCloseCart}>
      <div className="modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>🛒 Your Shopping Cart ({items.length} items)</span>
          <button className="modal-close-btn" onClick={onCloseCart}>✕</button>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: '20px' }}>Your cart is empty. Add a product to get started.</p>
          </div>
        ) : (
          <div>
            <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '24px' }}>
              {items.map(({ variant, productName, quantity }) => (
                <div
                  key={variant._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: '1px solid #334155',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '18px', color: '#ffffff' }}>{productName}</h4>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                      Size: {variant.size} · ₹{variant.price} each
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      className="category-btn"
                      style={{ minHeight: '44px', width: '44px', padding: 0 }}
                      onClick={() => onUpdateQuantity(variant._id, -1)}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button
                      className="category-btn"
                      style={{ minHeight: '44px', width: '44px', padding: 0 }}
                      disabled={quantity >= variant.totalAvailableStock}
                      onClick={() => onUpdateQuantity(variant._id, 1)}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 800, minWidth: '70px', textAlign: 'right' }}>
                      ₹{variant.price * quantity}
                    </span>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer' }}
                      onClick={() => onRemoveItem(variant._id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reward Barcode Banner */}
            <div
              style={{
                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                border: '1px dashed #2dd4bf',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#2dd4bf' }}>
                  {appliedBarcode ? '✅ Reward Barcode Applied' : 'Have a Diaper Collection Barcode?'}
                </p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {appliedBarcode ? `Code: ${appliedBarcode}` : 'Scan code from the collection bin to redeem discount'}
                </p>
              </div>
              <button
                className="category-btn"
                style={{ minHeight: '46px', fontSize: '15px' }}
                onClick={onOpenBarcodeScanner}
              >
                {appliedBarcode ? 'Change Code' : '📷 Scan Barcode'}
              </button>
            </div>

            {/* Subtotal & Discount Calculation */}
            <div style={{ padding: '16px 0', borderTop: '2px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '18px', color: '#94a3b8' }}>
                <span>Cart Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '18px', color: '#34d399' }}>
                  <span>Eco-Reward Discount:</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>
                <span>Final Payable Amount:</span>
                <span style={{ color: '#f59e0b' }}>₹{finalAmount}</span>
              </div>
            </div>

            <button
              className="btn-checkout-cta"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={onProceedToCheckout}
            >
              Proceed to Payment (₹{finalAmount}) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

