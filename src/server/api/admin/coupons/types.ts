import type { Coupon } from '../../../db/schema'

export interface CouponResponse extends Omit<Coupon, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

export interface CreateCouponRequest {
  couponCode: string
  discount: number
  discountType: 'percentage' | 'fixed'
  maxDiscount?: number
  isActive?: boolean
  validFrom?: string
  validTo?: string
  usageLimit?: number
  description?: string
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {}

export interface ListCouponsQuery {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: keyof CouponResponse
  sortOrder?: 'asc' | 'desc'
  isActive?: string
}

export interface ListCouponsResponse {
  data: CouponResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
