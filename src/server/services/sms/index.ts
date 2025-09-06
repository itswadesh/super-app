import { authKeyMessage } from './authkey'
// import { msg91Message } from './msg91'

export const sendOtpSms = async ({ phone, otp }: { phone: string; otp: string }) => {
  await authKeyMessage({ phone, otp })
  // await msg91Message({
  //   usedFor: 'otp',
  //   phone,
  //   otp,
  //   dlt_template_id: '66038591d6fc056ec43f2593',
  //   variables: {
  //     otp,
  //     website: 'LRNR'
  //   }
  // })
}
