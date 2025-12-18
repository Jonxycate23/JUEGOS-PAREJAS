import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

// Emojis personalizados únicos
const CUSTOM_EMOJIS = {
  // Amor y cariño
  'heart_eyes': '😍',
  'kiss': '😘',
  'love': '🥰',
  'hug': '🤗',
  'hearts': '💕',
  'sparkle_heart': '💖',
  'cupid': '💘',
  'rose': '🌹',
  
  // Reacciones especiales
  'fire': '🔥',
  'star': '⭐',
  'boom': '💥',
  'tada': '🎉',
  'crown': '👑',
  'gem': '💎',
  'magic': '✨',
  'rainbow': '🌈',
  
  // Emociones
  'laugh': '😂',
  'wink': '😉',
  'smirk': '😏',
  'cool': '😎',
  'angel': '😇',
  'devil': '😈',
  'think': '🤔',
  'wow': '😮',
  'shock': '😱',
  'cry': '😢',
  'nervous': '😅',
  'blush': '😊',
  
  // Juegos y diversión
  'game': '🎮',
  'trophy': '🏆',
  'medal': '🥇',
  'clap': '👏',
  'muscle': '💪',
  'finger_cross': '🤞',
  'party': '🥳',
  'dance': '💃',
  
  // Alimentos y bebidas
  'pizza': '🍕',
  'cake': '🍰',
  'wine': '🍷',
  'beer': '🍺',
  'coffee': '☕',
  'ice_cream': '🍦',
  'chocolate': '🍫',
  'strawberry': '🍓',
  
  // Animales lindos
  'cat': '🐱',
  'dog': '🐶',
  'bear': '🐻',
  'panda': '🐼',
  'koala': '🐨',
  'unicorn': '🦄',
  'butterfly': '🦋',
  'penguin': '🐧',
  
  // Símbolos especiales
  'star_eyes': '🤩',
  'peace': '✌️',
  'ok_hand': '👌',
  'thumbs_up': '👍',
  'fist': '👊',
  'wave': '👋',
  'point_right': '👉',
  'point_left': '👈'
};

// Categorías de emojis
const EMOJI_CATEGORIES = {
  'Amor': ['heart_eyes', 'kiss', 'love', 'hug', 'hearts', 'sparkle_heart', 'cupid', 'rose'],
  'Especial': ['fire', 'star', 'boom', 'tada', 'crown', 'gem', 'magic', 'rainbow'],
  'Emociones': ['laugh', 'wink', 'smirk', 'cool', 'angel', 'devil', 'think', 'wow'],
  'Juego': ['game', 'trophy', 'medal', 'clap', 'muscle', 'finger_cross', 'party', 'dance'],
  'Comida': ['pizza', 'cake', 'wine', 'beer', 'coffee', 'ice_cream', 'chocolate', 'strawberry'],
  'Animales': ['cat', 'dog', 'bear', 'panda', 'koala', 'unicorn', 'butterfly', 'penguin']
};

let chatOpen = false;

// Crear HTML del chat
export function initChat() {
  if (!document.getElementById('chat-widget')) {
    const chatHTML = `
      <div id="chat-widget">
        <!-- Botón flotante -->
        <button id="chat-toggle" class="chat-fab">
          💬
          <span class="chat-badge" id="unread-badge" style="display: none;">0</span>
        </button>

        <!-- Ventana de chat -->
        <div id="chat-window" class="chat-window">
          <!-- Header -->
          <div class="chat-header">
            <span>💕 Chat de Pareja</span>
            <div>
              <button id="emoji-panel-toggle" class="chat-btn-small">😊</button>
              <button id="chat-close" class="chat-btn-small">✕</button>
            </div>
          </div>

          <!-- Panel de emojis -->
          <div id="emoji-panel" class="emoji-panel" style="display: none;">
            ${generateEmojiPanel()}
          </div>

          <!-- Mensajes -->
          <div id="chat-messages" class="chat-messages"></div>

          <!-- Input -->
          <div class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200">
            <button id="chat-send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      width: 350px;
      height: 500px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }

    .chat-btn-small {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      margin-left: 8px;
      font-size: 18px;
    }

    .chat-btn-small:hover {
      background: rgba(255,255,255,0.3);
    }

    .emoji-panel {
      background: #f8f9fa;
      max-height: 250px;
      overflow-y: auto;
      border-bottom: 1px solid #e0e0e0;
    }

    .emoji-category {
      padding: 10px;
    }

    .emoji-category-name {
      font-size: 12px;
      color: #666;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
    }

    .emoji-btn {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 5px;
      font-size: 20px;
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
      padding: 15px;
      background: #fafafa;
    }

    .chat-message {
      margin-bottom: 12px;
      animation: slideIn 0.3s ease;
    }

    .message-user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }

    .message-avatar {
      font-size: 20px;
    }

    .message-username {
      font-size: 12px;
      font-weight: bold;
      color: #667eea;
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
      text-align: right;
    }

    .chat-message-bubble {
      display: inline-block;
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 70%;
      word-wrap: break-word;
    }

    .chat-message.me .chat-message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .chat-message.them .chat-message-bubble {
      background: white;
      color: #333;
      border: 1px solid #e0e0e0;
    }

    .chat-message-time {
      font-size: 10px;
      color: #999;
      margin-top: 5px;
    }

    .chat-input-container {
      display: flex;
      padding: 15px;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    #chat-input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      padding: 10px 15px;
      font-size: 14px;
      outline: none;
    }

    #chat-send {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-left: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #chat-send:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .chat-window {
        width: calc(100vw - 40px);
        height: 70vh;
        right: -10px;
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
  
  // Badge de no leídos
  if (!chatOpen && messages.length > 0) {
    showUnreadBadge();
  }
}

// Badge de mensajes no leídos
function showUnreadBadge() {
  const badge = document.getElementById('unread-badge');
  badge.style.display = 'flex';
  const current = parseInt(badge.textContent) || 0;
  badge.textContent = current + 1;
}

function clearUnreadBadge() {
  const badge = document.getElementById('unread-badge');
  badge.style.display = 'none';
  badge.textContent = '0';
}