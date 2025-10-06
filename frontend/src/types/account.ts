export interface Account {
  user_id: number; // Primary key, auto-increment
  email: string;
  name: string;
  is_panitia?: boolean;
  created_at: string;
}

export interface AccountCreate {
  email: string;
  name: string;
  is_panitia?: boolean;
}

export interface AccountUpdate {
  email?: string;
  name?: string;
  is_panitia?: boolean;
}
