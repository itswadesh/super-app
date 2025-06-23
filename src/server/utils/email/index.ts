import sgMail from '@sendgrid/mail'
import { and, eq } from 'drizzle-orm'
import mustache from 'mustache'
import postmark from 'postmark'
import { Resend } from 'resend'
import db from '../../db'
import { Template } from '../../db/schema'
import env from '../../env'
sgMail.setApiKey(env.SENDGRID_API_KEY || 'SG.dummy')
const posmarkClient = new postmark.ServerClient(
  env.POSTMARK_API_KEY || '6bcb4379-cc83-45f8-9e3e-dfabb121e5cf'
)
const resend = new Resend(env.RESEND_API_KEY || 'dummy')

export const sendEmail = async ({
  templateId,
  fromEmail,
  toEmail,
  storeId,
  variables, // variables
}: any) => {
  // console.log('sendEmail', templateId, fromEmail, toEmail, storeId, variables)
  if (!templateId || templateId == 'null' || templateId == 'undefined')
    throw { status: 400, message: `templateId=${templateId} mandatory` }
  if (!toEmail) throw { status: 400, message: `toEmail=${toEmail} mandatory` }
  const settings = await db.query.Setting.findFirst()
  const emailTemplates: any = await db
    .select()
    .from(Template)
    .where(and(eq(Template.templateId, templateId), eq(Template.active, true)))
  const emailTemplate = emailTemplates[0]
  if (!emailTemplate) {
    console.log('Email template not found ' + templateId) // Do not throw error, just go silent because the entire API will throw error
  } else {
    const htmlContent = mustache.render(emailTemplate.html, variables)

    if (settings?.emailProvider == 'RESEND') {
      await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: emailTemplate.subject,
        html: htmlContent,
      })
      console.log('Email sent using RESEND')
    } else if (settings?.emailProvider == 'SENDGRID') {
      await sgMail.send({
        from: fromEmail,
        to: [toEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })
      console.log('Email sent using SENDGRID')
    } else if (settings?.emailProvider == 'POSTMARK') {
      await posmarkClient.sendEmail({
        From: fromEmail,
        To: toEmail,
        Subject: emailTemplate.subject,
        HtmlBody: emailTemplate.html,
      })
      console.log('Email sent using POSTMARK')
    } else {
      console.log('Email template not active') // Do not throw error, just go silent because the entire API will throw error
    }
  }
}
