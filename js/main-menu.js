import { db } from "./firebase.js";
import { currentUser } from "./auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Lista de juegos disponibles
const GAMES = [
  {
    id: 'hangman',
    name: 'Ahorcado',
    icon: '🔤',
    description: 'Adivina la palabra letra por letra',
    hasTimer: false,
    modes: ['online', 'local']
  },
  {
    id: 'memory',
    name: 'Memoria',
    icon: '🧠',
    description: 'Recuerdos Cruzados - Encuentra las parejas',
    hasTimer: true,
    timerText: '⏱️ 15s',
    modes: ['online', 'local', 'solo']
  },
  {
    id: 'tictactoe',
    name: 'Totito',
    icon: '❌⭕',
    description: 'Tres en Caos - Tic-Tac-Toe con retos',
    hasTimer: true,
    timerText: '⏱️ 20s',
    modes: ['online', 'local']
  },
  {
    id: 'truth-dare',
    name: 'Verdad o Reto',
    icon: '💬',
    description: 'Sin Filtro - Confesiones y desafíos',
    hasTimer: true,
    timerText: '⏱️ 60s',
    modes: ['online', 'local']
  },
  {
    id: 'jenga',
    name: 'Jenga Virtual',
    icon: '🧱',
    description: 'Torre del Caos - Saca bloques sin caer',
    hasTimer: true,
    timerText: '⏱️ 30s',
    modes: ['online', 'local']
  },
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '🧠',
    description: 'Batalla Mental - Responde rápido',
    hasTimer: true,
    timerText: '⏱️ 15s',
    modes: ['online', 'local', 'solo']
  },
  {
    id: 'never-have-i',
    name: 'Yo Nunca',
    icon: '🚫',
    description: 'Confesiones - Descubre secretos',
    hasTimer: false,
    modes: ['online', 'local']
  },
  {
    id: 'would-you-rather',
    name: 'Qué Prefieres',
    icon: '🤔',
    description: 'Dilema Total - Elecciones imposibles',
    hasTimer: true,
    timerText: '⏱️ 15s',
    modes: ['online', 'local']
  },
  {
    id: 'roulette',
    name: 'Ruleta de Retos',
    icon: '🎡',
    description: 'Giro Fatal - La ruleta decide',
    hasTimer: true,
    timerText: '⏱️ 30s',
    modes: ['online', 'local']
  },
  {
    id: 'spin-bottle',
    name: 'Botella Giratoria',
    icon: '🍾',
    description: 'Punto de Mira - La botella elige',
    hasTimer: true,
    timerText: '⏱️ 30s',
    modes: ['online', 'local']
  },
  {
    id: 'dice',
    name: 'Dado Virtual',
    icon: '🎲',
    description: 'Cara o Caos - El dado manda',
    hasTimer: true,
    timerText: '⏱️ 20s',
    modes: ['online', 'local']
  }
];

let selectedMode = null;
let selectedGame = null;

// Elementos del DOM
const modeButtons = document.querySelectorAll('.mode-btn');
const gameSelector = document.getElementById('game-selector-section');
const gamesGrid = document.getElementById('games-grid');
const selectedGameDisplay = document.getElementById('selected-game-display');
const selectedGameName = document.getElementById('selected-game-name');

const onlineActions = document.getElementById('online-actions');
const localActions = document.getElementById('local-actions');
const soloActions = document.getElementById('solo-actions');

const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const startLocalBtn = document.getElementById('start-local');
const startSoloBtn = document.getElementById('start-solo');
const roomIdInput = document.getElementById('room-id-input');
const roomMessage = document.getElementById('room-message');

// Seleccionar modo de juego
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMode = btn.dataset.mode;
    
    // Actualizar UI
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Mostrar selector de juegos
    gameSelector.style.display = 'block';
    renderGames();
    
    // Ocultar todas las secciones de acción
    onlineActions.classList.remove('active');
    localActions.classList.remove('active');
    soloActions.classList.remove('active');
    
    // Resetear juego seleccionado
    selectedGame = null;
    selectedGameDisplay.classList.remove('active');
  });
});

// Renderizar juegos según modo seleccionado
function renderGames() {
  gamesGrid.innerHTML = '';
  
  const availableGames = GAMES.filter(game => game.modes.includes(selectedMode));
  
  availableGames.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;
    
    card.innerHTML = `
      ${game.hasTimer ? `<div class="timer-badge">${game.timerText}</div>` : ''}
      <div class="icon">${game.icon}</div>
      <h3>${game.name}</h3>
      <p>${game.description}</p>
    `;
    
    card.addEventListener('click', () => selectGame(game, card));
    gamesGrid.appendChild(card);
  });
}

// Seleccionar juego
function selectGame(game, cardElement) {
  selectedGame = game.id;
  
  // Actualizar UI
  document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
  cardElement.classList.add('selected');
  
  selectedGameDisplay.classList.add('active');
  selectedGameName.textContent = game.name;
  
  // Mostrar acciones según modo
  if (selectedMode === 'online') {
    onlineActions.classList.add('active');
  } else if (selectedMode === 'local') {
    localActions.classList.add('active');
  } else if (selectedMode === 'solo') {
    soloActions.classList.add('active');
  }
}

// Generar código de sala
function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Crear sala (modo online)
createRoomBtn?.addEventListener('click', async () => {
  if (!currentUser || !selectedGame) {
    roomMessage.textContent = '⚠️ Selecciona un juego primero';
    return;
  }

  const roomId = generateRoomId();

  await setDoc(doc(db, 'rooms', roomId), {
    createdAt: serverTimestamp(),
    state: 'waiting',
    mode: 'online',
    game: selectedGame,
    turn: 'p1',
    players: {
      p1: {
        uid: currentUser.uid,
        online: true
      }
    },
    gameData: getInitialGameData(selectedGame)
  });

  console.log('🆕 Sala creada:', roomId);
  window.location.href = `room.html?room=${roomId}`;
});

// Unirse a sala (modo online)
joinRoomBtn?.addEventListener('click', async () => {
  if (!currentUser) return;

  const roomId = roomIdInput.value.trim().toUpperCase();
  if (!roomId) {
    roomMessage.textContent = '⚠️ Ingresa un código de sala';
    return;
  }

  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    roomMessage.textContent = '❌ Sala no existe';
    return;
  }

  const room = roomSnap.data();

  // Si ya eres p1
  if (room.players?.p1?.uid === currentUser.uid) {
    window.location.href = `room.html?room=${roomId}`;
    return;
  }

  // Si la sala tiene espacio
  if (!room.players?.p2) {
    await updateDoc(roomRef, {
      'players.p2': {
        uid: currentUser.uid,
        online: true
      },
      state: 'ready'
    });

    console.log('🎮 Unido como p2:', roomId);
    window.location.href = `room.html?room=${roomId}`;
    return;
  }

  roomMessage.textContent = '🚫 Sala llena';
});

// Iniciar juego local
startLocalBtn?.addEventListener('click', () => {
  if (!selectedGame) {
    alert('⚠️ Selecciona un juego primero');
    return;
  }
  
  window.location.href = `local-game.html?game=${selectedGame}`;
});

// Iniciar juego solo
startSoloBtn?.addEventListener('click', () => {
  if (!selectedGame) {
    alert('⚠️ Selecciona un juego primero');
    return;
  }
  
  // Solo algunos juegos permiten modo solo
  const game = GAMES.find(g => g.id === selectedGame);
  if (!game.modes.includes('solo')) {
    alert('⚠️ Este juego no está disponible en modo solo');
    return;
  }
  
  window.location.href = `solo-game.html?game=${selectedGame}`;
});

// Obtener datos iniciales del juego
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
      phase: 'playing',
      currentPlayer: 'p1',
      cards: [],
      flippedCards: [],
      matchedPairs: [],
      scores: { p1: 0, p2: 0 },
      timer: 15,
      timerActive: false
    },
    tictactoe: {
      phase: 'playing',
      currentPlayer: 'p1',
      board: Array(9).fill(null),
      winner: null,
      timer: 20,
      timerActive: false
    },
    'truth-dare': {
      phase: 'choose',
      currentPlayer: 'p1',
      history: [],
      timer: 60
    },
    jenga: {
      phase: 'playing',
      currentPlayer: 'p1',
      tower: [],
      removedBlocks: [],
      fallen: false,
      timer: 30
    },
    quiz: {
      phase: 'question',
      currentQuestion: 0,
      scores: { p1: 0, p2: 0 },
      timer: 15
    },
    'never-have-i': {
      phase: 'statement',
      currentPlayer: 'p1',
      statements: [],
      responses: {}
    },
    'would-you-rather': {
      phase: 'question',
      currentQuestion: 0,
      responses: {},
      timer: 15
    },
    roulette: {
      phase: 'spin',
      currentPlayer: 'p1',
      currentChallenge: null,
      history: [],
      timer: 30
    },
    'spin-bottle': {
      phase: 'spin',
      target: null,
      action: null,
      timer: 30
    },
    dice: {
      phase: 'roll',
      currentPlayer: 'p1',
      lastRoll: null,
      history: [],
      timer: 20
    }
  };

  return initialData[gameId] || {};
}