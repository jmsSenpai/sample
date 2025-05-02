const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Create transporter once, reuse it
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS  // your app password
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Match Email Endpoint
app.post('/send-matched-email', (req, res) => {
  const { studentEmail, studentName, itemName } = req.body;

  if (!studentEmail || !studentName || !itemName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: 'Item Match Notification',
    html: `
      <h1 style="color: darkgreen;">Item Matched!</h1>
      <p>Hello ${studentName},</p>
      <p>We found an item that may be yours: <strong>${itemName}</strong>.</p>
      <p>Please go to the registrar office to confirm and retrieve it.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    res.status(200).json({ message: 'Match email sent successfully', info: info.response });
  });
});

// Account Acceptance Email Endpoint
app.post('/send-acceptance-email', (req, res) => {
  const { studentEmail, studentName } = req.body;

  if (!studentEmail || !studentName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: 'Account Accepted',
    html: `
      <h1 style="color: darkblue; font-size: 36px; text-align: center;">Account Accepted</h1>
      <h2 style="color: green; font-size: 22px;">Hello ${studentName},</h2>
      <p>Your account has been accepted by the admin.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    res.status(200).json({ message: 'Acceptance email sent successfully', info: info.response });
  });
});

// Verification Code Email Endpoint
app.post('/send-verification-code', (req, res) => {
  const { studentEmail, studentName, verificationCode } = req.body;

  if (!studentEmail || !studentName || !verificationCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: 'Password Reset Verification Code',
    html: `
      <h1 style="color: darkblue;">Password Reset</h1>
      <p>Hello ${studentName},</p>
      <p>Your verification code is: <strong>${verificationCode}</strong></p>
      <p>This code will expire in 2 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    res.status(200).json({ message: 'Verification code sent successfully', info: info.response });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});