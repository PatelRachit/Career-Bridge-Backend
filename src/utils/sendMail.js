import { transporter } from '../config/nodeMailer.js'

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Career Bridge" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    })
    console.log('Email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
