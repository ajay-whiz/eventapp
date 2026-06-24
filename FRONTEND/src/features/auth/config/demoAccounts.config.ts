export type DemoAccountAccent = 'violet' | 'cyan' | 'emerald';

export type DemoAccount = {
  id: string;
  role: string;
  description: string;
  email: string;
  password: string;
  highlights: string[];
  accent: DemoAccountAccent;
};

// TODO: Replace placeholder credentials with real seeded accounts before sharing with prospects.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'super-admin',
    role: 'Super Admin',
    description: 'Full platform access — venues, vendors, bookings, and roles.',
    email: 'superadmin@demo.com',
    password: 'Demo@123',
    highlights: ['Dashboard', 'Venue & vendor catalog', 'Booking management'],
    accent: 'violet',
  },
  {
    id: 'enterprise-admin',
    role: 'Enterprise Admin',
    description: 'Venues and employees scoped to one enterprise tenant.',
    email: 'enterprise@demo.com',
    password: 'Demo@123',
    highlights: ['Enterprise venues', 'Employee management'],
    accent: 'cyan',
  },
  {
    id: 'enterprise-employee',
    role: 'Enterprise Employee',
    description: 'Operational access — venue listings, albums, and locations.',
    email: 'employee@demo.com',
    password: 'Demo@123',
    highlights: ['Venue listings', 'Albums & locations'],
    accent: 'emerald',
  },
];

export type ProductTourStep = {
  step: number;
  title: string;
  description: string;
};

export const PRODUCT_TOUR_HEADLINE =
  'Your entire event marketplace, managed from one place.';

export const PRODUCT_TOUR_LEAD =
  'Publish venues on the web. Let organizers discover and book on mobile. Every update, offer, and confirmation flows through the same platform — no calls, no spreadsheets.';

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    step: 1,
    title: 'Publish your catalog',
    description:
      'Add venues, services, and vendors through this portal. Set categories, pricing, photos, and availability — your team manages everything without touching code.',
  },
  {
    step: 2,
    title: 'Organizers browse and book',
    description:
      'Event organizers discover your listings on the mobile app — sorted by distance, category, and price. They submit booking requests directly, with all their event details attached.',
  },
  {
    step: 3,
    title: 'Negotiate, confirm, and track',
    description:
      'Review requests, send counter-offers, and confirm bookings from your dashboard. Both sides get real-time notifications at every step — nothing falls through the cracks.',
  },
];

export type TrustSignalIcon = 'lock' | 'building' | 'bell';

export type TrustSignal = {
  icon: TrustSignalIcon;
  label: string;
};

export const TRUST_SIGNALS: TrustSignal[] = [
  { icon: 'lock', label: 'JWT-secured roles' },
  { icon: 'building', label: 'Multi-tenant ready' },
  { icon: 'bell', label: 'Real-time push' },
];

export const MOBILE_APP_LINKS = {
  appStoreUrl: import.meta.env.VITE_APP_STORE_URL ?? '',
  playStoreUrl: import.meta.env.VITE_PLAY_STORE_URL ?? '',
};

export const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';
