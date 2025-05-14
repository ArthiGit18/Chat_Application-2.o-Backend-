const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Register
exports.register = async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, phone, password: hashedPassword });

         // Only add `phone` if it's provided
    if (phone) {
      newUser.phone = phone;
    }

        await newUser.save();

        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Login
// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return user data with phone only if it exists
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone ?? undefined,  // Will not show if phone is not there
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('username email phone avatar');
    
    // Remove `phone` from response if it's not available
    const cleanUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      ...(user.phone && { phone: user.phone })
    }));

    res.json(cleanUsers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('username email phone avatar');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send back only phone if it exists
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      ...(user.phone && { phone: user.phone })
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Google
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL

      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.create({
              username: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              avatar: './assets/avator/1.jpeg' // <- set default image path
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });
