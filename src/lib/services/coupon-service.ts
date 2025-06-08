import { toast } from 'svelte-sonner'
import { apiService } from './api.service'

export interface CouponValidationRequest {
  couponCode: string
  planId: string
  amount: number
}

export interface CouponValidationResponse {
  success: boolean
  discount: number
  message?: string
}

export const couponService = {
  async validateCoupon(
    couponCode: string,
    planId: string,
    amount: number
  ): Promise<{ success: boolean; discount: number; error?: string }> {
    try {
      const response = await apiService.post<CouponValidationResponse>('/validate-coupon', {
        couponCode,
        planId,
        amount,
      })

      if (response.success && response.data) {
        toast.success('Coupon applied!')
        return { success: true, discount: response.data.discount }
      }

      return {
        success: false,
        discount: 0,
        error: response.data?.message || 'Invalid coupon',
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      return {
        success: false,
        discount: 0,
        error: 'Failed to validate coupon',
      }
    }
  },
}

export default couponService
