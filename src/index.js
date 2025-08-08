// index.js
require('dotenv').config();
const express = require('express');
const allocationRoutes = require('./routes/allocationRoutes');
const rateLimit = require('express-rate-limit'); // Import the rate-limiter

const app = express();
const port = process.env.PORT || 3000;

// Configure the rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

// Middleware
app.use(express.json());


app.use(limiter);


app.use('/api', allocationRoutes);


app.listen(port, () => {
  console.log(`Smart Discount Engine API listening at http://localhost:${port}`);
});