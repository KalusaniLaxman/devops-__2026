const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const Message = require('../models/Message');
const Profile = require('../models/Profile');

// ─── Simulated AI Response Engine ────────────────────────────────────────────

const responses = {
  kind: {
    greeting:  ["Hello dear, I'm so happy you're here.", "Hi sweetheart! I was just thinking of you.", "Oh, it's so good to hear from you!"],
    miss:      ["I'm always with you, no matter where life takes you.", "You carry me in your heart, and I carry you in mine.", "Distance can't separate the love we share."],
    love:      ["I love you more than words can ever express.", "You mean the world to me, always remember that.", "My love for you has no limits."],
    sad:       ["It's okay to feel sad. I'm right here with you.", "Let it out. I've got you. You're not alone.", "Even the darkest nights end. I believe in you."],
    advice:    ["Follow your heart — it knows the way.", "Be patient with yourself. Good things take time.", "Trust yourself. You are stronger than you think."],
    default:   ["I hear you. Tell me more.", "I'm listening. You always have my full attention.", "That means a lot to me. Thank you for sharing."]
  },
  funny: {
    greeting:  ["Well, look who decided to show up! 😄", "Hey there! I was starting to think you forgot about me!", "Oh! It's you! My favourite human!"],
    miss:      ["Miss me? I've been right here! Haunting your memories, as promised. 👻", "Aww! I miss you too — but less dramatically, hopefully.", "I was just about to send a search party!"],
    love:      ["Love you too, you big softie. Don't tell anyone I said that. 😏", "Aww, stop it — you'll make me blush! (Spoiler: I'm already blushing)", "Love you to the moon and back — and I checked, it's very far!"],
    sad:       ["Hey, no tears allowed! ...okay, fine, maybe just a few. 🤣", "Life is too short to be sad — unless it's Monday, that's understandable.", "Have you tried turning your feelings off and back on again?"],
    advice:    ["My advice? Eat a snack first. Everything's better after snacks.", "Step 1: Breathe. Step 2: Snack. Step 3: Conquer.", "If in doubt, do what you'd tell your best friend to do."],
    default:   ["Ha! Classic you. 😄", "You crack me up, you know that?", "Okay okay, I'm listening — and trying not to laugh."]
  },
  calm: {
    greeting:  ["Hello. It's peaceful to connect with you again.", "Welcome. Take a breath. I'm here.", "Hi. Settle in — there's no rush."],
    miss:      ["I'm always here, like a quiet presence beside you.", "Missing is love with nowhere to go. Let it rest gently.", "I am never truly far from you."],
    love:      ["Love is steady and quiet, like a river. That's how I love you.", "My love for you is constant, like the tide.", "You are deeply loved. That doesn't change."],
    sad:       ["Sit with your feelings. They are trying to tell you something.", "It's okay to be still in your sadness.", "Every wave passes. You'll find your shore again."],
    advice:    ["One step at a time. That's all it takes.", "Clarity comes when we stop forcing it. Be still.", "The answer is within you. Trust the quiet voice."],
    default:   ["I understand. Take your time.", "Tell me more, whenever you're ready.", "I'm here. There's no hurry."]
  },
  serious: {
    greeting:  ["Good to hear from you.", "I was hoping you'd reach out.", "It's good that you're here."],
    miss:      ["I think of you too. More than you know.", "We carry each other, even in absence.", "That feeling is real. Hold on to it."],
    love:      ["You know how I feel. Some things don't need saying.", "Love is in what we did, not just what we said.", "I meant every moment we shared."],
    sad:       ["Pain is part of living. You're strong enough to carry this.", "Don't run from it. Face it, and it loses its power.", "This will shape you. Let it make you stronger."],
    advice:    ["Think it through. Don't act on impulse.", "What do the facts tell you? Lead with reason.", "Be honest with yourself first. Everything else follows."],
    default:   ["I hear you.", "Go on.", "Tell me exactly what happened."]
  },
  gentle: {
    greeting:  ["Oh, hello there 🌸 It's so nice to see you.", "Welcome, dear. Come in, come in.", "Hi there. You look like you could use some warmth today."],
    miss:      ["I miss you too, every single day.", "You're always on my mind and in my heart.", "Missing you is just loving you from a distance."],
    love:      ["Oh, I love you so, so much.", "You are so precious to me.", "My love for you is as soft and endless as a summer breeze."],
    sad:       ["Come here. It'll be okay, I promise.", "You don't have to be strong right now. Just be.", "I'm going to make you some tea (in spirit) and sit with you. 🍵"],
    advice:    ["Be gentle with yourself, the way you'd be gentle with someone you love.", "There's no perfect answer — just the one that feels true to you.", "You already know what to do. Trust your gentle heart."],
    default:   ["That sounds meaningful. Tell me more.", "I love hearing from you.", "Thank you for trusting me with this."]
  }
};

function getCategory(text) {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(t)) return 'greeting';
  if (/\b(miss|wish you were here|think of you|remember)\b/.test(t)) return 'miss';
  if (/\b(love|adore|cherish|care about)\b/.test(t)) return 'love';
  if (/\b(sad|cry|hurt|pain|lost|lonely|depressed|scared)\b/.test(t)) return 'sad';
  if (/\b(advice|help|suggest|what should|how do|guide)\b/.test(t)) return 'advice';
  return 'default';
}

function generateReply(personality, userText) {
  const type = personality?.toLowerCase() || 'kind';
  const bank = responses[type] || responses.kind;
  const category = getCategory(userText);
  const pool = bank[category] || bank.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Send message & get AI reply
router.post('/:profileId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const profile = await Profile.findOne({ _id: req.params.profileId, userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Save user message
    await Message.create({ userId: req.userId, profileId: profile._id, sender: 'user', text });

    // Generate & save AI reply
    const aiText = generateReply(profile.personality, text);
    const aiMsg = await Message.create({ userId: req.userId, profileId: profile._id, sender: 'ai', text: aiText });

    res.json({ reply: aiMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get conversation history
router.get('/:profileId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      profileId: req.params.profileId,
      userId: req.userId
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear conversation
router.delete('/:profileId', authMiddleware, async (req, res) => {
  try {
    await Message.deleteMany({ profileId: req.params.profileId, userId: req.userId });
    res.json({ message: 'Conversation cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
