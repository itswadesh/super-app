import axios from 'axios'
import env from '../../env'

export const msg91Message = async ({
  usedFor = 'otp',
  otp = null,
  phone,
  dlt_template_id,
  variables = {},
}: any) => {
  if (!phone.startsWith('+')) {
    if (phone.startsWith('0')) phone = '+91' + phone.substring(1)
    else phone = '+91' + phone
  }

  const headers = {
    accept: 'application/json',
    authkey: env.MSG91_API_KEY,
    'content-type': 'application/json',
  }

  const MSG91_URL = `https://api.msg91.com/api/v5`
  try {
    if (usedFor == 'otp') {
      const url = `${MSG91_URL}/otp?template_id=${dlt_template_id}&mobile=${phone}&authkey=${headers.authkey}&otp=${otp}`
      console.log('SMS URL FOR OTP... ', url)
      const res = await axios.get(url, { headers })
      return res
    } else {
      const url = `${MSG91_URL}/flow/`

      const requestData = {
        template_id: dlt_template_id,
        short_url: 0, // 1 (On) or 0 (Off)
        recipients: [
          {
            mobiles: phone,
            ...variables,
          },
        ],
      }
      const res = await axios.post(url, requestData, { headers })
      return res
    }
  } catch (error) {
    console.error('msg91 err...', error.toString())
    return error.toString()
  }
}
