/**
 * Structured knowledge base for Sattva Life.
 *
 * Categorized strictly into:
 * 1. VERIFIED_KNOWLEDGE (ownerApproved: true) - verified against storefront UI copy, trust badges, footer, and checkout logic.
 * 2. PENDING_OWNER_CONFIRMATION (ownerApproved: false) - placeholder assumptions that must be confirmed by the business owner before Gemini AI cites them.
 */

export interface KnowledgeEntry {
  id: string;
  topic: 'Shipping' | 'Payments' | 'Support' | 'Products' | 'Returns';
  question: string;
  answer: string;
  ownerApproved: boolean;
  sourceReference?: string;
}

export interface PolicySection {
  id: string;
  title: string;
  content: string;
  ownerApproved: boolean;
  sourceReference?: string;
}

export interface CategoryGuidance {
  id: string;
  name: string;
  summary: string;
  keyProducts: string[];
  wellnessBenefits: string[];
  shoppingTips: string[];
}

// ─── 1. VERIFIED FAQS (Grounded in existing UI & Server Rules) ─────────────

export const VERIFIED_FAQS: KnowledgeEntry[] = [
  {
    id: 'faq-shipping-free',
    topic: 'Shipping',
    question: 'Is shipping free?',
    answer: 'Yes. Shipping is free on all orders of ₹999 or above. Orders below ₹999 incur a flat ₹99 delivery charge.',
    ownerApproved: true,
    sourceReference: 'TrustBadges.tsx, Header.tsx, CheckoutPage.tsx, place_order RPC',
  },
  {
    id: 'faq-cod',
    topic: 'Payments',
    question: 'Is Cash on Delivery (COD) available?',
    answer: 'Cash on delivery (COD) is available across India for orders above ₹3,000.',
    ownerApproved: true,
    sourceReference: 'TrustBadges.tsx, Header.tsx announcement bar',
  },
  {
    id: 'faq-contact',
    topic: 'Support',
    question: 'How can I contact customer support?',
    answer: 'You can reach our dedicated support team at 8010 479480, Monday to Saturday, 10:00 AM – 5:00 PM IST.',
    ownerApproved: true,
    sourceReference: 'Header.tsx, Footer.tsx',
  },
  {
    id: 'faq-natural-organic',
    topic: 'Products',
    question: 'Are your products natural and organic?',
    answer: 'All Sattva Life products are formulated with natural ingredients free of harsh synthetic chemicals. Products that are certified organic carry clear certification badges and details on their product pages.',
    ownerApproved: true,
    sourceReference: 'TrustBadges.tsx ("100% Certified Organic")',
  },
  {
    id: 'faq-payment-methods',
    topic: 'Payments',
    question: 'What payment options can I use during checkout?',
    answer: 'The store supports Cash on Delivery and Sandbox Demo Payment for test orders.',
    ownerApproved: true,
    sourceReference: 'CheckoutPage.tsx, database orders table check constraint',
  },
];

// ─── 2. VERIFIED SHIPPING POLICIES ─────────────────────────────────────────

export const VERIFIED_SHIPPING_POLICY: PolicySection[] = [
  {
    id: 'ship-pan-india',
    title: 'Pan-India Domestic Delivery',
    content: 'We deliver across India. Orders of ₹999 and above receive complimentary free shipping. For orders under ₹999, a flat shipping fee of ₹99 is added at checkout.',
    ownerApproved: true,
    sourceReference: 'TrustBadges.tsx, place_order SQL function',
  },
  {
    id: 'ship-cod-policy',
    title: 'Cash on Delivery Threshold',
    content: 'Cash on delivery is offered on qualifying orders of ₹3,000 or higher.',
    ownerApproved: true,
    sourceReference: 'Header.tsx announcement bar',
  },
];

// ─── 3. PRODUCT CATEGORY SHOPPING GUIDANCE ─────────────────────────────────

export const CATEGORY_GUIDANCE: CategoryGuidance[] = [
  {
    id: 'food-wellness',
    name: 'Food & Wellness',
    summary: 'Nourishing natural foods, adaptogenic herbal supplements, raw forest honey, and traditional immunity teas.',
    keyProducts: ['Tulsi Ginger Herbal Tea', 'Ashwagandha Root Powder', 'Raw Forest Honey', 'Triphala Herbal Supplement'],
    wellnessBenefits: [
      'Stress reduction and cortisol balance with Ashwagandha',
      'Digestive cleanse and gentle detox with Triphala',
      'Daily immunity and respiration support with pure Tulsi and wild honey',
    ],
    shoppingTips: [
      'Ashwagandha is best taken with warm milk or water in the evening.',
      'Wild forest honey is unprocessed and should never be heated directly in boiling liquids.',
    ],
  },
  {
    id: 'yoga',
    name: 'Yoga & Meditation',
    summary: 'Eco-conscious yoga mats, organic cotton carrying bags, and buckwheat hull meditation cushions.',
    keyProducts: ['Cork Yoga Mat (6mm)', 'Organic Cotton Mat Bag', 'Buckwheat Meditation Cushion Set', 'Cotton Yoga Strap'],
    wellnessBenefits: [
      'Joint cushioning and natural grip with sustainable cork and natural rubber',
      'Spinal alignment and comfort during extended seated meditation with buckwheat hull bolsters',
    ],
    shoppingTips: [
      'Cork mats provide enhanced grip as you sweat and are naturally antimicrobial.',
      'Meditation cushions conform to pelvic curvature for upright sitting posture.',
    ],
  },
  {
    id: 'body-care',
    name: 'Body Care',
    summary: 'Chemical-free face washes, nourishing sandalwood lotions, herbal Bhringraj hair oils, and beeswax solid perfumes.',
    keyProducts: ['Apple & Papaya Face Wash', 'Sandalwood Body Lotion', 'Bhringraj Hair Oil', 'Jasmine Beeswax Solid Perfume'],
    wellnessBenefits: [
      'Gentle fruit-enzyme cleansing without stripping skin moisture',
      'Cooling and skin-toning properties of natural sandalwood',
      'Scalp nourishment and hair root strengthening with traditional Bhringraj and Amla',
    ],
    shoppingTips: [
      'Solid beeswax perfume is alcohol-free, compact (4gm), and suitable for sensitive skin.',
      'Warm Bhringraj oil slightly before gently massaging into scalp.',
    ],
  },
  {
    id: 'copperware',
    name: 'Copperware',
    summary: 'Handcrafted pure copper glasses, seamless 900ml water bottles, and artisanal serving sets.',
    keyProducts: ['Copper Drinking Glass (200ml)', 'Copper Water Bottle (900ml)', 'Copper Serving Bowl Set', 'Copper Gift Hamper'],
    wellnessBenefits: [
      'Traditional Ayurvedic practice of storing water overnight (Tamra Jal) for natural ion balance',
      'Durable, plastic-free alternative for daily hydration',
    ],
    shoppingTips: [
      'Clean copper with natural lemon juice and salt or tamarind paste; avoid harsh abrasive steel wool.',
      'Store plain, room-temperature water only — avoid acidic or citrus drinks in copper vessels.',
    ],
  },
  {
    id: 'sacred',
    name: 'Sacred & Spiritual',
    summary: 'Authentic 108-bead consecrated Rudraksha malas, natural hand-rolled incense sticks, and brass Aarti stands.',
    keyProducts: ['Consecrated Rudraksha Mala', 'Natural Incense Sticks (100-pack)', 'Brass Aarti Stand', 'Meditation Candle Set'],
    wellnessBenefits: [
      'Focus and energy stabilization during mantra chanting (Japa)',
      'Aromatic purification of living spaces with chemical-free herbal incense',
    ],
    shoppingTips: [
      'Condition Rudraksha beads periodically with a drop of natural oil to maintain longevity.',
      'Burn incense in well-ventilated areas away from flammable materials.',
    ],
  },
  {
    id: 'books',
    name: 'Books & Wisdom',
    summary: 'Insightful yogic literature, practical wholesome cookbooks, sacred audio CDs, and downloadable memory guides.',
    keyProducts: ['Enlightenment — A New Beginning', 'A Taste of Well-Being (Recipes)', 'Yogic Chants Audio CD', 'Mind & Memory Digital Guide'],
    wellnessBenefits: [
      'Philosophical clarity and inspirational guidance for spiritual seekers',
      'Wholesome culinary practices aligning diet with energy levels',
    ],
    shoppingTips: [
      'Digital guides provide instant downloadable access immediately after purchase.',
      'Audio chants can be played during morning routines or quiet meditation sessions.',
    ],
  },
];

// ─── 4. PENDING OWNER CONFIRMATION (Unverified Assumptions) ─────────────────
// These items were present in initial drafts but have NO backing in active UI copy.
// They MUST NOT be presented as settled facts by the AI assistant until confirmed.

export const PENDING_OWNER_CONFIRMATION: PolicySection[] = [
  {
    id: 'pending-delivery-timeframe',
    title: 'Estimated Delivery Timeframe',
    content: 'Draft claims 5–7 business days across India and 3–5 days in metro cities. Actual shipping carrier SLAs need confirmation.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; needs courier SLA confirmation',
  },
  {
    id: 'pending-order-tracking',
    title: 'SMS & Email Tracking Links',
    content: 'Draft claims automatic SMS/email tracking links upon dispatch. Requires confirmation of courier webhook integration.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; requires notification pipeline verification',
  },
  {
    id: 'pending-order-processing',
    title: 'Warehouse Processing Time',
    content: 'Draft claims dispatch within 1–2 business days. Requires warehouse fulfillment schedule sign-off.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; needs operational fulfillment agreement',
  },
  {
    id: 'pending-returns-window',
    title: 'Return Window & Eligibility',
    content: 'Draft claims a 7-day return window for unopened products. No formal return policy exists on current storefront.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; needs commercial return policy definition',
  },
  {
    id: 'pending-refund-timeline',
    title: 'Refund Processing Timeline',
    content: 'Draft claims refunds are processed within 7–10 business days after receipt. Payment gateway refund SLA needs confirmation.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; needs banking/finance policy sign-off',
  },
  {
    id: 'pending-non-returnable',
    title: 'Non-Returnable Product Exceptions',
    content: 'Draft claims food, supplements, honey, and sacred items are non-returnable. Return exceptions list needs official sign-off.',
    ownerApproved: false,
    sourceReference: 'Unconfirmed draft; hygiene & consumable policy requires review',
  },
];

// ─── 5. HELPER UTILITIES (For Gemini AI Grounding & Frontend Access) ────────

export function getVerifiedKnowledge(): KnowledgeEntry[] {
  return VERIFIED_FAQS;
}

export function getVerifiedShippingPolicy(): PolicySection[] {
  return VERIFIED_SHIPPING_POLICY;
}

export function getCategoryGuidance(categoryId?: string): CategoryGuidance[] {
  if (!categoryId || categoryId === 'all') {
    return CATEGORY_GUIDANCE;
  }
  return CATEGORY_GUIDANCE.filter((c) => c.id === categoryId);
}

export function getPendingPoliciesForReview(): PolicySection[] {
  return PENDING_OWNER_CONFIRMATION;
}

// Backwards compatibility aliases
export const faqs = VERIFIED_FAQS;
export const shippingPolicy = VERIFIED_SHIPPING_POLICY;
export const returnPolicy = PENDING_OWNER_CONFIRMATION;
