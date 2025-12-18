import { db } from "./firebase.js";
import { currentUser } from "./auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================== CONFIGURACIÓN ====================

// Lista completa de juegos
const GAMES = [
  {
    id: 'hangman',
    name: 'Ahorcado',
    icon: '🔤',
    description: 'Adivina la palabra letra por letra',
    timer: null,
    available: true
  },
  {
    id: 'memory',
    name: 'Memoria',
    icon: '🧠',
    description: 'Recuerdos Cruzados - Encuentra las parejas',
    timer: '⏱️ 10-15 seg',
    available: false
  },
  {
    id: 'tictactoe',
    name: 'Totito',
    icon: '❌⭕',
    description: 'Tres en Caos - Tic-Tac-Toe con retos',
    timer: '⏱️ 15-20 seg',
    available: false
  },
  {
    id: 'truth-dare',
    name: 'Verdad o Reto',
    icon: '💬',
    description: 'Sin Filtro - Confesiones y desafíos',
    timer: '⏱️ Flexible',
    available: false
  },
  {
    id: 'jenga',
    name: 'Jenga Virtual',
    icon: '🧱',
    description: 'Torre del Caos - Saca bloques sin caer',
    timer: '⏱️ 10-30 seg',
    available: false
  },
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '🧪',
    description: 'Batalla Mental - Responde rápido',
    timer: '⏱️ 10-20 seg',
    available: false
  },
  {
    id: 'never-have-i',
    name: 'Yo Nunca',
    icon: '🚫',
    description: 'Confesiones - Descubre secretos',
    timer: 'Sin tiempo',
    available: false
  },
  {
    id: 'would-you-rather',
    name: 'Qué Prefieres',
    icon: '🤔',
    description: 'Dilema Total - Elecciones imposibles',
    timer: '⏱️ 10-15 seg',
    available: false
  },
  {
    id: 'roulette',
    name: 'Ruleta de Retos',
    icon: '🎡',
    description: 'Giro Fatal - La ruleta decide',
    timer: '⏱️ 5-30 seg',
    available: false
  },
  {
    id: 'spin-bottle',
    name: 'Botella Giratoria',
    icon: '🍾',
    description: 'Punto de Mira - La botella elige',
    timer: '⏱️ 20-30 seg',
    available: false
  },
  {
    id: 'dice',
    name: 'Dado Virtual',
    icon: '🎲',
    description: 'Cara o Caos - El dado manda',
    timer: '⏱️ 5-20 seg',
    available: false
  }
];

// Avatares disponibles
const AVATARS = [
  '👤', '👨', '👩', '🧑', '👦', '👧',
  '😀', '😃', '😄', '😁', '😆', '😊',
  '😍', '🥰', '😘', '😎', '🤩', '🥳',
  '🐱', '🐶', '🐼', '🐨', '🦄', '🦋',
  '🌟', '⭐', '✨', '💖', '💕', '❤️',
  '🎮', '🎯', '🎲', '🎭', '🎪', '🎨'
];

// ==================== ESTADO GLOBAL ====================

let selectedGame = null;
let userProfile = {
  name: 'Usuario',
  avatar: '👤'
};

// ==================== INICIALIZACIÓN ====================

window.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  renderGames();
  renderAvatars();
  attachEventListeners();
});

// ==================== PERFIL DE USUARIO ====================

function loadUserProfile() {
  const savedProfile = localStorage.getItem('userProfile');
  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
  }
  updateProfileDisplay();
}

function saveUserProfile() {
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  updateProfileDisplay();
}

function updateProfileDisplay() {
  document.getElementById('current-name').textContent = userProfile.name;
  document.getElementById('current-avatar').textContent = userProfile.avatar;
}

// ==================== RENDERIZADO ====================

function renderGames() {
  const grid = document.getElementById('games-grid');
  grid.innerHTML = '';

  GAMES.forEach(game => {
    const card = document.createElement('div');
    card.className = `game-card ${game.available ? 'available' : 'unavailable'}`;
    card.dataset.gameId = game.id;

    card.innerHTML = `
      <div class="game-icon">${game.icon}</div>
      <div class="game-name">${game.name}</div>
      <div class="game-description">${game.description}</div>
      ${game.timer ? `<div class="game-timer">${game.timer}</div>` : ''}
      <div class="game-status ${game.available ? 'status-available' : 'status-soon'}">
        ${game.available ? '✅ Disponible' : '🔜 Disponible muy pronto'}
      </div>
    `;

    if (game.available) {
      card.addEventListener('click', () => selectGame(game, card));
    }

    grid.appendChild(card);
  });
}

function renderAvatars() {
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = '';

  AVATARS.forEach(avatar => {
    const option = document.createElement('div');
    option.className = 'avatar-option';
    option.textContent = avatar;
    
    if (avatar === userProfile.avatar) {
      option.classList.add('selected');
    }

    option.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.remove('selected');
      });
      option.classList.add('selected');
      userProfile.avatar = avatar;
    });

    grid.appendChild(option);
  });
}

// ==================== SELECCIÓN DE JUEGO ====================

function selectGame(game, cardElement) {
  // Remover selección previa
  document.querySelectorAll('.game-card').forEach(card => {
    card.style.border = card.classList.contains('available') ? '2px solid #667eea' : 'none';
  });

  // Seleccionar nuevo juego
  selectedGame = game.id;
  cardElement.style.border = '4px solid #764ba2';
  cardElement.style.boxShadow = '0 12px 24px rgba(118, 75, 162, 0.4)';

  // Scroll suave a la sección de sala
  document.querySelector('.room-section').scrollIntoView({ 
    behavior: 'smooth',
    block: 'center'
  });
}

// ==================== GESTIÓN DE SALAS ====================

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

async function createRoom() {
  if (!currentUser) {
    alert('⚠️ Espera un momento, conectando...');
    return;
  }

  if (!selectedGame) {
    alert('⚠️ Primero selecciona un juego');
    return;
  }

  const roomId = generateRoomId();

  try {
    await setDoc(doc(db, 'rooms', roomId), {
      createdAt: serverTimestamp(),
      state: 'waiting',
      game: selectedGame,
      turn: 'p1',
      players: {
        p1: {
          uid: currentUser.uid,
          name: userProfile.name,
          avatar: userProfile.avatar,
          online: true
        }
      },
      gameData: getInitialGameData(selectedGame),
      chat: []
    });

    console.log('🆕 Sala creada:', roomId);
    
    // Guardar ID de sala en sessionStorage
    sessionStorage.setItem('currentRoom', roomId);
    
    // Redirigir a la sala
    window.location.href = `room.html?room=${roomId}`;
    
  } catch (error) {
    console.error('Error al crear sala:', error);
    alert('❌ Error al crear la sala. Intenta de nuevo.');
  }
}

async function joinRoom() {
  if (!currentUser) {
    alert('⚠️ Espera un momento, conectando...');
    return;
  }

  const roomId = document.getElementById('room-code-input').value.trim().toUpperCase();
  const messageEl = document.getElementById('room-message');

  if (!roomId) {
    messageEl.textContent = '⚠️ Ingresa un código de sala';
    return;
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      messageEl.textContent = '❌ La sala no existe';
      return;
    }

    const room = roomSnap.data();

    // Si ya eres p1, entra directamente
    if (room.players?.p1?.uid === currentUser.uid) {
      sessionStorage.setItem('currentRoom', roomId);
      window.location.href = `room.html?room=${roomId}`;
      return;
    }

    // Si hay espacio, únete como p2
    if (!room.players?.p2) {
      await updateDoc(roomRef, {
        'players.p2': {
          uid: currentUser.uid,
          name: userProfile.name,
          avatar: userProfile.avatar,
          online: true
        },
        state: 'ready'
      });

      console.log('🎮 Unido como p2:', roomId);
      sessionStorage.setItem('currentRoom', roomId);
      window.location.href = `room.html?room=${roomId}`;
      return;
    }

    // Sala llena
    messageEl.textContent = '🚫 La sala está llena';
    
  } catch (error) {
    console.error('Error al unirse:', error);
    messageEl.textContent = '❌ Error al unirse. Intenta de nuevo.';
  }
}

// ==================== DATOS INICIALES DE JUEGOS ====================

function getInitialGameData(gameId) {
  const initialData = {
    hangman: {
      phase: 'set-word',
      setter: 'p1',
      guesser: 'p2',
      secretWord: '',
      challenge: '',
      displayWord: '',
      guessedLetters: [],
      mistakes: 0,
      maxMistakes: 6,
      winner: null
    },
    memory: {
      phase: 'setup',
      cards: [],
      flippedCards: [],
      currentPlayer: 'p1',
      scores: { p1: 0, p2: 0 },
      challenge: '',
      timerActive: false,
      timeLeft: 15
    },
    // Agregar más juegos aquí cuando estén listos
  };

  return initialData[gameId] || {};
}

// ==================== EVENT LISTENERS ====================

function attachEventListeners() {
  // Avatar clickeable
  document.getElementById('current-avatar').addEventListener('click', () => {
    openProfileModal();
  });

  // Botón de editar perfil
  document.getElementById('change-profile-btn').addEventListener('click', () => {
    openProfileModal();
  });

  // Modal - Cancelar
  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeProfileModal();
  });

  // Modal - Guardar
  document.getElementById('save-profile-btn').addEventListener('click', () => {
    saveProfile();
  });

  // Click fuera del modal para cerrar
  document.getElementById('profile-modal').addEventListener('click', (e) => {
    if (e.target.id === 'profile-modal') {
      closeProfileModal();
    }
  });

  // Botones de sala
  document.getElementById('create-room-btn').addEventListener('click', createRoom);
  document.getElementById('join-room-btn').addEventListener('click', joinRoom);

  // Enter en input de código
  document.getElementById('room-code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  });
}

// ==================== MODAL ====================

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  const nameInput = document.getElementById('name-input');
  
  nameInput.value = userProfile.name;
  modal.classList.add('active');
  nameInput.focus();
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  modal.classList.remove('active');
}

function saveProfile() {
  const nameInput = document.getElementById('name-input');
  const newName = nameInput.value.trim();

  if (!newName) {
    alert('⚠️ Escribe un nombre');
    return;
  }

  userProfile.name = newName;
  saveUserProfile();
  closeProfileModal();

  // Mostrar confirmación
  const btn = document.getElementById('save-profile-btn');
  const originalText = btn.textContent;
  btn.textContent = '✅ Guardado';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}

// ==================== UTILIDADES ====================

// Auto-scroll para navegación suave
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

setupSmoothScroll();

// ==================== EXPORTAR ====================

export { userProfile, selectedGame };