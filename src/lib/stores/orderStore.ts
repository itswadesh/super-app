import { writable } from 'svelte/store';
import type { Order, OrderItem, OrderState } from '$lib/types/order';

export const orderStore = (() => {
  const { subscribe, set, update } = writable<OrderState>({
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,
    
    async createOrder(items: OrderItem[]) {
      update(s => ({ ...s, isLoading: true, error: null }));
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        const data = await response.json();
        update(s => ({
          ...s,
          currentOrder: data.order,
          isLoading: false
        }));
        return data.order;
      } catch (error) {
        update(s => ({
          ...s,
          error: 'Failed to create order',
          isLoading: false
        }));
        throw error;
      }
    },

    async getOrder(orderId: string) {
      update(s => ({ ...s, isLoading: true, error: null }));
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        update(s => ({
          ...s,
          currentOrder: data.order,
          isLoading: false
        }));
        return data.order;
      } catch (error) {
        update(s => ({
          ...s,
          error: 'Failed to fetch order',
          isLoading: false
        }));
        throw error;
      }
    },

    async getOrders() {
      update(s => ({ ...s, isLoading: true, error: null }));
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        update(s => ({
          ...s,
          orders: data.orders,
          isLoading: false
        }));
        return data.orders;
      } catch (error) {
        update(s => ({
          ...s,
          error: 'Failed to fetch orders',
          isLoading: false
        }));
        throw error;
      }
    },

    clearCurrentOrder() {
      update(s => ({ ...s, currentOrder: null }));
    },
    
    clearError() {
      update(s => ({ ...s, error: null }));
    }
  };
})();
