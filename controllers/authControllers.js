const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// ✅ Extract environment variables with fallbacks for easier debugging
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "HARDCODED_CLIENT_ID";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "HARDCODED_CLIENT_SECRET";
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "https://chatapplication-2o-backend-production.up.railway.app/api/auth/google/callback";

console.log("🔍 GOOGLE_CLIENT_ID:", CLIENT_ID);
console.log("🔍 GOOGLE_CLIENT_SECRET:", CLIENT_SECRET);
console.log("🔍 GOOGLE_CALLBACK_URL:", CALLBACK_URL);

// 🚀 Register
exports.register = async (req, res) => {
    try {
        // 📝 Log incoming request body
        console.log("📝 Register Request Body:", req.body);

        const { username, email, phone, password } = req.body;

        if (!username || !email || !password) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ msg: "Username, email, and password are required." });
        }

        console.log("🔍 Checking if user exists...");
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("❌ User already exists");
            return res.status(400).json({ msg: "User already exists" });
        }

        console.log("🔐 Hashing password...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log("🆕 Creating new user...");
        const newUser = new User({ username, email, password: hashedPassword });

        // ✅ Optional phone number handling
        if (phone) {
            console.log("📞 Adding phone number:", phone);
            newUser.phone = phone;
        }

        console.log("💾 Saving user to database...");
        await newUser.save();

        console.log("✅ User registered successfully");
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        console.error("❌ Server Error during registration:", err.message);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// 🚀 Login
exports.login = async (req, res) => {
    console.log("🔥 Login Route Hit");
    console.log("📝 Request Body:", req.body);

    const { email, password } = req.body;
    if (!email || !password) {
        console.log("❌ Missing email or password");
        return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        console.log("❌ User not found");
        return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log("❌ Password mismatch");
        return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("✅ Login successful, token generated");

    res.json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone ?? undefined,
            avatar: user.avatar
        }
    });
};


// 🚀 Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('username email phone avatar');
        const cleanUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            ...(user.phone && { phone: user.phone })
        }));
        res.json(cleanUsers);
    } catch (err) {
        console.error("❌ Server Error during fetching users:", err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// 🚀 Get User By ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('username email phone avatar');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            ...(user.phone && { phone: user.phone })
        });
    } catch (err) {
        console.error("❌ Server Error during fetching user by ID:", err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// 🚀 Google OAuth Strategy Initialization
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ Missing Google OAuth Credentials");
    throw new Error("Google OAuth Credentials are not configured.");
}

passport.use(
    new GoogleStrategy(
        {
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log("🔍 Google OAuth Callback Triggered");
                let user = await User.findOne({ googleId: profile.id });
                
                if (!user) {
                    console.log("🆕 Creating new user from Google profile");
                    user = await User.create({
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        avatar: './assets/avator/1.jpeg'
                    });
                }
                console.log("✅ Google OAuth login successful");
                return done(null, user);
            } catch (err) {
                console.error("❌ Error during Google OAuth:", err.message);
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
