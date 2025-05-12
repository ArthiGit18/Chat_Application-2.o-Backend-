// userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.put('/auth/updateProfile/:id', upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  const { username, phone, email } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updateData = { username, phone };
    if (avatar) updateData.avatar = avatar;

    // If email is not empty, add it to the update object
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (updatedUser) {
      // Emit the updated user info to all connected clients
      io.emit('user_profile_updated', updatedUser);

      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.delete('/auth/deleteProfile', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const deletedUser = await User.findOneAndDelete({ email });

    if (deletedUser) {
      // 🟢 Initialize io here, after the server is ready
      const io = require('../socket').getIO();
      io.emit('user_profile_deleted', deletedUser);

      res.status(200).json({ message: 'User profile deleted successfully', user: deletedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting profile' });
  }
});



module.exports = router;
