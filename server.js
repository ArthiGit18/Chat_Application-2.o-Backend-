// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const path = require('path');
require('./controllers/authControllers'); // Assuming this is where your controllers are

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/userRoutes');
const http = require('http');
const socket = require('./socket'); // Import socket configuration

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socket.init(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set up routes
app.use('/api/chat', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',               // Local development
    'https://chatapplication-20.netlify.app',         // Replace with your production domain
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Session and Passport configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',  // Store secret key securely
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth callback
app.get('/api/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false,
    }),
    (req, res) => {
        // Successful authentication, redirect home or anywhere
        res.redirect('/');
    }
);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MongoDB URI is not defined in the environment variables');
    process.exit(1);  // Exit if MONGO_URI is not found
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);  // Exit if there's a connection issue
  });
