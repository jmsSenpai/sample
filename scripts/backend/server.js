require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();


app.use(express.json());


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
});


app.post('/accept-student', async (req, res) => {
  const { studentEmail, studentName } = req.body;

  
  if (!studentEmail || !studentName) {
    return res.status(400).send('Email and Name are required.');
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, 
      to: studentEmail,
      subject: 'You Have Been Accepted!',
      text: `Dear ${studentName},\n\nCongratulations! You have been accepted.\n\nBest regards,\nYour Admin`,
    };

   
    await transporter.sendMail(mailOptions);

    
    res.send('Student accepted and email sent!');
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).send('Failed to accept the student and send email.');
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
console.log(studentEmail)
