---
name: Fresh Touch Kiosk
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#414a35'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#717a62'
  outline-variant: '#c1caae'
  surface-tint: '#426900'
  primary: '#426900'
  on-primary: '#ffffff'
  primary-container: '#9ef01a'
  on-primary-container: '#426900'
  inverse-primary: '#8edc00'
  secondary: '#4f6600'
  on-secondary: '#ffffff'
  secondary-container: '#c2f425'
  on-secondary-container: '#546d00'
  tertiary: '#006e2f'
  on-tertiary: '#ffffff'
  tertiary-container: '#61f587'
  on-tertiary-container: '#006e2f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f928'
  primary-fixed-dim: '#8edc00'
  on-primary-fixed: '#112000'
  on-primary-fixed-variant: '#304f00'
  secondary-fixed: '#c2f425'
  secondary-fixed-dim: '#a8d700'
  on-secondary-fixed: '#161f00'
  on-secondary-fixed-variant: '#3b4d00'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  price-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-kiosk: 1.25rem
  margin: 1.5rem
  margin-kiosk: 2rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system defines an interactive point-of-sale and fresh-food smart vending kiosk interface. Designed for physical touch terminals in high-traffic commercial and retail environments, the experience emphasizes frictionless browsing, tactile clarity, instant feedback, and wholesome freshness. 

The aesthetic is Modern Clean Retail infused with high-energy Electric Vitality:
- **Clarity & Hygiene:** Bright, pristine white surfaces evoke spotless food preparation and organic quality.
- **Vibrant Energy:** Sharp electric lime and chartreuse accents inject an appetite-stimulating, contemporary tech sensibility that cuts through ambient glare and guides user interactions effortlessly.
- **Physical Touch Focus:** Generous target zones, high-legibility contrasts, soft elevation tiers, and immediate tactile touch responsiveness ensure accessibility for all users across varied lighting conditions and interaction distances.

## Colors

The palette establishes an ultra-clean, high-visibility retail environment optimized for kiosk touchscreens.

- **Primary (`#9EF01A` - Electric Lime):** Drives decisive actions such as active selection rings, cart additions, primary checkout buttons, and interactive confirmation states.
- **Secondary (`#CCFF33` - Chartreuse Accent):** Acts as a high-contrast luminance layer for highlighting seasonal tags, promotional badges, active category filters, and state toggles.
- **Tertiary (`#22C55E` - Fresh Leaf Green):** Reserved for validation states, live stock confirmations, door unlock signals, and success alerts.
- **Neutral Surface Palette:**
  - `#FFFFFF`: Main card faces, header container, and checkout modal backgrounds.
  - `#F8FAFC` & `#F1F5F9`: Background canvases, side panels, and neutral category containers.
  - `#E2E8F0`: Soft structural dividers and card borders ensuring distinct separation without visual clutter.
- **Typography & Dark Contrast:**
  - `#0F172A` (Charcoal Slate): Primary titles, heavyweight pricing numbers, and high-emphasis body text.
  - `#475569` (Muted Slate): Secondary weights, metadata, product weight notations, and tax breakdowns.

## Typography

Plus Jakarta Sans brings friendly geometry, generous apertures, and robust legibility on high-resolution touch displays. 

- **Price Hierarchy:** Numerical values and currency signs always use semi-bold to extra-bold cuts (`700`-`800`) with tight tracking (`-0.02em`) to provide instantaneous price perception from standing distance.
- **Product Titles:** Limited to two lines maximum with consistent truncation rules to keep product cards strictly uniform across the grid.
- **Status & Navigation Labels:** Set in high-contrast weights (`600`-`700`) to guarantee legibility under harsh direct lighting and peripheral viewing angles.

## Layout & Spacing

Designed for vertical portrait touch displays (typically 21.5" to 32" screens in 9:16 aspect ratio):

- **Grid Architecture:** 
  - Standard kiosk view uses a 3-column product catalog grid with `gutter-kiosk` (20px) spacing to preserve comfortable 1:1 image aspect ratios and ample hit targets.
  - Side cart and checkout drawer uses a fixed structural layout occupying either a persistent top/bottom horizontal split or a right-docked drawer depending on the physical terminal width.
- **Ergonomics & Touch Zones:**
  - Top header (logo, language, saldo balance) sits in the visual comfort zone.
  - Category selector pills sit in the primary interaction horizontal strip immediately below the header.
  - Primary basket total and checkout action anchors either to the top right or sticky bottom right, reachable without stretching.
- **Hit Area Guarantee:** No interactive component possesses a physical target dimension under 48x48px, with typical card targets exceeding 180x220px.

## Elevation & Depth

Visual depth is achieved through crisp, light tonal surfaces framed by delicate structural borders, complemented by ultra-soft ambient drop shadows:

- **Level 0 (Canvas Base):** Background workspace rendered in `#F8FAFC`, creating a clean, sterile context.
- **Level 1 (Touch Cards & Category Pills):** Pure `#FFFFFF` panels finished with a `1px solid #E2E8F0` border and a delicate ambient shadow (`0 2px 8px rgba(15, 23, 42, 0.04)`).
- **Level 2 (Hover/Active Press):** Elevated cards on touch or selection gain a vibrant border ring (`2px solid #9EF01A`) and a subtle luminous lift (`0 8px 20px rgba(158, 240, 26, 0.18)`).
- **Level 3 (Sticky Drawer / Cart Summary):** Solid `#FFFFFF` container with directional top/side shadow (`0 -4px 24px rgba(15, 23, 42, 0.08)`), floating securely above the browsing grid.

## Shapes

The interface embraces a balanced rounded profile (`roundedness: 2`, 8px base, 16px for cards, and 24px+ for interactive pills):

- **Product Cards:** `16px` corner radius (`rounded-lg`), creating friendly, approachable product framing without looking childish.
- **Category Filter Badges:** Fully pill-shaped or `12px` rounded squares with integrated food iconography and labels.
- **Checkout / Quantity Increment Buttons:** Full-radius pill shapes (`9999px`) to afford immediate tactile tap readiness.
- **Image Containers:** Sits nested inside product cards with an `8px` top inner radius, maintaining a 4px inner gap cushion.

## Components

### Product Cards
- **Structure:** White card face with subtle border (`#E2E8F0`), consisting of product photography, item name, unit weight/specification (e.g., "500gr", "Gesneden"), bold bottom price, and a quick-add tap state.
- **Active / Out of Stock States:** In-stock items display clear imagery and vivid pricing; items pending harvest or empty compartments show an opaque overlay (`opacity: 0.5`) with a neutral pill badge labeled "Uitverkocht / Out of stock".

### Category Filter Strip
- **Structure:** Horizontal carousel strip featuring icons paired with category names (e.g., "Fruit", "Groenten", "Soepen", "Verspakket").
- **State Styling:** Unselected pills use `#F1F5F9` background with slate icons and text. Selected pills trigger an electric lime fill (`#9EF01A`) or chartreuse outline with deep charcoal `#0F172A` typography.

### Shopping Basket & Status Bar
- **Order Summary:** Displays item list, compartment locker numbers, item count badge, subtotal, and tax specifications.
- **Saldo Indicator:** Clean white badge showing current card/wallet balance ("HUIDIG SALDO: € 9,10") with high-contrast text.
- **Primary Checkout Button:** High-visibility electric lime (`#9EF01A`) button with dark charcoal bold text (`#0F172A`), cart icon, and total amount.

### Tactile Touch Inputs & Buttons
- **Quantity Adjusters:** Large circular or rounded square plus/minus steppers with a minimum hit zone of 44x44px.
- **Confirmation Modals:** Centered dialogs with oversized confirmation buttons to finalize locker opening and payment authorization.