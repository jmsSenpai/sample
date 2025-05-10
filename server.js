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
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Match Email Endpoint
app.post('/send-matched-email', (req, res) => {
  const { studentEmail, studentName, itemName } = req.body;
  console.log('Received match email request:', { studentEmail, studentName, itemName });

  if (!studentEmail || !studentName || !itemName) {
    console.log('Missing fields in match email request');
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
      console.error('Error sending match email:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    console.log('Match email sent:', info.response);
    res.status(200).json({ message: 'Match email sent successfully', info: info.response });
  });
});

// Account Acceptance Email Endpoint
app.post('/send-acceptance-email', (req, res) => {
  const { studentEmail, studentName } = req.body;
  console.log('Received acceptance email request:', { studentEmail, studentName });

  if (!studentEmail || !studentName) {
    console.log('Missing fields in acceptance email request');
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
      console.error('Error sending acceptance email:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    console.log('Acceptance email sent:', info.response);
    res.status(200).json({ message: 'Acceptance email sent successfully', info: info.response });
  });
});

// Account Rejection Email Endpoint
app.post('/send-rejection-email', (req, res) => {
  const { studentEmail, studentName } = req.body;
  console.log('Received rejection email request:', { studentEmail, studentName });

  if (!studentEmail || !studentName) {
    console.log('Missing fields in rejection email request');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: 'Account Rejection Notification',
    html: `
      <h1 style="color: darkred; font-size: 36px; text-align: center;">Account Rejected</h1>
      <h2 style="color: red; font-size: 22px;">Hello ${studentName},</h2>
      <p>We regret to inform you that your account registration has been rejected by the admin.</p>
      <p>Please contact the registrar's office for more information or to reapply.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending rejection email:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    console.log('Rejection email sent:', info.response);
    res.status(200).json({ message: 'Rejection email sent successfully', info: info.response });
  });
});

// Verification Code Email Endpoint
app.post('/send-verification-code', (req, res) => {
  const { studentEmail, studentName, verificationCode } = req.body;
  console.log('Received verification code email request:', { studentEmail, studentName, verificationCode });

  if (!studentEmail || !studentName || !verificationCode) {
    console.log('Missing fields in verification code email request');
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
      console.error('Error sending verification code email:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.toString() });
    }
    console.log('Verification code email sent:', info.response);
    res.status(200).json({ message: 'Verification code sent successfully', info: info.response });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});