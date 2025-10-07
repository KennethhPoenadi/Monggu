export interface Delivery {
  delivery_id: number;
  user_id1: number; // sender
  user_id2: number; // receiver
  product_id: number;
  status: string;
  created_at: string;
}

export interface DeliveryCreate {
  user_id1: number;
  user_id2: number;
  product_id: number;
  status: string;
}

export interface DeliveryUpdate {
  status?: string;
}
