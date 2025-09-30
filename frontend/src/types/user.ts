export interface User {
  user_id: number;
  email: string;
  poin: number;
  rank: string;
  created_at: string;
}

export interface UserCreate {
  email: string;
  poin?: number;
  rank?: string;
}

export interface UserUpdate {
  email?: string;
  poin?: number;
  rank?: string;
}
