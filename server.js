const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(cors());

app.use(express.json());




require('dotenv').config(); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



app.post('/send-acceptance-email',(req,res)=>{
  const { studentEmail, StudentName} = req.body;

  const mailOption = {
    from: 'jamessenpai9@gmail.com',
    to: studentEmail,
    subject: `<h1 style="color: darkblue; font-size: 36px; text-align: center;> Account accepted</h1>`,
    text: `<h1 style="color: Green; font-size: 25px; text-align: center;>Good Day ${StudentName}</h1> \n<h3 style="color: darkblue; font-size: 18px; text-align: center;> Your Account has been Accepted by the Admin</h3>`
  };
  transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
      return res.status(500).json({error:'Error sending Mail', details: error.toString()});

    }
    res.status(200).json({message: 'Email Sent', info: info.response});

  });

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
