import type { User } from '../../../db/schema'

export interface UserResponse extends Omit<User, 'createdAt' | 'updatedAt' | 'otp'> {
  otp?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  phone: string
  role?: 'user' | 'admin'
  age?: number
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export interface ListUsersQuery {
  page?: string
  pageSize?: string
  search?: string
  role?: string
  sortBy?: keyof UserResponse
  sortOrder?: 'asc' | 'desc'
}

export interface ListUsersResponse {
  data: UserResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
