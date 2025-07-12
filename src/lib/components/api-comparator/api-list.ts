// List of API endpoints to compare
// APIs that can be called without authentication
const publicApis = [
  '/api/delay/:ms',
  '/api/home',
  '/api/init',
  '/api/stores/android-app-json',
  '/api/pages/:id',
  '/api/es/pages',
  '/api/pages',
  '/api/es/autocomplete',
  '/api/popular-search',
  '/api/banners',
  '/api/banners/group',
  '/api/blogs',
  '/api/blogs/:id',
  '/api/collections',
  '/api/brand-collections',
  '/api/stones',
  '/api/deals',
  '/api/es/categories/:id',
  '/api/categories',
  '/api/categories/megamenu',
  '/api/countries',
  '/api/countries/all',
  '/api/es/countries',
  '/api/states',
  '/api/brands',
  '/api/faqs',
  '/api/es/faqs',
  '/api/es/products/:id',
  '/api/es/products2/:id',
  '/api/es/reviews',
  '/api/reviews/top',
  '/api/reviews/product-reviews',
  '/api/pricings',
  '/api/es/vendors',
  '/api/vendors',
  '/api/vendors/:id',
];

// APIs that require authentication
const protectedApis = [
  '/api/products/increment-popularity',
  '/api/cart',
  '/api/orders',
  '/api/account',
  '/api/wishlist',
  '/api/checkout',
  '/api/addresses',
  '/api/payment-methods',
  '/api/order-history',
  '/api/notifications'
];

// Combine all APIs for backward compatibility
const allApis = [...publicApis, ...protectedApis];

export { publicApis, protectedApis, allApis };
