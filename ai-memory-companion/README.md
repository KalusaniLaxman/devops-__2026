# ✦ AI Memory Companion

> Talk to simulated versions of people you love and miss.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up MongoDB

**Option A – Local MongoDB (easiest):**
- Install MongoDB Community: https://www.mongodb.com/try/download/community
- Start the service: `mongod` (or via system services)
- Your URI is: `mongodb://localhost:27017/memory-companion`

**Option B – MongoDB Atlas (cloud, free tier):**
- Sign up at https://cloud.mongodb.com
- Create a free cluster
- Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/memory-companion`)

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and paste your MONGO_URI
```

### 4. Run the app
```bash
node server.js
```

### 5. Open in browser
```
http://localhost:5000
```

---

## 📁 Project Structure

```
ai-memory-companion/
├── server.js              ← Entry point
├── package.json
├── .env.example
├── models/
│   ├── User.js            ← name, email, password
│   ├── Profile.js         ← person's info + files
│   └── Message.js         ← chat history
├── routes/
│   ├── auth.js            ← /api/auth/register, /api/auth/login
│   ├── profile.js         ← /api/profiles (CRUD)
│   └── chat.js            ← /api/chat/:profileId (GET, POST, DELETE)
├── middleware/
│   └── auth.js            ← JWT verification
├── uploads/               ← auto-created, stores images & audio
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 🧠 How the AI Works

No external AI APIs. Responses are generated using **personality-based logic**:

| Personality | Style |
|-------------|-------|
| Kind        | Warm, loving, supportive |
| Funny       | Humorous, playful, lighthearted |
| Calm        | Peaceful, thoughtful, serene |
| Serious     | Direct, honest, measured |
| Gentle      | Nurturing, soft, tender |

The message is analyzed for tone (greeting, missing someone, love, sadness, advice, general) and the matching response pool is selected.

---

## ✨ Features

- 🔐 JWT authentication (register / login)
- 👤 Memory profiles with photo upload
- 🎵 Audio file storage (demo mode)
- 💬 Chat with typing indicator
- 🗂 Chat history saved in MongoDB
- 📱 Mobile responsive

---

## 🔧 .env Reference

```env
MONGO_URI=mongodb://localhost:27017/memory-companion
JWT_SECRET=your_long_random_secret_here
PORT=5000
```
