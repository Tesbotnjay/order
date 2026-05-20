import { create } from 'zustand';
import { supabase } from '../utils/supabase';

interface Order {
  id: string;
  order_id: string;
  buyer_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  nominal: number;
  form_data: Record<string, unknown>;
  asset_urls: Record<string, unknown> | null;
  slug: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderState {
  currentOrder: Order | null;
  myOrders: Order[];
  setCurrentOrder: (order: Order | null) => void;
  fetchMyOrders: (buyerId: string) => Promise<void>;
  fetchOrder: (orderId: string, buyerId: string) => Promise<Order | null>;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrder: null,
  myOrders: [],

  setCurrentOrder: (order) => set({ currentOrder: order }),

  fetchMyOrders: async (buyerId) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });
    if (data) set({ myOrders: data as Order[] });
  },

  fetchOrder: async (orderId, buyerId) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('buyer_id', buyerId)
      .single();
    if (data) {
      set({ currentOrder: data as Order });
      return data as Order;
    }
    return null;
  },
}));

export type { Order };
