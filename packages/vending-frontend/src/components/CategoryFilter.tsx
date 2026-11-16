/**
 * Category & Size Filter Bar Component
 * High touch ergonomics for category switching and size filtering.
 * Satisfies Rule 11 (Touch Ergonomics & Filtering).
 */

import React from 'react';
import { DiaperCategory, DiaperSize } from '@sdds/shared';

interface CategoryFilterProps {
  selectedCategory: DiaperCategory;
  onSelectCategory: (category: DiaperCategory) => void;
  selectedSize: DiaperSize | null;
  onSelectSize: (size: DiaperSize | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSize,
  onSelectSize,
}) => {
  const sizes: DiaperSize[] = ['S', 'M', 'L', 'XL'];

  return (
    <div className="filter-bar">
      <div className="category-tabs">
        <button
          className={`category-btn ${selectedCategory === 'baby' ? 'active' : ''}`}
          onClick={() => onSelectCategory('baby')}
        >
          👶 Baby Diapers
        </button>
        <button
          className={`category-btn ${selectedCategory === 'adult' ? 'active' : ''}`}
          onClick={() => onSelectCategory('adult')}
        >
          🧑 Adult Diapers
        </button>
      </div>

      <div className="size-filter-group">
        <span style={{ fontSize: '16px', color: '#94a3b8', marginRight: '6px' }}>Size:</span>
        {sizes.map((size) => (
          <button
            key={size}
            className={`size-pill ${selectedSize === size ? 'active' : ''}`}
            onClick={() => onSelectSize(selectedSize === size ? null : size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};

