const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true },
  relationship: { type: String, required: true },   // e.g. "mother", "friend"
  personality:  { type: String, required: true },   // e.g. "kind", "funny", "calm"
  bio:          { type: String, default: '' },       // extra personality notes
  image:        { type: String, default: '' },       // filename in /uploads
  audioFiles:   [{ type: String }]                  // array of filenames in /uploads
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
