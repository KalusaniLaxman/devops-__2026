const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Profile = require('../models/Profile');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Create profile
router.post('/', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, relationship, personality, bio } = req.body;
    if (!name || !relationship || !personality)
      return res.status(400).json({ error: 'Name, relationship and personality are required' });

    const image = req.files?.image?.[0]?.filename || '';
    const audioFiles = (req.files?.audio || []).map(f => f.filename);

    const profile = await Profile.create({
      userId: req.userId, name, relationship, personality, bio, image, audioFiles
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all profiles for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.userId });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ _id: req.params.id, userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete profile
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Profile.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
