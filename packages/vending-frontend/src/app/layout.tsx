import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Diaper Vending Machine Kiosk',
  description: 'Automated Touchscreen Diaper Vending and Reward Redemption Kiosk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>{children}</body>
    </html>
  );
}

