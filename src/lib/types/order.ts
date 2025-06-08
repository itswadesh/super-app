export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  type: 'course' | 'book' | 'membership';
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  notes?: string;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  couponCode?: string;
  shippingAddress?: Order['shippingAddress'];
  billingAddress?: Order['billingAddress'];
  paymentMethod: string;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  paymentId?: string;
  notes?: string;
}
