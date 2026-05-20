import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; created_at: string };
        Insert: { id: string; full_name: string };
        Update: { full_name?: string };
      };
      orders: {
        Row: {
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
        };
      };
      settings: {
        Row: {
          id: number;
          basic_price: number;
          premium_price: number;
          basic_label: string;
          premium_label: string;
          basic_description: string;
          premium_description: string;
          store_open: boolean;
          qris_image_url: string | null;
          whatsapp_number: string | null;
          telegram_chat_id: string | null;
          updated_at: string;
        };
      };
    };
  };
};
