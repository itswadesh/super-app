import type { Vendor } from '../../../db/schema'

export interface VendorResponse
  extends Omit<Vendor, 'qualifications' | 'achievements' | 'createdAt' | 'updatedAt'> {
  qualifications: string[]
  achievements: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateVendorRequest {
  businessName: string
  avatar?: string
  bio?: string
  qualifications?: string[]
  achievements?: string[]
  website?: string
  twitter?: string
  linkedin?: string
  instagram?: string
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {}

export interface ListVendorsQuery {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: keyof VendorResponse
  sortOrder?: 'asc' | 'desc'
}

export interface ListVendorsResponse {
  data: VendorResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
