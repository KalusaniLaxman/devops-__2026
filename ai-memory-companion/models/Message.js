const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  sender:    { type: String, enum: ['user', 'ai'], required: true },
  text:      { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
