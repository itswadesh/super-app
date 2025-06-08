import SHA256 from 'crypto-js/sha256'
import type {
  PaymentRequestUPI,
  PaymentRequestUPICollect,
  PaymentRequestUPIQr,
  RefundRequest,
} from './phonepe-types'

// const PAYMENT_PROVIDER_KEY = 'pp_phonepe'

export function createPostCheckSumHeader({ payload, salt, apiString }: any) {
  const SALT_KEY = salt ?? process.env.PHONEPE_SALT ?? 'test-salt'
  const encodedBody = btoa(JSON.stringify(payload, null, 2))
  const base64string = `${encodedBody}${apiString}${SALT_KEY}`
  const encodedPayload = SHA256(base64string).toString()
  const checksum = `${encodedPayload}###1`
  return { checksum, encodedBody }
}

export function createPostPaymentChecksumHeader(
  payload: PaymentRequestUPI | PaymentRequestUPICollect | PaymentRequestUPIQr,
  salt?: string
) {
  return createPostCheckSumHeader({ payload, salt, apiString: '/pg/v1/pay' })
}

export function createPostRefundChecksumHeader(payload: RefundRequest, salt?: string) {
  return createPostCheckSumHeader({ payload, salt, apiString: '/pg/v1/refund' })
}

export function createPostValidateVpaChecksumHeader(
  payload: {
    merchantId: string
    vpa: string
  },
  salt?: string
) {
  return createPostCheckSumHeader({
    payload,
    salt,
    apiString: '/pg/v1/vpa/validate',
  })
}

export function createGetChecksumHeader({ merchantId, merchantTransactionId, salt }: any) {
  const SALT_KEY = salt ?? process.env.PHONEPE_SALT ?? 'test-salt'
  const asciiString = `/pg/v1/status/${merchantId}/${merchantTransactionId}${SALT_KEY}`
  const encodedPayload = SHA256(asciiString)
  const checksum = `${encodedPayload}###1`
  return { checksum }
}

export function createGetChecksumTransactionHeader(
  merchantId: string,
  merchantTransactionId: string,
  salt?: string
) {
  const SALT_KEY = salt ?? process.env.PHONEPE_SALT ?? 'test-salt'
  const asciiString = `/pg/v3/transaction/${merchantId}/${merchantTransactionId}/status${SALT_KEY}`
  const encodedPayload = SHA256(asciiString)
  const checksum = `${encodedPayload}###1`
  return { checksum }
}
