import axios, { Axios, type AxiosResponse } from 'axios'

import {
  createGetChecksumHeader,
  createGetChecksumTransactionHeader,
  createPostCheckSumHeader,
  createPostPaymentChecksumHeader,
  createPostRefundChecksumHeader,
  createPostValidateVpaChecksumHeader,
} from './utils'

import {
  type PaymentCheckStatusResponse,
  type PaymentRequest,
  type PaymentRequestUPI,
  type PaymentRequestUPICollect,
  type PaymentRequestUPIQr,
  type PaymentResponse,
  type PaymentResponseData,
  type PaymentResponseUPI,
  PaymentStatusCodeValues,
  type PhonePeOptions,
  type RefundRequest,
} from './phonepe-types'

export class PhonePeWrapper {
  options: PhonePeOptions
  url: string

  constructor(options: PhonePeOptions) {
    this.options = options
    switch (this.options.mode) {
      case 'production':
        this.url = 'https://api.phonepe.com/apis/hermes'
        break
      case 'uat':
        this.url = 'https://api-preprod.phonepe.com/apis/hermes'
        break
      case 'test':
      default:
        this.url = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
        break
    }
  }

  async postPaymentRequestToPhonePe(
    payload: PaymentRequestUPI | PaymentRequestUPICollect | PaymentRequestUPIQr,

    apiNewEndpoint?: string
  ): Promise<AxiosResponse<PaymentResponse | PaymentCheckStatusResponse>> {
    const apiEndpoint = apiNewEndpoint ?? '/pg/v1/pay'
    const url =
      /* this.options.mode == "uat"
        ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
        :*/ this.url

    const encodedMessage = createPostPaymentChecksumHeader(payload)
    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-VERIFY': encodedMessage.checksum,
    }
    const reqUrl = `${url}${apiEndpoint}`
    const result = await axios.post(
      reqUrl,
      { request: encodedMessage.encodedBody },
      {
        headers,
      }
    )
    return result.data
  }

  validatePaymentRequest(paymentRequest: PaymentRequest): boolean {
    if (paymentRequest.merchantId.length > 0 && paymentRequest.merchantId.length < 38) {
      if (
        paymentRequest.merchantTransactionId.length > 0 &&
        paymentRequest.merchantTransactionId.length < 38
      ) {
        if (
          typeof paymentRequest.amount == 'number' &&
          Number(paymentRequest.amount) === paymentRequest.amount &&
          !isNaN(paymentRequest.amount)
        ) {
          if (
            paymentRequest.merchantUserId.length > 0 &&
            paymentRequest.merchantUserId.length < 36 &&
            paymentRequest.merchantUserId.match(/[^\w]|^_/) == null
          ) {
            if (paymentRequest.redirectUrl.includes('http')) {
              if (paymentRequest.redirectMode) {
                if (paymentRequest.callbackUrl) {
                  return true
                }
              }
            }
          }
        }
      }
    }
    return false
  }

  async createPhonePeStandardRequest({
    merchantId,
    merchantTransactionId,
    merchantUserId,
    amount,
    mobileNumber,
  }: any): Promise<any> {
    const phonePeRequest: PaymentRequest = {
      merchantId: this.options.merchantId || merchantId,
      redirectMode: this.options.redirectMode,
      redirectUrl:
        this.options.redirectUrl?.length == 0 ? 'https://localhost:8000' : this.options.redirectUrl,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: Number.parseInt(amount),
      callbackUrl: this.options.callbackUrl,
      mobileNumber: mobileNumber,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    }
    const paymentError = {
      code: 'VALIDATION_FAILED',
      error: `${JSON.stringify(phonePeRequest)} is invalid`,
    }
    return this.validatePaymentRequest(phonePeRequest) ? phonePeRequest : paymentError
  }
  async getPhonePeTransactionStatus({
    merchantId,
    merchantTransactionId,
    apiNewEndpoint,
    salt,
  }: any): Promise<PaymentCheckStatusResponse> {
    if (!merchantId || !merchantTransactionId) {
      return {
        data: {
          success: false,
          code: PaymentStatusCodeValues.PAYMENT_ERROR,
          message: 'merchantId or merchantTransactionId is incomplete',
          data: undefined,
        },
      } as any
    }

    const apiEndpoint = apiNewEndpoint ?? '/pg/v1/status'
    const url =
      this.options.mode == 'uat' ? 'https://api-preprod.phonepe.com/apis/pg-sandbox' : this.url

    const encodedMessage = createGetChecksumHeader({
      merchantId,
      merchantTransactionId,
      salt,
    })
    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-VERIFY': encodedMessage.checksum,
      'X-MERCHANT-ID': merchantId,
    }

    const requestUrl = `${url}${apiEndpoint}/${merchantId}/${merchantTransactionId}`
    const result = await axios.get(requestUrl, {
      headers,
    })
    return result.data
  }

  async validateVpa(
    merchantId: string,
    vpa: string,

    apiNewEndpoint?: string
  ): Promise<any> {
    const apiEndpoint = apiNewEndpoint ?? '/pg/v1/vpa/validate'
    const url = this.url
    const encodedMessage = await createPostValidateVpaChecksumHeader({
      merchantId,
      vpa,
    })
    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-VERIFY': encodedMessage.checksum,
      'X-MERCHANT-ID': merchantId,
    }
    const result = await axios.post(
      `${url}${apiEndpoint}`,
      { request: encodedMessage.encodedBody },
      {
        headers,
      }
    )
    return result.data
  }
  async cancel(p: any) {
    p.code = undefined
    return p
  }
  async capture(p: any): Promise<PaymentCheckStatusResponse> {
    let isCaptured = false
    const { merchantId, merchantTransactionId, salt, apiNewEndpoint } = p

    const result = await this.getPhonePeTransactionStatus({
      merchantId,
      merchantTransactionId,
      salt,
      apiNewEndpoint,
    })

    isCaptured = result.code != PaymentStatusCodeValues.PAYMENT_PENDING

    return result
  }
  async postRefundRequestToPhonePe(
    payload: RefundRequest,

    apiNewEndpoint?: string
  ): Promise<any> {
    const apiEndpoint = apiNewEndpoint ?? '/pg/v1/refund'
    const url = this.url
    const encodedMessage = await createPostRefundChecksumHeader(payload)
    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-VERIFY': encodedMessage.checksum,
    }

    const result = await axios.post(
      `${url}${apiEndpoint}`,
      { request: encodedMessage.encodedBody },
      {
        headers,
      }
    )
    return result.data
  }
  validateWebhook(data: any, signature: any, salt: string): boolean {
    const { checksum } = createPostCheckSumHeader({
      payload: data,
      salt,
      apiString: '',
    })

    if (checksum == signature) {
      return true
    }
    return false
  }
}
