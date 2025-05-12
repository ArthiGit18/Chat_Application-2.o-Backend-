const express = require("express");
const router = express.Router();
const passport = require("passport");
const { register, login, getAllUsers, getUserById } = require("../controllers/authControllers");

router.post("/register", register);
router.post("/login", login);
router.get('/users/loggedin', getAllUsers);
router.get('/users/:id', getUserById);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));


router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "http://localhost:5000/login" }),
    (req, res) => {
      // If authentication is successful, you can either redirect or return a response
      res.redirect("http://localhost:3000/chat"); // Redirect to the desired page after login
    }
  );
  

module.exports = router;
