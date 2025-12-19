import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

// Emojis personalizados únicos
const CUSTOM_EMOJIS = {
  'heart_eyes': '😍', 'kiss': '😘', 'love': '🥰', 'hug': '🤗',
  'hearts': '💕', 'sparkle_heart': '💖', 'cupid': '💘', 'rose': '🌹',
  'fire': '🔥', 'star': '⭐', 'boom': '💥', 'tada': '🎉',
  'crown': '👑', 'gem': '💎', 'magic': '✨', 'rainbow': '🌈',
  'laugh': '😂', 'wink': '😉', 'smirk': '😏', 'cool': '😎',
  'angel': '😇', 'devil': '😈', 'think': '🤔', 'wow': '😮',
  'game': '🎮', 'trophy': '🏆', 'medal': '🥇', 'clap': '👏',
  'pizza': '🍕', 'cake': '🍰', 'wine': '🍷', 'coffee': '☕',
  'cat': '🐱', 'dog': '🐶', 'bear': '🐻', 'unicorn': '🦄'
};

const EMOJI_CATEGORIES = {
  'Amor': ['heart_eyes', 'kiss', 'love', 'hug', 'hearts', 'sparkle_heart'],
  'Especial': ['fire', 'star', 'boom', 'tada', 'crown', 'gem'],
  'Emociones': ['laugh', 'wink', 'smirk', 'cool', 'angel', 'devil'],
  'Juego': ['game', 'trophy', 'medal', 'clap'],
  'Comida': ['pizza', 'cake', 'wine', 'coffee'],
  'Animales': ['cat', 'dog', 'bear', 'unicorn']
};

let chatOpen = false;
let partnerInfo = { name: 'Pareja', avatar: '💕' };
let lastMessageCount = 0; // Contador de mensajes leídos

// Crear HTML del chat
export function initChat() {
  if (!document.getElementById('chat-widget')) {
    const chatHTML = `
      <div id="chat-widget">
        <button id="chat-toggle" class="chat-fab">
          💬
          <span class="chat-badge" id="unread-badge" style="display: none;">0</span>
        </button>

        <div id="chat-window" class="chat-window">
          <div class="chat-header">
            <div class="chat-header-info" id="chat-header-info">
              <div class="chat-header-avatar">💕</div>
              <div class="chat-header-text">
                <div class="chat-header-name">Chat de Pareja</div>
                <div class="chat-header-status">En línea</div>
              </div>
            </div>
            <div class="chat-header-buttons">
              <button id="emoji-panel-toggle" class="chat-btn-small" title="Emojis">😊</button>
              <button id="chat-close" class="chat-btn-small" title="Cerrar">✕</button>
            </div>
          </div>

          <div id="emoji-panel" class="emoji-panel" style="display: none;">
            ${generateEmojiPanel()}
          </div>

          <div id="chat-messages" class="chat-messages"></div>

          <div class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200">
            <button id="chat-send" title="Enviar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    attachChatStyles();
    attachChatListeners();
    loadPartnerInfo();
  }
}

// Cargar información de la pareja
async function loadPartnerInfo() {
  if (!roomId) return;
  
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    const room = roomSnap.data();
    const players = room.players;
    
    // Determinar quién es la pareja
    let partner = null;
    if (players.p1?.uid === currentUser.uid && players.p2) {
      partner = players.p2;
    } else if (players.p2?.uid === currentUser.uid && players.p1) {
      partner = players.p1;
    }
    
    if (partner) {
      partnerInfo = {
        name: partner.name || 'Pareja',
        avatar: partner.avatar || '💕'
      };
      updateChatHeader();
    }
  }
}

// Actualizar header del chat
function updateChatHeader() {
  const headerInfo = document.getElementById('chat-header-info');
  if (headerInfo) {
    headerInfo.innerHTML = `
      <div class="chat-header-avatar">${partnerInfo.avatar}</div>
      <div class="chat-header-text">
        <div class="chat-header-name">Chat con ${partnerInfo.name}</div>
        <div class="chat-header-status">En línea</div>
      </div>
    `;
  }
}

// Generar panel de emojis
function generateEmojiPanel() {
  let html = '<div class="emoji-categories">';
  
  for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
    html += `<div class="emoji-category">`;
    html += `<div class="emoji-category-name">${category}</div>`;
    html += `<div class="emoji-grid">`;
    
    emojis.forEach(key => {
      html += `<button class="emoji-btn" data-emoji="${CUSTOM_EMOJIS[key]}">${CUSTOM_EMOJIS[key]}</button>`;
    });
    
    html += `</div></div>`;
  }
  
  html += '</div>';
  return html;
}

// Estilos del chat
function attachChatStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }

    .chat-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF8C69 0%, #D946EF 100%);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.3s;
      position: relative;
    }

    .chat-fab:hover {
      transform: scale(1.1);
    }

    .chat-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 320px;
      max-height: 500px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-window.active {
      display: flex;
    }

    .chat-header {
      background: linear-gradient(135deg, #FF8C69 0%, #D946EF 100%);
      color: white;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .chat-header-avatar {
      font-size: 24px;
      line-height: 1;
    }

    .chat-header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chat-header-name {
      font-weight: bold;
      font-size: 14px;
      line-height: 1.2;
    }

    .chat-header-status {
      font-size: 11px;
      opacity: 0.8;
      line-height: 1;
    }

    .chat-header-buttons {
      display: flex;
      gap: 5px;
    }

    .chat-btn-small {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .chat-btn-small:hover {
      background: rgba(255,255,255,0.3);
    }

    .emoji-panel {
      background: #f8f9fa;
      max-height: 180px;
      overflow-y: auto;
      border-bottom: 1px solid #e0e0e0;
    }

    .emoji-category {
      padding: 8px;
    }

    .emoji-category-name {
      font-size: 11px;
      color: #666;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 3px;
    }

    .emoji-btn {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 4px;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .emoji-btn:hover {
      transform: scale(1.2);
      background: #f0f0f0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: #fafafa;
      max-height: 300px;
    }

    .chat-message {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
    }

    .message-user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .message-avatar {
      font-size: 18px;
      line-height: 1;
    }

    .message-username {
      font-size: 11px;
      font-weight: bold;
      color: #FF8C69;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat-message.me {
      align-items: flex-end;
    }

    .chat-message.them {
      align-items: flex-start;
    }

    .chat-message-bubble {
      padding: 8px 12px;
      border-radius: 15px;
      max-width: 75%;
      word-wrap: break-word;
      font-size: 13px;
      line-height: 1.4;
    }

    .chat-message.me .chat-message-bubble {
      background: linear-gradient(135deg, #FF8C69 0%, #D946EF 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .chat-message.them .chat-message-bubble {
      background: white;
      color: #333;
      border: 1px solid #e0e0e0;
      border-bottom-left-radius: 4px;
    }

    .chat-message-time {
      font-size: 10px;
      color: #999;
      margin-top: 3px;
    }

    .chat-input-container {
      display: flex;
      padding: 10px;
      border-top: 1px solid #e0e0e0;
      background: white;
      gap: 8px;
    }

    #chat-input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }

    #chat-send {
      background: linear-gradient(135deg, #FF8C69 0%, #D946EF 100%);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }

    #chat-send:hover {
      opacity: 0.9;
    }

    #chat-send svg {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .chat-window {
        width: calc(100vw - 40px);
        max-width: 350px;
        right: -10px;
        bottom: 70px;
      }
      
      .chat-messages {
        max-height: 250px;
      }
    }

    @media (max-width: 480px) {
      #chat-widget {
        bottom: 15px;
        right: 15px;
      }
      
      .chat-fab {
        width: 50px;
        height: 50px;
        font-size: 24px;
      }
      
      .chat-window {
        width: calc(100vw - 30px);
        max-height: 400px;
        bottom: 65px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Event listeners del chat
function attachChatListeners() {
  const toggle = document.getElementById('chat-toggle');
  const close = document.getElementById('chat-close');
  const window = document.getElementById('chat-window');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const emojiToggle = document.getElementById('emoji-panel-toggle');
  const emojiPanel = document.getElementById('emoji-panel');

  toggle.addEventListener('click', () => {
    chatOpen = !chatOpen;
    window.classList.toggle('active');
    if (chatOpen) {
      input.focus();
      // Marcar todos los mensajes actuales como leídos
      const roomRef = doc(db, "rooms", roomId);
      onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
          const room = snap.data();
          lastMessageCount = (room.chat || []).length;
        }
      }, { once: true });
      clearUnreadBadge();
    }
  });

  close.addEventListener('click', () => {
    chatOpen = false;
    window.classList.remove('active');
  });

  emojiToggle.addEventListener('click', () => {
    emojiPanel.style.display = emojiPanel.style.display === 'none' ? 'block' : 'none';
  });

  // Emojis
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value += btn.dataset.emoji;
      input.focus();
    });
  });

  // Enviar mensaje
  send.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Escuchar mensajes
  if (roomId) {
    const roomRef = doc(db, "rooms", roomId);
    onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const room = snap.data();
        renderMessages(room.chat || []);
      }
    });
  }
}

// Enviar mensaje
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message || !roomId) return;

  // Obtener perfil del usuario
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{"name":"Usuario","avatar":"👤"}');

  const roomRef = doc(db, "rooms", roomId);
  
  await updateDoc(roomRef, {
    chat: arrayUnion({
      uid: currentUser.uid,
      name: userProfile.name,
      avatar: userProfile.avatar,
      text: message,
      timestamp: Date.now()
    })
  });

  input.value = '';
  document.getElementById('emoji-panel').style.display = 'none';
}

// Renderizar mensajes
function renderMessages(messages) {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  
  messages.forEach(msg => {
    const isMe = msg.uid === currentUser.uid;
    const time = new Date(msg.timestamp).toLocaleTimeString('es', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isMe ? 'me' : 'them'}`;
    messageDiv.innerHTML = `
      ${!isMe ? `
        <div class="message-user-info">
          <span class="message-avatar">${msg.avatar || '👤'}</span>
          <span class="message-username">${msg.name || 'Usuario'}</span>
        </div>
      ` : ''}
      <div class="chat-message-bubble">${msg.text}</div>
      <div class="chat-message-time">${time}</div>
    `;
    container.appendChild(messageDiv);
  });
  
  container.scrollTop = container.scrollHeight;
  
  // Badge de no leídos - SOLO si hay mensajes nuevos Y el chat está cerrado
  if (!chatOpen && messages.length > lastMessageCount) {
    const newMessages = messages.length - lastMessageCount;
    showUnreadBadge(newMessages);
  }
  
  // Si el chat está abierto, actualizar contador de leídos
  if (chatOpen) {
    lastMessageCount = messages.length;
    clearUnreadBadge();
  }
}

// Badge de mensajes no leídos
function showUnreadBadge(count) {
  const badge = document.getElementById('unread-badge');
  badge.style.display = 'flex';
  badge.textContent = count;
}

function clearUnreadBadge() {
  const badge = document.getElementById('unread-badge');
  badge.style.display = 'none';
  badge.textContent = '0';
}