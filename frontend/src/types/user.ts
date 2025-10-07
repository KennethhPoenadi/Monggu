export interface User {
  user_id: number;
  email: string;
  poin: number;
  rank: string;
  isadmin: boolean;
  is_panitia?: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  poin?: number;
  rank?: string;
  isadmin?: boolean;
  is_panitia?: boolean;
}

export interface UserUpdate {
  email?: string;
  poin?: number;
  rank?: string;
  isadmin?: boolean;
  is_panitia?: boolean;
}
