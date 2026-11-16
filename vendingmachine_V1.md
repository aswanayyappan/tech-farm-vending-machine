# PRD v1.1 — Smart Diaper Vending Machine Software

Software-focused PRD

MVP specification

Implementation-ready after pending decisions

Project: Smart Diaper Vending Machine\
Project type: College prototype\
Primary focus: Vending machine application, frontend, backend, database, API integration and hardware communication.

## Truth Assessment:

The main objective is to build the software that operates the vending machine, not to design its physical enclosure or motor mechanism.

The software has five major responsibilities:

1. Customer-facing vending interface.
2. Product catalogue, cart and checkout.
3. Reward barcode validation and discount calculation.
4. Payment and order management.
5. Communication with the vending machine hardware.

The collection bin is a separate module. The vending machine software communicates with the same backend and MongoDB database to retrieve customer rewards.

# 1. Product vision

Build a touchscreen-based automated retail application that allows customers to purchase baby and adult diapers without a shop operator.

The machine starts with a digital advertisement screen. Customers touch the screen, browse available products, select their required diaper variants, scan a reward barcode, complete payment and collect the dispensed product.

The software must coordinate every stage and maintain transaction accuracy.

# 2. Software architecture

Layer 1 — Customer application

Next.js / React

Advertisement · Catalogue · Product details · Cart · Reward scanning · Checkout · Payment status

REST API over HTTPS

Layer 2 — Application backend

Node.js + Express

Authentication · Product services · Cart · Reward engine · Orders · Payment verification · Dispensing authorization

Layer 3 — Database

MongoDB

Users · Products · Inventory · Rewards · Orders · Payments · Machine events

Layer 4 — Hardware communication

Raspberry Pi / ESP32

Scanner · Dispensing controller · Sensors · Machine status

Important architectural decision: Next.js is the customer interface, Express is the business logic/API server, and ESP32 is the hardware controller. Do not put payment or discount logic inside the ESP32 firmware.

# 3. Customer application requirements

## 3.1 Advertisement / welcome screen

[CRANE Merchant 4 Media2 Ambient, Model 186 | Snack Vending Machine](https://images.openai.com/static-rsc-4/yH7UGyh_1Gza9J5eTWqxwMm8zQJ4ZfeC2QGo-QhjeSCghJhoW58X6PUL4RJ_VN7Lu3Nzy-PPrLCCL4q6-8T9eDNyxda3wDXTCL5zHmb8SmSx2lcnpWKA56PEWOEmk4EVIDVAbNaG-rBnsL_XVl7uUlJVe6mgrk9J18b76l16MsY?purpose=inline)

[vendtek.com](https://vendtek.com/product/crane-merchant-4-media-model-186/?utm_source=chatgpt.com)

Purpose: Display advertisements when the machine is idle.

Requirements:

- Full-screen advertisement carousel.
- Product promotional banners.
- Product images and offers.
- Touch-to-start interaction.
- Automatic advertisement rotation.
- Idle timeout.
- Return to welcome screen after completed or abandoned sessions.

Acceptance criteria: The machine starts in advertisement mode and transitions to shopping mode after user interaction.

## 3.2 Product catalogue

[Tillie - Simple Cash Register for Small Events](https://images.openai.com/static-rsc-4/xGJikA0UL0ZwDe3dgzczrJoEKGFt6uQh5PkAh_FXLsf01Sd11JpgJaovX0-Vj73Jq5EasdmirfDqfAUB6dMpNJpn8wzIBi32kQ8aC7Y0u83wdOztZiOdV8wfsyHf9R5vGZ1WgMWLackc5HG982_BMvuGBpNDuSJTgare17jlJbs?purpose=inline)

[tillie.it](https://tillie.it/?utm_source=chatgpt.com)

The catalogue must show:

- Baby diapers.
- Adult diapers.
- Product brands.
- Sizes.
- Pack quantities.
- Product images.
- Prices.
- Availability.

Customer navigation:

`Home → Category → Brand → Product variant → Product details`

Filtering:

- Category.
- Brand.
- Size.
- Price range.
- Availability.

Products that are out of stock must not be purchasable.

## 3.3 Product details

Every product detail page must show:

| Field         | Example            |
| ------------- | ------------------ |
| Product name  | Baby diaper        |
| Brand         | Brand A            |
| Category      | Baby               |
| Size          | M                  |
| Pack quantity | 20 pieces          |
| Price         | ₹XXX               |
| Availability  | In stock           |
| Product image | Product photograph |

The customer can select quantity and add the product to the cart.

## 3.4 Shopping cart

[retail7 Self-Checkouts POS | cashless payment](https://images.openai.com/static-rsc-4/kjrYquepTMzDUP1xSx5ilng_Lfdm27QVKToz6brvGlNQglbGFRoC9rA-kbp4kVQexlEWLbKVgCN28Ms2Td0H3IxnQuPYDaXIohE-nq_l_WX12uyvnqykiK6QNSFMjLjrS-HSOOIEEnyJiCua0bQ5pcWRd3grD4zw8k_xIAWFuZs?purpose=inline)

[lite.retail7.io](https://lite.retail7.io/us/en/self-checkout?utm_source=chatgpt.com)

Requirements:

- Add products.
- Remove products.
- Change quantities.
- Calculate subtotal.
- Display reward discount.
- Display final payable amount.
- Check stock availability.
- Prevent quantities exceeding available stock.

Example calculation:

| Description     | Amount |
| --------------- | ------ |
| Product A       | ₹500   |
| Product B       | ₹300   |
| Subtotal        | ₹800   |
| Reward discount | ₹80    |
| Final amount    | ₹720   |

Illustrative amounts only. The discount percentage and purchase limit are not finalized.

## 3.5 Reward barcode integration

[Eyoyo Bluetooth 1D Laser Barcode Scanner Mini with Display – Eyoyo scan](https://images.openai.com/static-rsc-4/u_MKcZiN8V2ix2l3CIVYmq2WOyDbWN8R4WvepFk3qrTBk9AWBkMv9T6Ykm6ZYsdFKcgu-y5OFtdXxM3rWniFEivygaMt9kBU04F-NByDgJLrDHRK5-5lf7upx9PU4W5MeCafO4775FWkrjE0M0HKHwdZs8VGtBK7vj50IRMC3y0?purpose=inline)

[eyoyoscan.com](https://eyoyoscan.com/products/eyoyo-bluetooth-1d-laser-barcode-scanner-mini-with-display?utm_source=chatgpt.com)

Purpose: Allow customers to use rewards earned through the diaper collection bin.

Workflow:

1. Customer opens the reward section at checkout.
2. Customer scans the printed Code 128 barcode.
3. USB barcode scanner sends the barcode identifier to the frontend.
4. Frontend sends the identifier to the backend.
5. Backend validates the reward.
6. Backend retrieves eligible accumulated rewards.
7. Backend calculates the discount.
8. Frontend displays the discount and updated total.

Required validation:

- Barcode exists.
- Reward belongs to a valid user.
- Reward is not expired.
- Reward is eligible for redemption.
- Reward has not already been consumed.
- Reward is not being redeemed in another active order.

Business rule: Rewards accumulate, but each earning event expires seven days after it is generated. The backend must calculate the eligible balance using individual reward records.

## 3.6 Checkout

Checkout must display:

- Product list.
- Quantities.
- Subtotal.
- Reward discount.
- Taxes, if applicable.
- Final payable amount.
- Payment option.
- Order confirmation.

The customer must explicitly confirm the order before payment begins.

## 3.7 Payment integration

The payment gateway is still undecided.

Software requirements:

- Create payment session through the backend.
- Display the payment interface or QR code supplied by the provider.
- Receive payment status.
- Verify payment server-side.
- Handle failed, pending and successful payments.
- Prevent duplicate payments and duplicate orders.

Potential payment options depend on the selected provider. UPI is a candidate for the prototype.

Security rule: A frontend success page is not proof of payment. The backend must verify the transaction before authorizing dispensing.

## 3.8 Order confirmation

After payment and dispensing:

Display:

- Order ID.
- Products purchased.
- Total paid.
- Discount used.
- Dispensing status.
- Transaction status.

Possible statuses:

`CREATED → PAYMENT_PENDING → PAID → DISPENSING → COMPLETED`

Failure states:

`PAYMENT_FAILED`, `DISPENSE_FAILED`, `REFUND_PENDING`, `CANCELLED`.

# 4. Admin dashboard requirements

[InRetail - Inventory SAAS Dashboard by Harsh Advani | UI UX Designer on Dribbble](https://images.openai.com/static-rsc-4/waZqMh70LiKNs9XZ8tsIwvZAJ0l57qtZ7556OvPTeJgut0i5lt0XoXwPSy4oYDohem_YcwZm-O3l-VeSmACzk9Eb2VJnqPZAFCCCRZlR81peNSfrQImIj25uYjdlbbgthZJvgPfYStALBci0lro7tVSzjn8hvV7QRj57iCmuXyw?purpose=inline)

[dribbble.com](https://dribbble.com/shots/27225264-InRetail-Inventory-SAAS-Dashboard?utm_source=chatgpt.com)

The administrator uses a separate protected web interface.

### 4.1 Dashboard overview

Display:

- Total sales.
- Number of orders.
- Revenue.
- Products sold.
- Available inventory.
- Low-stock products.
- Reward discounts redeemed.
- Machine online/offline status.
- Failed dispensing transactions.

### 4.2 Product management

Admin can:

- Add products.
- Edit product details.
- Upload images.
- Configure categories.
- Configure brands.
- Configure sizes.
- Configure pack quantities.
- Set prices.
- Activate/deactivate products.

### 4.3 Inventory management

Admin can:

- Add stock.
- Update stock.
- Assign products to machine slots.
- View stock availability.
- Set low-stock thresholds.
- View stock movement history.

### 4.4 Order management

Admin can:

- View all orders.
- Search by order ID.
- Filter by date.
- View payment status.
- View dispensing status.
- View failed transactions.
- Track refunds and cancellations.

### 4.5 Machine management

Admin can:

- View machine status.
- View controller connectivity.
- View last heartbeat.
- View dispensing errors.
- View slot availability.
- View machine event logs.

### 4.6 Advertisement management

Admin can:

- Upload advertisements.
- Add product banners.
- Set advertisement duration.
- Enable/disable advertisements.
- Schedule promotional content.

# 5. Backend functional modules

| Module               | Responsibility                              |
| -------------------- | ------------------------------------------- |
| User module          | Customer identity and mobile number lookup  |
| Product module       | Catalogue and product information           |
| Inventory module     | Stock and machine slot tracking             |
| Cart module          | Cart validation and totals                  |
| Reward module        | Barcode validation and discount calculation |
| Order module         | Order creation and lifecycle                |
| Payment module       | Payment creation and verification           |
| Dispensing module    | Hardware command authorization              |
| Machine module       | Connectivity and health monitoring          |
| Admin module         | Product, stock and machine management       |
| Advertisement module | Advertisement content and scheduling        |

# 6. Proposed API contract

| Method | Endpoint                    | Purpose                        |
| ------ | --------------------------- | ------------------------------ |
| GET    | `/api/products`             | Get product catalogue          |
| GET    | `/api/products/:id`         | Get product details            |
| GET    | `/api/categories`           | Get categories                 |
| POST   | `/api/cart/validate`        | Validate cart                  |
| POST   | `/api/rewards/scan`         | Validate reward barcode        |
| POST   | `/api/checkout`             | Calculate final payable amount |
| POST   | `/api/orders`               | Create order                   |
| GET    | `/api/orders/:id`           | Retrieve order                 |
| POST   | `/api/payments/create`      | Create payment                 |
| POST   | `/api/payments/webhook`     | Receive payment notification   |
| POST   | `/api/payments/verify`      | Verify payment                 |
| POST   | `/api/dispensing/authorize` | Authorize dispensing           |
| POST   | `/api/machine/events`       | Receive machine events         |
| GET    | `/api/machine/status`       | Retrieve machine status        |
| GET    | `/api/ads`                  | Retrieve advertisements        |

Admin endpoints should use a separate protected route group, such as `/api/admin/*`.

# 7. MongoDB database structure

Recommended collections:

| Collection         | Purpose                          |
| ------------------ | -------------------------------- |
| `users`            | Customer records                 |
| `products`         | Main product information         |
| `product_variants` | Sizes, pack quantities and SKUs  |
| `inventory`        | Stock per vending machine slot   |
| `reward_accounts`  | Customer reward balance summary  |
| `rewards`          | Individual barcode reward events |
| `orders`           | Customer purchase records        |
| `order_items`      | Individual products in orders    |
| `payments`         | Payment transactions             |
| `redemptions`      | Reward usage ledger              |
| `machines`         | Vending machine information      |
| `machine_slots`    | Slot-to-product assignments      |
| `dispense_events`  | Dispensing commands and results  |
| `advertisements`   | Display advertisements           |
| `admin_users`      | Admin accounts                   |

Use indexes on SKU, machine ID, order ID, barcode ID and transaction ID where appropriate.

# 8. Hardware integration requirements

The software must communicate with the hardware through a defined API/protocol.

| Hardware            | Software responsibility                                 |
| ------------------- | ------------------------------------------------------- |
| Touchscreen         | Display customer interface                              |
| USB barcode scanner | Read Code 128 identifiers                               |
| ESP32               | Control dispensing motors                               |
| Dispensing sensors  | Confirm product delivery                                |
| Raspberry Pi        | Host or run the kiosk interface and connect peripherals |
| Internet connection | Backend and payment communication                       |

The dispensing interface should be abstracted so the frontend and backend can be developed before the physical mechanism is chosen.

Example machine command:

```
{
  "commandId": "CMD001",
  "orderId": "ORD001",
  "slotId": "SLOT_A1",
  "productVariantId": "SKU001",
  "quantity": 1
}
```

Example hardware response:

```
{
  "commandId": "CMD001",
  "status": "SUCCESS",
  "dispensedQuantity": 1,
  "sensorConfirmed": true
}
```

The controller must reject repeated command IDs and must not accept commands without backend authorization.

# 9. Security and reliability requirements

These are mandatory, not optional enhancements.

1. Admin routes require authentication and authorization.
2. Machine devices require unique credentials.
3. Payment webhooks must be verified.
4. Reward redemption must be atomic.
5. Inventory must not go negative.
6. Dispensing commands must be idempotent.
7. Order and payment records must be retained for audit.
8. Customer information must not be exposed in public machine APIs.
9. Network failures must not trigger unverified dispensing.
10. After a power failure, the machine must recover its previous transaction state.

A particularly important failure case: payment succeeds but the machine loses power before dispensing. The system must retain the paid order as unresolved and support a controlled recovery or refund process. It must never blindly dispense again after restart.

# 10. Software development phases

1. Phase 1 — Frontend foundation
   - Advertisement page
   - Home page
   - Product catalogue
   - Product details
   - Cart
2. Phase 2 — Backend and database
   - Express server
   - MongoDB connection
   - Product APIs
   - Inventory APIs
   - Order models
3. Phase 3 — Reward integration
   - Barcode scanner input
   - Reward validation
   - Accumulated reward retrieval
   - Discount calculation
4. Phase 4 — Payment
   - Select payment gateway
   - Create payment
   - Verify payment
   - Handle webhook events
5. Phase 5 — Hardware integration
   - Machine communication
   - Dispensing commands
   - Sensor feedback
   - Error handling
6. Phase 6 — Admin dashboard
   - Products
   - Inventory
   - Orders
   - Advertisements
   - Machine monitoring
7. Phase 7 — Integration testing
   - Full purchase simulation
   - Reward redemption tests
   - Payment failure tests
   - Dispensing failure tests
   - Power/network recovery tests

# 11. Two-member software and hardware split

| Member 1                     | Member 2                   |
| ---------------------------- | -------------------------- |
| ESP32 firmware               | Next.js customer UI        |
| Motor and sensor integration | Node.js + Express backend  |
| Machine communication        | MongoDB schema and APIs    |
| Dispensing status            | Product catalogue and cart |
| Hardware error handling      | Rewards and payment        |
| Physical machine testing     | Admin dashboard            |
| Hardware API integration     | Integration testing        |

Both members must agree on API request/response formats before independently implementing their modules.

# 12. Remaining decisions

| Decision                  | Status                            |
| ------------------------- | --------------------------------- |
| Frontend framework        | Proposed: Next.js                 |
| Backend framework         | Proposed: Express                 |
| Database                  | MongoDB                           |
| Barcode format            | Code 128                          |
| Reward model              | Weight-based earning, accumulated |
| Reward expiry             | 7 days                            |
| Maximum discount          | Deferred                          |
| Payment gateway           | Not selected                      |
| Raspberry Pi deployment   | Undecided                         |
| Dispensing mechanism      | Undecided                         |
| Product catalogue         | Brands and SKUs pending           |
| Admin authentication      | To be implemented                 |
| Machine offline behaviour | To be specified                   |

## Fixes:

Before coding, freeze these four software decisions:

Software implementation choices

1\. Frontend

Next.js (recommended)

React + Vite

2\. Backend

Node.js + Express (recommended)

Next.js API routes

3\. Backend hosting

Cloud-hosted backend

Local Raspberry Pi backend

Hybrid: cloud backend + local machine service

4\. Customer identification during reward redemption

Barcode identifies customer reward account

Barcode plus mobile OTP verification

Confirm software architecture

## Final Verdict:

This PRD now focuses primarily on the vending machine's software product, rather than its physical construction. It can be used as the baseline specification for frontend development, backend development, database design and hardware API integration.

The recommended approach is Next.js + Express + MongoDB, with a separate hardware-control service. Avoid building the entire system as one tightly coupled application.

End.