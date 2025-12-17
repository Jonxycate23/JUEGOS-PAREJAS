import { db } from "./firebase.js";
import { currentUser } from "./auth.js";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Emojis únicos para parejas
const COUPLE_EMOJIS = {
  love: ['💕', '💖', '💗', '💓', '💞', '💝', '❤️‍🔥', '❣️', '💘', '💟'],
  kiss: ['😘', '😚', '😙', '💋', '😗', '😽', '😻'],
  happy: ['😊', '🥰', '😍', '🤗', '😄', '😁', '🤭', '😌'],
  playful: ['😜', '😝', '🤪', '😛', '🤫', '🙈', '🙊', '🙉'],
  flirt: ['😏', '😉', '🥴', '🫦', '👅', '💃', '🕺'],
  fire: ['🔥', '💥', '✨', '⚡', '💫', '🌟', '⭐'],
  romantic: ['🌹', '🥀', '💐', '🌺', '🌸', '🌷', '🏵️'],
  food: ['🍓', '🍒', '🍑', '🍇', '🍫', '🍰', '🍷', '🥂', '🍾'],
  gestures: ['👉👈', '🤝', '🫱🫲', '👫', '💏', '💑', '🫂'],
  reactions: ['😳', '🥺', '😩', '🥵', '🫠', '🤤', '😵‍💫']
};

export class CoupleChat {
  constructor(roomId) {
    this.roomId = roomId;
    this.roomRef = doc(db, 'rooms', roomId);
    this.isOpen = false;
    this.unreadCount = 0;
    this.setupChat();
    this.listenToMessages();
  }

  setupChat() {
    // Crear estructura del chat
    const chatHTML = `
      <div id="couple-chat" class="couple-chat">
        <div class="chat-toggle" id="chat-toggle">
          💬
          <span class="unread-badge" id="unread-badge">0</span>
        </div>
        
        <div class="chat-window" id="chat-window">
          <div class="chat-header">
            <h3>💕 Chat de Pareja</h3>
            <button class="chat-close" id="chat-close">✕</button>
          </div>
          
          <div class="chat-messages" id="chat-messages"></div>
          
          <div class="chat-emoji-bar">
            ${this.renderEmojiBar()}
          </div>
          
          <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200" />
            <button id="chat-send">Enviar</button>
          </div>
        </div>
      </div>
    `;

    // Agregar al body
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Agregar estilos
    this.addStyles();

    // Event listeners
    document.getElementById('chat-toggle').addEventListener('click', () => this.toggleChat());
    document.getElementById('chat-close').addEventListener('click', () => this.toggleChat());
    document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Event listeners para emojis
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => this.insertEmoji(btn.textContent));
    });
  }

  renderEmojiBar() {
    let html = '<div class="emoji-categories">';
    
    for (const [category, emojis] of Object.entries(COUPLE_EMOJIS)) {
      html += `<div class="emoji-category">`;
      emojis.forEach(emoji => {
        html += `<button class="emoji-btn" title="${category}">${emoji}</button>`;
      });
      html += `</div>`;
    }
    
    html += '</div>';
    return html;
  }

  insertEmoji(emoji) {
    const input = document.getElementById('chat-input');
    input.value += emoji;
    input.focus();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWindow = document.getElementById('chat-window');
    chatWindow.classList.toggle('active', this.isOpen);
    
    if (this.isOpen) {
      this.unreadCount = 0;
      this.updateUnreadBadge();
      this.scrollToBottom();
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    await updateDoc(this.roomRef, {
      messages: arrayUnion({
        uid: currentUser.uid,
        text: message,
        timestamp: Date.now()
      })
    });

    input.value = '';
  }

  listenToMessages() {
    onSnapshot(this.roomRef, (snap) => {
      if (!snap.exists()) return;

      const room = snap.data();
      const messages = room.messages || [];

      this.renderMessages(messages);

      // Actualizar contador de no leídos
      if (!this.isOpen && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.uid !== currentUser.uid) {
          this.unreadCount++;
          this.updateUnreadBadge();
        }
      }
    });
  }

  renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    messages.forEach(msg => {
      const isMe = msg.uid === currentUser.uid;
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${isMe ? 'me' : 'other'}`;
      
      messageDiv.innerHTML = `
        <div class="message-bubble">
          ${this.escapeHtml(msg.text)}
        </div>
        <div class="message-time">${this.formatTime(msg.timestamp)}</div>
      `;
      
      container.appendChild(messageDiv);
    });

    this.scrollToBottom();
  }

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }

  updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    badge.textContent = this.unreadCount;
    badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .couple-chat {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      }

      .chat-toggle {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: transform 0.3s;
        position: relative;
      }

      .chat-toggle:hover {
        transform: scale(1.1);
      }

      .unread-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }

      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
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
      }

      .chat-header h3 {
        margin: 0;
        font-size: 18px;
      }

      .chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: #f5f5f5;
      }

      .chat-message {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
      }

      .chat-message.me {
        align-items: flex-end;
      }

      .chat-message.other {
        align-items: flex-start;
      }

      .message-bubble {
        max-width: 70%;
        padding: 10px 15px;
        border-radius: 15px;
        word-wrap: break-word;
        font-size: 14px;
      }

      .chat-message.me .message-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 5px;
      }

      .chat-message.other .message-bubble {
        background: white;
        color: #333;
        border-bottom-left-radius: 5px;
      }

      .message-time {
        font-size: 11px;
        color: #999;
        margin-top: 5px;
      }

      .chat-emoji-bar {
        background: white;
        border-top: 1px solid #eee;
        padding: 10px;
        max-height: 120px;
        overflow-y: auto;
      }

      .emoji-categories {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .emoji-category {
        display: flex;
        gap: 3px;
      }

      .emoji-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
        border-radius: 5px;
        transition: transform 0.2s;
      }

      .emoji-btn:hover {
        transform: scale(1.3);
        background: #f0f0f0;
      }

      .chat-input-area {
        display: flex;
        padding: 10px;
        background: white;
        border-top: 1px solid #eee;
      }

      #chat-input {
        flex: 1;
        padding: 10px;
        border: 2px solid #667eea;
        border-radius: 20px;
        font-size: 14px;
        outline: none;
      }

      #chat-send {
        margin-left: 10px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
      }

      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          height: 70vh;
          bottom: 90px;
          right: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Inicializar chat automáticamente cuando se carga la página de la sala
export function initChat(roomId) {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new CoupleChat(roomId);
    });
  } else {
    new CoupleChat(roomId);
  }
}