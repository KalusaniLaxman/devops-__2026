// ─── State ────────────────────────────────────────────────────────────────────
let token = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentProfile = null;
let profiles = [];

// ─── Init ──────────────────────────────────────────────────────────────────────
window.onload = () => {
  if (token && currentUser) showApp();
  else showAuth();
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display  = 'none';
}
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display  = 'flex';
  document.getElementById('user-name-display').textContent = 'Hi, ' + currentUser.name;
  loadProfiles();
  showEmptyState();
}
function showLogin()    { document.getElementById('login-form').style.display = 'block'; document.getElementById('register-form').style.display = 'none'; }
function showRegister() { document.getElementById('register-form').style.display = 'block'; document.getElementById('login-form').style.display = 'none'; }

async function login() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('auth-error');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Please fill all fields.'; return; }

  try {
    const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    saveAuth(data);
    showApp();
  } catch { errEl.textContent = 'Connection error. Is the server running?'; }
}

async function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('reg-error');
  errEl.textContent = '';
  if (!name || !email || !password) { errEl.textContent = 'Please fill all fields.'; return; }

  try {
    const res  = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }
    saveAuth(data);
    showApp();
  } catch { errEl.textContent = 'Connection error. Is the server running?'; }
}

function saveAuth(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(currentUser));
}

function logout() {
  token = null; currentUser = null; currentProfile = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  showAuth();
}

// ─── Profile helpers ──────────────────────────────────────────────────────────
async function loadProfiles() {
  try {
    const res  = await fetch('/api/profiles', { headers: { Authorization: 'Bearer ' + token } });
    profiles   = await res.json();
    renderSidebar();
  } catch { console.error('Failed to load profiles'); }
}

function renderSidebar() {
  const list = document.getElementById('profiles-list');
  if (!profiles.length) { list.innerHTML = '<p class="empty-hint">No memories yet.<br/>Add one above.</p>'; return; }

  list.innerHTML = profiles.map(p => {
    const active = currentProfile?._id === p._id ? 'active' : '';
    const avatarHtml = p.image
      ? `<img class="profile-card-avatar" src="/uploads/${p.image}" alt="${p.name}" />`
      : `<div class="profile-card-initials">${initials(p.name)}</div>`;
    return `
      <div class="profile-card ${active}" onclick="openChat('${p._id}')">
        ${avatarHtml}
        <div class="profile-card-info">
          <div class="profile-card-name">${p.name}</div>
          <div class="profile-card-rel">${p.relationship}</div>
        </div>
      </div>`;
  }).join('');
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function showEmptyState() {
  hide('add-profile-panel'); hide('chat-panel');
  show('empty-state');
  currentProfile = null;
  document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('active'));
}

function showAddProfile() {
  hide('empty-state'); hide('chat-panel');
  show('add-profile-panel');
}

async function createProfile() {
  const name         = document.getElementById('p-name').value.trim();
  const relationship = document.getElementById('p-relation').value.trim();
  const personality  = document.getElementById('p-personality').value;
  const bio          = document.getElementById('p-bio').value.trim();
  const imageFile    = document.getElementById('p-image').files[0];
  const audioFiles   = document.getElementById('p-audio').files;
  const errEl        = document.getElementById('profile-error');
  errEl.textContent  = '';

  if (!name || !relationship) { errEl.textContent = 'Name and relationship are required.'; return; }

  const fd = new FormData();
  fd.append('name', name);
  fd.append('relationship', relationship);
  fd.append('personality', personality);
  fd.append('bio', bio);
  if (imageFile) fd.append('image', imageFile);
  for (const af of audioFiles) fd.append('audio', af);

  try {
    const res  = await fetch('/api/profiles', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }

    // Reset form
    ['p-name','p-relation','p-bio'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('p-image').value = '';
    document.getElementById('p-audio').value = '';

    profiles.push(data);
    renderSidebar();
    openChat(data._id);
  } catch { errEl.textContent = 'Failed to create profile.'; }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
async function openChat(profileId) {
  currentProfile = profiles.find(p => p._id === profileId);
  if (!currentProfile) return;

  hide('empty-state'); hide('add-profile-panel');
  show('chat-panel');
  renderSidebar();

  // Set header
  document.getElementById('chat-name').textContent    = currentProfile.name;
  document.getElementById('chat-relation').textContent = currentProfile.relationship;

  // Avatar
  const img      = document.getElementById('chat-avatar');
  const initEl   = document.getElementById('chat-avatar-initials');
  if (currentProfile.image) {
    img.src = '/uploads/' + currentProfile.image;
    img.style.display   = 'block';
    initEl.style.display = 'none';
  } else {
    img.style.display          = 'none';
    initEl.style.display       = 'flex';
    initEl.textContent         = initials(currentProfile.name);
  }

  await loadMessages();
  document.getElementById('msg-input').focus();
}

async function loadMessages() {
  const box = document.getElementById('messages-box');
  box.innerHTML = '<div class="messages-loading">Loading…</div>';
  try {
    const res  = await fetch('/api/chat/' + currentProfile._id, { headers: { Authorization: 'Bearer ' + token } });
    const msgs = await res.json();
    box.innerHTML = '';
    if (!msgs.length) {
      box.innerHTML = `<div class="messages-loading" style="color:var(--brown)">Start your conversation with ${currentProfile.name}…</div>`;
      return;
    }
    msgs.forEach(m => appendBubble(m.sender, m.text, m.createdAt));
    scrollBottom();
  } catch { box.innerHTML = '<div class="messages-loading">Failed to load messages.</div>'; }
}

async function sendMessage() {
  const input = document.getElementById('msg-input');
  const text  = input.value.trim();
  if (!text || !currentProfile) return;

  input.value = '';
  appendBubble('user', text, new Date().toISOString());
  scrollBottom();
  showTyping(true);

  try {
    const res  = await fetch('/api/chat/' + currentProfile._id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    // slight delay for realism
    setTimeout(() => {
      showTyping(false);
      if (data.reply) appendBubble('ai', data.reply.text, data.reply.createdAt);
      scrollBottom();
    }, 800 + Math.random() * 600);
  } catch {
    showTyping(false);
    appendBubble('ai', 'Sorry, something went wrong. Please try again.', new Date().toISOString());
  }
}

function appendBubble(sender, text, dateStr) {
  const box  = document.getElementById('messages-box');
  // Remove empty-state hint if present
  const hint = box.querySelector('.messages-loading');
  if (hint) hint.remove();

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap ' + sender;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'bubble-time';
  time.textContent = formatTime(dateStr);

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  box.appendChild(wrap);
}

function showTyping(show) {
  document.getElementById('typing-indicator').style.display = show ? 'flex' : 'none';
}

async function clearChat() {
  if (!currentProfile) return;
  if (!confirm('Clear this conversation? This cannot be undone.')) return;
  try {
    await fetch('/api/chat/' + currentProfile._id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    await loadMessages();
  } catch { alert('Failed to clear.'); }
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function scrollBottom() {
  const box = document.getElementById('messages-box');
  setTimeout(() => { box.scrollTop = box.scrollHeight; }, 30);
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
