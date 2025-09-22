/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import nodemailer from 'nodemailer';

// host:'smtp.google.com',
// port: 465,
// secure: true,
// Create a reusable transporter object using Gmail's SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const fromEmail = process.env.FROM_EMAIL;

export const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `Study Circle. <${fromEmail}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully');
    return true;
  } catch (error) {
    // console.error('Error sending email:', error);
    return false;
  }
};
