// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
require('dotenv').config();
const path = require('path');
const http = require('http');

const socket = require('./socket'); // Socket.IO setup
require('./controllers/authControllers'); // Passport strategies

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socket.init(server);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS configuration
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
  credentials: true
}));

// ✅ Session with connect-mongo
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MongoDB URI is not defined in the environment variables');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  }
}));

// ✅ Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ API Routes
app.use('/api/chat', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

// ✅ Google OAuth callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// ✅ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ Server is running...');
});

// Optional: Serve React frontend (only if you're hosting it from this server)
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ✅ Connect MongoDB and Start Server
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ✅ Log loaded env values (for safety check)
console.log("✅ MongoDB URI:", MONGO_URI);
console.log("✅ Session Secret:", process.env.SESSION_SECRET);
console.log("✅ Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("✅ Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);
