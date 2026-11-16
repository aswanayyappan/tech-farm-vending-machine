/**
 * Idle Advertisement Carousel Component
 * Auto-cycles product promotions and offers until customer touches screen.
 * Satisfies Rule 11 (Idle Mode & Touch-to-Start).
 */

import React, { useState, useEffect } from 'react';

interface AdSlide {
  badge: string;
  headline: string;
  subtext: string;
}

const SAMPLE_ADS: AdSlide[] = [
  {
    badge: 'Eco-Reward Initiative',
    headline: 'Deposit Diapers, Earn Instant Discounts',
    subtext: 'Scan your collection bin barcode at checkout to unlock up to 50% discount on your purchase.',
  },
  {
    badge: 'Baby Care Essentials',
    headline: 'Premium Dryness for All-Night Sleep',
    subtext: 'MamyPoko & Pampers diaper pants with magic absorb gel in sizes S, M, L, and XL.',
  },
  {
    badge: 'Dignified Adult Care',
    headline: 'Friends & Kare In Adult Incontinence Pants',
    subtext: 'Soft, breathable overnight protection with wetness indicator and odor lock technology.',
  },
];

interface AdCarouselProps {
  onStart: () => void;
}

export const AdCarousel: React.FC<AdCarouselProps> = ({ onStart }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const slide = SAMPLE_ADS[currentSlideIndex];

  return (
    <div className="ad-screen" onClick={onStart}>
      <div className="kiosk-logo-title">
        <div className="kiosk-logo-badge">SD</div>
        <span className="kiosk-title">Smart Diaper Kiosk</span>
      </div>

      <div className="ad-slide-content">
        <span className="ad-badge">{slide.badge}</span>
        <h1 className="ad-headline">{slide.headline}</h1>
        <p className="ad-subtext">{slide.subtext}</p>
      </div>

      <button className="ad-cta-button" onClick={onStart}>
        <span>Touch Screen to Start Shopping</span>
        <span style={{ fontSize: '32px' }}>→</span>
      </button>
    </div>
  );
};

