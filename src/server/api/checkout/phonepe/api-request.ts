import axios from 'axios'
import { PhonePeWrapper } from '../utils/phonepe/phonepe-wrapper'
import { createPostPaymentChecksumHeader } from '../utils/phonepe/utils'

export const phonepeApi = async ({ type = 'pay', postData }) => {
  if (!process.env.PHONEPE_SALT || !process.env.PHONEPE_MERCHANT_ACCOUNT) {
    throw new Error('Missing required PhonePe configuration')
  }
  const PHONEPE_SALT = process.env.PHONEPE_SALT
  const PHONEPE_MERCHANT_ACCOUNT = process.env.PHONEPE_MERCHANT_ACCOUNT
  const PHONEPE_MODE = process.env.PHONEPE_MODE
  const apiEndpoint = 'https://api.phonepe.com/apis/hermes'
  // Initialize PhonePe wrapper with correct options
  const phonepe_ = new PhonePeWrapper({
    merchantId: PHONEPE_MERCHANT_ACCOUNT,
    salt: PHONEPE_SALT,
    redirectUrl: postData.redirectUrl,
    callbackUrl: postData.callbackUrl,
    redirectMode: postData.redirectMode,
    mode: PHONEPE_MODE as 'production' | 'test' | 'uat',
  })
  const payload = await phonepe_.createPhonePeStandardRequest(postData)
  const encodedMessage = createPostPaymentChecksumHeader(payload, PHONEPE_SALT)
  const reqUrl = `${apiEndpoint}/pg/v1/pay`
  const headers = {
    'Content-Type': 'application/json',
    accept: 'application/json',
    'X-VERIFY': encodedMessage.checksum,
  }

  const response = await axios.post(reqUrl, { request: encodedMessage.encodedBody }, { headers })
  if (response?.data?.success) {
    const responseData = response.data as PaymentResponse
    // Safe type assertion since we know the structure from PhonePe docs
    const paymentData = responseData.data as {
      instrumentResponse?: {
        redirectInfo?: {
          url: string
        }
      }
    }

    const redirectUrl = paymentData?.instrumentResponse?.redirectInfo?.url
    if (redirectUrl) {
      return { data: redirectUrl }
    }

    console.error('PhonePe API Error: Missing redirect URL', responseData)
    throw {
      status: 400,
      message: 'Failed to get payment URL from PhonePe',
      data: responseData,
    }
  }

  throw {
    status: 400,
    message: 'Payment request failed',
    data: response?.data,
  }
}
