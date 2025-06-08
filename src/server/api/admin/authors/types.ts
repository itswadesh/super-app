import type { Author } from '../../../db/schema'

export interface AuthorResponse extends Omit<Author, 'qualifications' | 'achievements' | 'createdAt' | 'updatedAt'> {
  qualifications: string[]
  achievements: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateAuthorRequest {
  name: string
  avatar?: string
  bio?: string
  qualifications?: string[]
  achievements?: string[]
  website?: string
  twitter?: string
  linkedin?: string
  instagram?: string
}

export interface UpdateAuthorRequest extends Partial<CreateAuthorRequest> {}

export interface ListAuthorsQuery {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: keyof AuthorResponse
  sortOrder?: 'asc' | 'desc'
}

export interface ListAuthorsResponse {
  data: AuthorResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
