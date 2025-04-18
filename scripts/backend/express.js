const express = require('express');
const bodyParser = require('body-parser');
const sendAcceptanceEmail = require('./server'); // Path to the file containing email logic
const cors = require('cors');
app.use(cors());
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Route to handle email sending
app.post('/send-acceptance-email', (req, res) => {
  console.log("Received request to accept student:", req.body);
    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ message: 'Email and name are required' });
    }

    sendAcceptanceEmail(email, name);

    res.status(200).json({ message: 'Email sent successfully' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
