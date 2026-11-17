export type { User } from '@/constants/mock-api-users';

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type UsersResponse = {
  success: boolean;
  time: string;
  message: string;
  total_users: number;
  offset: number;
  limit: number;
  users: import('@/constants/mock-api-users').User[];
};

export type UserByIdResponse = {
  success: boolean;
  time: string;
  message: string;
  user: import('@/constants/mock-api-users').User;
};

export type UserAddress = {
  id: number;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type UserAddressesResponse = {
  success: boolean;
  message: string;
  addresses: UserAddress[];
};

export type UserMutationPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
};

/** Internal admin note attached to a user account. */
export type UserNote = {
  id: number;
  user_id: number;
  author: string;
  body: string;
  created_at: string;
};

export type UserNotesResponse = {
  success: boolean;
  message: string;
  notes: UserNote[];
};

export type UserNotePayload = {
  body: string;
  author?: string;
};
