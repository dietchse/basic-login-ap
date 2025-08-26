const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verifikasi Email Anda',
    html: `<p>Silakan verifikasi email Anda dengan mengklik <a href="${verificationUrl}">di sini</a>.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Atur Ulang Kata Sandi Anda',
    html: `<p>Untuk mengatur ulang kata sandi Anda, klik <a href="${resetUrl}">di sini</a>. Link ini akan kedaluwarsa dalam 1 jam.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };