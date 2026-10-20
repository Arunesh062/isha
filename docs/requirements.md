# Sattva Life — Requirements Specification

## 1. Functional Requirements

### 1.1 Storefront & Catalogue
- Display curated holistic products across 6 primary categories: Food & Wellness, Yoga & Meditation, Body Care, Copperware, Sacred & Spiritual, Books & Wisdom.
- Provide subcategory filtering, price range filtering (Under ₹500, ₹500–₹1,000, Over ₹1,000), and sorting (Featured, Price: Low to High, Price: High to Low, Customer Rating).
- Product Detail Page with image gallery, quantity selection, feature bullet points, and stock status.
- Live search bar in Header supporting instantaneous keyword matching against product names and categories.

### 1.2 Cart & Wishlist
- Persistent cart and wishlist backed by local storage and real-time inventory validation.
- Free shipping threshold at ₹999; flat rate of ₹99 applied to orders below ₹999.
- Dynamic stock deduction warning if items exceed available stock.

### 1.3 Authentication & User Profiles
- Secure user registration and sign-in powered by Supabase Auth (JWT).
- Role segregation between `customer` and `admin`. Customers cannot self-escalate roles.
- Dedicated user profile details (full name, phone number).

### 1.4 Orders & Checkout
- Authenticated checkout workflow collecting shipping details (name, phone, address, city, state, postal code).
- Server-side atomic validation of product prices and stock availability via PostgreSQL RPC `place_order`.
- Order history tracking for authenticated customers.

### 1.5 Administration Dashboard
- Real-time inventory overview: Total items, orders received, low stock warnings (<10 items).
- Direct inventory updates (stock count and price).
- Order status management (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).

---

## 2. Non-Functional Requirements
- **Performance**: Sub-second page load times with Vite production bundling.
- **Security**: Zero client-side trust for product prices and inventory totals; all writes validated in PostgreSQL stored functions.
- **Resilience**: Client-side catalog data fallback if Supabase network connection is interrupted.
- **Scalability**: Decoupled frontend SPA and serverless Supabase backend.
