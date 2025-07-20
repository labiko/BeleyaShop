export interface Order {
  id?: number;
  order_number?: string;
  customer_phone?: string;
  customer_location_lat?: number;
  customer_location_lng?: number;
  customer_location_accuracy?: number;
  customer_address?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  whatsapp_message?: string;
  created_at?: string;
  updated_at?: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at?: string;
}