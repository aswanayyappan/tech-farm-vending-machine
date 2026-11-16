/**
 * Product Card Component
 * Touch-optimized product card displaying SKU details, size badge, stock level, price in ₹, and Add button.
 * Satisfies Rule 11 (Zero-Clutter Visual Clarity & Touch Sizing).
 */

import React from 'react';
import { ProductVariant } from '@sdds/shared';

interface ProductCardProps {
  productName: string;
  brand: string;
  variant: ProductVariant;
  onAddToCart: (variant: ProductVariant) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  productName,
  brand,
  variant,
  onAddToCart,
}) => {
  return (
    <div className="product-card">
      <div>
        <div className="product-card-header">
          <span className="product-brand">{brand}</span>
          <span className={`stock-badge ${variant.inStock ? 'in-stock' : 'out-stock'}`}>
            {variant.inStock ? `In Stock (${variant.totalAvailableStock})` : 'Out of Stock'}
          </span>
        </div>

        <h3 className="product-name">{productName}</h3>
        <p className="product-spec">
          Size <strong>{variant.size}</strong> · Pack of <strong>{variant.packQuantity} pcs</strong>
        </p>
      </div>

      <div className="product-footer">
        <div className="product-price">
          <span className="product-price-currency">₹</span>
          <span>{variant.price}</span>
        </div>

        <button
          className="btn-add-touch"
          disabled={!variant.inStock}
          onClick={() => onAddToCart(variant)}
        >
          <span>+ Add</span>
        </button>
      </div>
    </div>
  );
};

