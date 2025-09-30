export interface Product {
  product_id: number;
  user_id: number;
  product_name: string;
  expiry_date: string;
  count: number;
  type_product: string;
  image_url?: string;
  created_at: string;
}

export interface ProductCreate {
  product_name: string;
  expiry_date: string;
  count: number;
  type_product: string;
  image_url?: string;
}

export interface ProductUpdate {
  product_name?: string;
  expiry_date?: string;
  count?: number;
  type_product?: string;
  image_url?: string;
}
