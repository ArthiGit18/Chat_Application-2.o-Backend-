// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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

// Set up routes
app.use('/api/chat', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',               
    'https://chatapplication-20.netlify.app', 
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

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MongoDB URI is not defined in the environment variables');
    process.exit(1);  // Exit if MONGO_URI is not found
}

// 🔄 **Session and Passport configuration** - Using `connect-mongo` for sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',  
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',     // Optional: Name of the session collection
    }),
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

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);  // Exit if there's a connection issue
  });

// 🛡️ Safety check to verify environment variables are loaded
console.log("✅ MongoDB URI:", MONGO_URI);
console.log("✅ Session Secret:", process.env.SESSION_SECRET);
console.log("✅ Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("✅ Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);
