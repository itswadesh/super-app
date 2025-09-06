import axios from 'axios'
import { env } from 'process'

const objToQueryString = (params: any) => {
  return Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
}

export const authKeyMessage = async ({ phone, otp }: { phone: string; otp: string }) => {
  try {
    const msg = `<#> Hi, ${otp} is your OTP to login to LRNR - BoBI72gsKkc`
    const voice = `<#> Hi, ${otp} is your OTP to login to LRNR - BoBI72gsKkc`
    phone = phone.replace('+91', '')

    const params = {
      authkey: env.SMS_AUTHKEY_API_KEY,
      sms: msg,
      fb1voice: voice,
      mobile: phone,
      country_code: '91',
      sender: env.SMS_AUTHKEY_SENDER_ID,
      pe_id: env.SMS_ENTITY_ID,
      template_id: env.SMS_OTP_TEMPLATE_ID,
    }

    const url = `https://api.authkey.io/request?${objToQueryString(params)}`
    console.log('URL.............', url)
    const res = await axios.get(url, {})
    return res?.data?.Message
  } catch (error) {
    console.error('smsAuthKey err...', error?.toString())
    return error?.toString()
  }
}
