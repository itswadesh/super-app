// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}

// Define the structure expected by Google Analytics
type GTagItem = {
  item_id: string;
  item_name: string;
  affiliation: string;
  item_brand: string;
  item_category: string;
  price: number;
  quantity: number;
  coupon?: string;
  currency: string;
  discount?: number; // Only the numeric discount amount for GA
  index: number;
};

interface GTagEventParams {
  [key: string]: unknown;
  items?: GTagItem[];
  currency?: string;
  value?: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  search_term?: string;
  event_time?: string;
  event_day?: string;
  event_month?: string;
  transaction_id?: string;
  affiliation?: string;
  total?: number;
  orderNo?: string;
}

interface SourceItem {
  _id?: string;
  id?: string;
  name?: string;
  vendorBusinessName?: string;
  brandName?: string;
  brand?: string;
  categoryName?: string;
  category?: string;
  price?: number | string;
  qty?: number | string;
  discount?: {
    code?: string;
    amount?: number | string;
    type?: 'percentage' | 'fixed';
    percentage?: number | string;
  } | number | null;
  coupon?: {
    code?: string;
    amount?: number | string;
  } | string | null;
  [key: string]: unknown;
}

// Helper function to safely convert a value to a number
const toNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

// Helper function to safely convert a value to a string
const safeToString = (value: unknown, defaultValue = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

// Function to convert SourceItem to GTagItem
const convertToGTagItem = (item: SourceItem, index: number): GTagItem => {
  // Extract basic item info
  const itemId = safeToString(item._id || item.id);
  const itemName = safeToString(item.name);
  const brand = safeToString(item.brandName || item.brand);
  const category = safeToString(item.categoryName || item.category);
  const price = toNumber(item.price);
  const quantity = toNumber(item.qty, 1);
  
  // Process discount and coupon information
  let discountAmount = 0;
  let couponCode = '';
  
  // Handle discount if present
  if (item.discount) {
    if (typeof item.discount === 'object' && item.discount !== null) {
      // Handle discount object with amount or percentage
      if ('amount' in item.discount) {
        discountAmount = toNumber(item.discount.amount);
      } else if ('percentage' in item.discount) {
        // Convert percentage to amount
        const percentage = toNumber(item.discount.percentage);
        discountAmount = (price * percentage) / 100;
      }
      
      // Get discount code if available
      if (item.discount.code) {
        couponCode = safeToString(item.discount.code);
      }
    } else if (typeof item.discount === 'number') {
      discountAmount = item.discount;
    }
  }
  
  // Handle coupon if provided separately
  if (item.coupon) {
    if (typeof item.coupon === 'object' && item.coupon !== null) {
      // Get coupon code
      if (item.coupon.code) {
        couponCode = safeToString(item.coupon.code);
      }
      
      // Use coupon amount if no discount amount was set
      if (discountAmount === 0 && 'amount' in item.coupon) {
        discountAmount = toNumber(item.coupon.amount);
      }
    } else if (typeof item.coupon === 'string') {
      couponCode = item.coupon;
    }
  }

  // Build the GTag item
  const gtagItem: GTagItem = {
    item_id: itemId,
    item_name: itemName,
    affiliation: safeToString(item.vendorBusinessName),
    item_brand: brand,
    item_category: category,
    price: price,
    quantity: quantity,
    currency: 'INR',
    index: index,
  };
  
  // Only add discount if there is one
  if (discountAmount > 0) {
    gtagItem.discount = discountAmount;
  }
  
  // Only add coupon if there is one
  if (couponCode) {
    gtagItem.coupon = couponCode;
  }
  
  return gtagItem;
};

export const fireGTagEvent = (eventName: string, data: GTagEventParams = {}) => {
  // Skip if not in browser or gtag is not available
  if (typeof window === 'undefined' || !window.gtag || typeof window.gtag !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('gtag is not available. Event not sent:', { eventName, data });
    }
    return;
  }

  // Convert source items to GTag items if present
  const safeData = { ...data };
  
  if (Array.isArray(safeData.items)) {
    safeData.items = safeData.items.map(convertToGTagItem);
  }

  // Format date and time for the event
  const now = new Date();
  const eventTime = now.toISOString();
  const eventDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const eventMonth = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][now.getMonth()];

  // Add additional event parameters
  const eventParams: GTagEventParams = {
    ...safeData,
    event_time: eventTime,
    event_day: eventDay,
    event_month: eventMonth,
  };

  // Send the event to Google Analytics
  window.gtag('event', eventName, eventParams);
};
