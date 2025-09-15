// Misiki subscription plans configuration
export type PlanType = {
  id: string
  name: string
  board: string
  price: number
  original_price?: number
  duration: string
  description: string
  features: string[]
  popular?: boolean
}

export const plans: PlanType[] = []

export default plans
