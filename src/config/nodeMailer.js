import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rachitpatel2106@gmail.com', 
    pass: 'tuyz intj bumu onet',
  },
})
