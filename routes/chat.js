const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST: Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderEmail, receiverEmail, text } = req.body;

    if (!senderEmail || !receiverEmail || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = new Message({ senderEmail, receiverEmail, text, seen: false });
    await message.save();

    res.status(200).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET: Get conversation between two users
router.get('/conversation/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderEmail: user1, receiverEmail: user2 },
        { senderEmail: user2, receiverEmail: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * GET: Get the last message of the conversation
 * @param senderEmail - Email of the sender
 * @param receiverEmail - Email of the receiver
 */
router.get('/lastMessage/:senderEmail/:receiverEmail', async (req, res) => {
  const { senderEmail, receiverEmail } = req.params;
  try {
    const lastMessage = await Message.findOne({
      $or: [
        { senderEmail, receiverEmail },
        { senderEmail: receiverEmail, receiverEmail: senderEmail }
      ]
    }).sort({ timestamp: -1 }); // Sort by most recent

    res.status(200).json(lastMessage);
  } catch (err) {
    console.error('Failed to get last message:', err);
    res.status(500).json({ error: 'Failed to get last message' });
  }
});

/**
 * GET: Get the unseen message count
 * @param senderEmail - Email of the sender
 * @param receiverEmail - Email of the receiver
 */
router.get('/unseenCount/:receiverEmail/:senderEmail', async (req, res) => {
  const { receiverEmail, senderEmail } = req.params;
  try {
    const unseenMessagesCount = await Message.countDocuments({
      receiverEmail,
      senderEmail,
      seen: false
    });

    res.status(200).json({ count: unseenMessagesCount });
  } catch (err) {
    console.error('Failed to get unseen message count:', err);
    res.status(500).json({ error: 'Failed to get unseen message count' });
  }
});

/**
 * PUT: Mark messages as seen when the chat is opened
 */
router.put('/markAsSeen/:senderEmail/:receiverEmail', async (req, res) => {
  const { senderEmail, receiverEmail } = req.params;
  try {
    await Message.updateMany(
      {
        senderEmail,
        receiverEmail,
        seen: false
      },
      { $set: { seen: true } }
    );
    res.status(200).json({ message: 'Messages marked as seen' });
  } catch (err) {
    console.error('Failed to mark messages as seen:', err);
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});

module.exports = router;
