'use client';

/**
 * Smart Diaper Vending Machine Master Kiosk UI Orchestrator
 * Adheres strictly to Rule 11 (Pristine Touch-Optimized Kiosk UI, Deterministic States).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DiaperCategory, DiaperSize, ProductVariant } from '@sdds/shared';
import { ProductCatalogueItem } from '../../../../vending-backend/src/services/product.service.js';
import { AdCarousel } from '../components/AdCarousel.js';
import { CategoryFilter } from '../components/CategoryFilter.js';
import { ProductCard } from '../components/ProductCard.js';
import { CartDrawer, CartItem } from '../components/CartDrawer.js';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.js';
import { PaymentModal } from '../components/PaymentModal.js';
import { DispensingModal } from '../components/DispensingModal.js';
import { IdleWarningModal } from '../components/IdleWarningModal.js';
import { useIdleTimer } from '../hooks/useIdleTimer.js';
import '../styles/kiosk.css';

export default function KioskApp() {
  // 1. Kiosk State Machine Modes
  const [isIdle, setIsIdle] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<DiaperCategory>('baby');
  const [selectedSize, setSelectedSize] = useState<DiaperSize | null>(null);

  // 2. Catalogue State
  const [catalogue, setCatalogue] = useState<ProductCatalogueItem[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState<boolean>(true);

  // 3. Cart & Reward State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [appliedReward, setAppliedReward] = useState<{ barcode: string; discountAmount: number; percentage: number } | null>(null);

  // 4. Checkout & Fulfillment State
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isDispensingOpen, setIsDispensingOpen] = useState<boolean>(false);

  // Reset entire kiosk session back to welcome screen (Hygiene protocol)
  const resetSession = useCallback(() => {
    setCartItems([]);
    setAppliedReward(null);
    setIsCartOpen(false);
    setIsScannerOpen(false);
    setIsPaymentOpen(false);
    setIsDispensingOpen(false);
    setActiveOrderId(null);
    setSelectedSize(null);
    setIsIdle(true);
  }, []);

  // Idle Timer: auto-resets abandoned cart after 60 seconds (Rule 11)
  const { isWarningActive, secondsRemaining, resetTimer } = useIdleTimer({
    timeoutSeconds: 60,
    warningSeconds: 10,
    onIdle: resetSession,
    enabled: !isIdle && !isPaymentOpen && !isDispensingOpen,
  });

  // Fetch catalogue from Backend
  useEffect(() => {
    let isSubscribed = true;
    const fetchProducts = async () => {
      setLoadingCatalogue(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (selectedSize) queryParams.append('size', selectedSize);

        const res = await fetch(`http://localhost:4000/api/v1/products?${queryParams.toString()}`);
        const json = await res.json();
        if (isSubscribed && json.success) {
          setCatalogue(json.data);
        }
      } catch (err) {
        console.error('Failed to load catalogue:', err);
      } finally {
        if (isSubscribed) setLoadingCatalogue(false);
      }
    };

    fetchProducts();
    return () => {
      isSubscribed = false;
    };
  }, [selectedCategory, selectedSize]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedReward) return 0;
    return Math.round((subtotal * appliedReward.percentage) / 100);
  }, [subtotal, appliedReward]);

  const finalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Cart actions
  const handleAddToCart = (variant: ProductVariant, productName: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.variant._id === variant._id);
      if (existing) {
        return prev.map((item) =>
          item.variant._id === variant._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { variant, productName, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.variant._id === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variant._id !== variantId));
  };

  // Checkout workflow
  const handleProceedToCheckout = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productVariantId: item.variant._id,
            quantity: item.quantity,
          })),
          barcodeId: appliedReward?.barcode,
          paymentMethod: 'UPI_QR',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize order.');
      }

      setActiveOrderId(data.data._id);
      setIsCartOpen(false);
      setIsPaymentOpen(true);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handlePaymentConfirmed = () => {
    setIsPaymentOpen(false);
    setIsDispensingOpen(true);
  };

  return (
    <div className="kiosk-container">
      {/* 1. Fullscreen Idle Ad Carousel */}
      {isIdle && <AdCarousel onStart={() => setIsIdle(false)} />}

      {/* 2. Top Kiosk Navigation Header */}
      <header className="kiosk-header">
        <div className="kiosk-logo-title" onClick={resetSession} style={{ cursor: 'pointer' }}>
          <div className="kiosk-logo-badge">SD</div>
          <div>
            <h1 className="kiosk-title">Smart Diaper Kiosk</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Touchscreen Automated Dispensing Unit</p>
          </div>
        </div>

        <div className="kiosk-meta">
          <div className="kiosk-status-pill">
            <span style={{ fontSize: '10px' }}>●</span>
            <span>Online & Ready</span>
          </div>

          <button
            className="category-btn"
            style={{ minHeight: '44px', padding: '0 20px', fontSize: '15px' }}
            onClick={resetSession}
          >
            🔄 End Session
          </button>
        </div>
      </header>

      {/* 3. Category & Size Filter Tabs */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
      />

      {/* 4. Product Catalogue Grid */}
      <main className="catalogue-container">
        {loadingCatalogue ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
            <div className="dispense-spinner" />
            <p style={{ fontSize: '20px', color: '#94a3b8' }}>Loading product variants...</p>
          </div>
        ) : catalogue.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '24px', color: '#94a3b8' }}>No products found for this filter.</p>
          </div>
        ) : (
          catalogue.flatMap((product) =>
            product.variants.map((variant) => (
              <ProductCard
                key={variant._id}
                productName={product.name}
                brand={product.brand}
                variant={variant}
                onAddToCart={(v) => handleAddToCart(v, product.name)}
              />
            ))
          )
        )}
      </main>

      {/* 5. Bottom Floating Cart Summary Bar */}
      {cartItems.length > 0 && (
        <footer className="cart-floating-bar">
          <div className="cart-summary-text">
            <span>Selected Items: <strong>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong></span>
            <span className="cart-summary-amount">₹{finalAmount}</span>
            {discountAmount > 0 && (
              <span style={{ marginLeft: '12px', color: '#34d399', fontSize: '16px', fontWeight: 700 }}>
                (Saved ₹{discountAmount}!)
              </span>
            )}
          </div>

          <button className="btn-checkout-cta" onClick={() => setIsCartOpen(true)}>
            View Cart & Checkout →
          </button>
        </footer>
      )}

      {/* 6. Modals */}
      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          subtotal={subtotal}
          discountAmount={discountAmount}
          finalAmount={finalAmount}
          appliedBarcode={appliedReward?.barcode}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onOpenBarcodeScanner={() => setIsScannerOpen(true)}
          onProceedToCheckout={handleProceedToCheckout}
          onCloseCart={() => setIsCartOpen(false)}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          subtotal={subtotal}
          onApplyReward={(barcode, discount, pct) => {
            setAppliedReward({ barcode, discountAmount: discount, percentage: pct });
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isPaymentOpen && activeOrderId && (
        <PaymentModal
          orderId={activeOrderId}
          finalAmount={finalAmount}
          onPaymentSuccess={handlePaymentConfirmed}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {isDispensingOpen && activeOrderId && (
        <DispensingModal
          orderId={activeOrderId}
          onFinish={resetSession}
        />
      )}

      {/* 7. Idle Session Warning */}
      {isWarningActive && (
        <IdleWarningModal
          secondsRemaining={secondsRemaining}
          onStay={resetTimer}
        />
      )}
    </div>
  );
}

