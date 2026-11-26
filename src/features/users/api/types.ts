export type { User } from '@/constants/mock-api-users';

export type UserFilters = {
  page?: number;
  limit?: number;
  /** Matches username, email or phone. */
  search?: string;
  user_name?: string;
  email?: string;
  phone?: string;
  /** Backend common.Status: 1 enabled, 2 disabled. */
  status?: number;
  /** created_at_desc (default) | created_at_asc | updated_at_desc | updated_at_asc */
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

/** Fields an admin can set; mirrors Admin{Create,Update}AddressRequest. */
export type UserAddressPayload = Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>;

export type UserAddressResponse = {
  success: boolean;
  message: string;
  address?: UserAddress;
};

export type UserSessionStatus = 'active' | 'revoked' | 'expired' | 'unknown';

// One live App-user session (device). Timestamps are ISO strings, '' if unset.
export type UserSession = {
  session_id: string;
  client_id: number;
  device_id: string;
  device_name: string;
  user_agent: string;
  status: UserSessionStatus;
  ip: string;
  location: string;
  last_active_ip: string;
  last_active_location: string;
  created_at: string;
  last_active_at: string;
  expires_at: string;
};

export type UserSessionsResponse = {
  success: boolean;
  message: string;
  total: number;
  sessions: UserSession[];
};

// One login attempt. identity_value is already masked by the backend.
export type UserLoginLog = {
  id: number;
  identity_type: string;
  identity_value: string;
  client_id: number;
  device_id: string;
  device_name: string;
  ip: string;
  user_agent: string;
  success: boolean;
  err_msg: string;
  created_at: string;
};

export type UserLoginLogFilters = {
  page?: number;
  limit?: number;
};

export type UserLoginLogsResponse = {
  success: boolean;
  message: string;
  total: number;
  page: number;
  limit: number;
  logs: UserLoginLog[];
};

export type UserMutationPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
};

/** Internal admin note attached to a user account. */
