import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

const tictactoeArea = document.getElementById("tictactoe-area");
const configArea = document.getElementById("tictactoe-config-area");
const gameArea = document.getElementById("tictactoe-game-area");
const resultArea = document.getElementById("tictactoe-result-area");

const challengeToggle = document.getElementById("tictactoe-challenge-toggle");
const challengeOptions = document.getElementById("tictactoe-challenge-options");
const levelButtons = document.querySelectorAll(".tictactoe-level-btn");
const startBtn = document.getElementById("tictactoe-start-btn");

const p1NameEl = document.getElementById("tictactoe-p1-name");
const p2NameEl = document.getElementById("tictactoe-p2-name");
const p1InfoEl = document.getElementById("tictactoe-p1-info");
const p2InfoEl = document.getElementById("tictactoe-p2-info");
const turnIndicatorEl = document.getElementById("tictactoe-turn-indicator");

const boardCells = document.querySelectorAll(".tictactoe-cell");
const resultIconEl = document.getElementById("tictactoe-result-icon");
const resultTitleEl = document.getElementById("tictactoe-result-title");
const resultMessageEl = document.getElementById("tictactoe-result-message");
const challengeBoxEl = document.getElementById("tictactoe-challenge-box");
const challengeTextEl = document.getElementById("tictactoe-challenge-text");

const nextRoundBtn = document.getElementById("tictactoe-next-round-btn");
const backToConfigBtn = document.getElementById("tictactoe-back-to-config-btn");

const roomRef = doc(db, "rooms", roomId);

// ==================== RETOS ====================

const CHALLENGES = {
  soft: [
    // Retos románticos
    "Canta una canción romántica",
    "Di 3 cosas que amas de tu pareja",
    "Escribe un poema corto para tu pareja",
    "Di 5 cumplidos sinceros",
    "Cuenta cómo conociste a tu pareja",
    "Di qué fue lo que más te atrajo de tu pareja",
    "Describe tu cita perfecta",
    "Haz un dibujo de tu pareja",
    
    // Retos graciosos
    "Haz 10 sentadillas",
    "Cuenta un chiste",
    "Baila durante 30 segundos",
    "Imita a tu pareja",
    "Haz una pose graciosa para foto",
    "Cuenta un secreto vergonzoso",
    "Imita a un animal",
    "Haz tu mejor cara graciosa",
    "Habla como personaje de caricatura 1 min",
    "Intenta no reír 30 segundos mientras tu pareja te hace reír",
    
    // Retos de servicio
    "Prepara un snack para tu pareja",
    "Dale un vaso de agua",
    "Háblale como si fuera realeza",
    "Sirve como mayordomo por 3 minutos",
    "Prepara un postre sencillo",
    
    // Retos tiernos
    "Abrazo de 30 segundos",
    "Tómense una selfie juntos",
    "Dile 'te amo' en 3 idiomas diferentes",
    "Haz un gesto romántico improvisado",
    "Comparte tu recuerdo favorito juntos"
  ],
  
  medium: [
    // Retos físicos suaves
    "Dale un masaje de 2 minutos",
    "Masaje de pies de 1 minuto",
    "Masaje de manos con crema",
    "Peina el cabello de tu pareja",
    
    // Retos picantes suaves
    "Quítate una prenda de ropa",
    "Beso apasionado por 10 segundos",
    "Susurra algo picante al oído",
    "3 besos donde tu pareja elija",
    "Beso en el cuello (5 segundos)",
    "Mordida suave en el lóbulo de la oreja",
    
    // Retos de baile
    "Baile sensual para tu pareja",
    "Baila pegados una canción completa",
    "Baile de cadera por 20 segundos",
    
    // Retos de confesiones
    "Haz una confesión atrevida",
    "Di tu fantasía más secreta (suave)",
    "Cuenta algo que nunca has dicho",
    "Di qué parte del cuerpo de tu pareja te gusta más",
    
    // Retos de contacto
    "Deja que tu pareja te dé 5 nalgadas suaves",
    "Abrazo sensual de 20 segundos",
    "Siéntate en el regazo de tu pareja 1 minuto",
    "Juego de manos por 30 segundos",
    
    // Retos dulces
    "Lame algo dulce del cuerpo de tu pareja",
    "Come algo de la boca de tu pareja",
    "Alimenta a tu pareja con los ojos cerrados",
    
    // Retos diversos
    "Haz un strip tease corto (20 seg)",
    "10 flexiones mientras tu pareja te observa",
    "Tu pareja te maquilla/peina como quiera",
    "Deja que tu pareja elija tu próxima prenda"
  ],
  
  spicy: [
    // Retos de desnudez
    "Quítate 2 prendas",
    "Tu pareja te quita una prenda",
    "Quítate la camisa/blusa",
    "Juega 2 rondas sin una prenda de arriba",
    "Tu pareja desabrocha algo de tu ropa",
    
    // Besos intensos
    "Beso francés intenso por 30 segundos",
    "10 besos en diferentes partes del cuerpo",
    "Beso en cualquier parte del cuerpo (tu pareja elige)",
    "Marca un 'chupetón' donde tu pareja elija",
    "Besa el abdomen de tu pareja",
    "Secuencia de besos: cuello, hombro, pecho",
    
    // Masajes sensuales
    "Masaje sensual en una zona que elija tu pareja (2 min)",
    "Masaje con aceite en espalda (3 min)",
    "Masaje sensual en muslos",
    "Masaje en zona íntima externa (sobre ropa)",
    
    // Juegos atrevidos
    "Juego de manos atrevido por 1 minuto",
    "Tu pareja te hace cosquillas donde quiera por 30 seg",
    "Deja que tu pareja te vende los ojos y te bese donde quiera",
    "Juego de hielo por el cuerpo (30 seg)",
    "Tu pareja pasa un cubito de hielo por donde quiera",
    "Lame algo dulce de una zona que elija tu pareja",
    
    // Bailes hot
    "Baile erótico solo para tu pareja (1 min)",
    "Lap dance de 1 minuto",
    "Striptease de 1 minuto",
    "Baila reggaeton pegados",
    
    // Contacto íntimo
    "Abrazo sin ropa por 30 segundos",
    "Acuéstense juntos y abrácense 1 minuto",
    "Tu pareja se sienta sobre ti 1 minuto",
    "Posición de cucharita por 1 minuto",
    
    // Confesiones hot
    "Cuenta tu fantasía más HOT",
    "Di qué te gustaría que te hicieran ahora",
    "Describe tu sueño erótico más reciente",
    "Di 3 posiciones que quieras probar",
    
    // Retos de control
    "Haz lo que tu pareja te pida (dentro del respeto)",
    "Tu pareja controla tus movimientos por 1 minuto",
    "Obedece 3 órdenes de tu pareja",
    "Dramatiza una escena romántica de película"
  ],
  
  funny: [
    // Retos super graciosos
    "Habla con acento extraño por 2 minutos",
    "Actúa como si fueras de otra época",
    "Imita a 3 personas famosas",
    "Cuenta el chiste más malo que sepas",
    "Haz tu mejor imitación de tu pareja enojada",
    "Canta una canción operática inventada",
    "Baila como robot por 30 segundos",
    "Haz 10 sentadillas cantando",
    "Habla solo con rimas por 1 minuto",
    "Actúa una escena dramática exagerada",
    "Imita a un bebé por 1 minuto",
    "Haz tu peor baile posible",
    "Cuenta una anécdota vergonzosa",
    "Ríe sin parar por 20 segundos",
    "Actúa como si fueras un superhéroe",
    "Imita 5 emociones exageradas",
    "Haz el sonido de 5 animales diferentes",
    "Intenta tocar tu nariz con la lengua",
    "Haz una cara rara y toma foto",
    "Baila como estrella de rock"
  ],
  
  ardiente: [
    // Los retos MÁS hot
    "Quítate toda la ropa de arriba",
    "Sesión de besos en zona íntima (sobre ropa)",
    "Tu pareja te desnuda lentamente",
    "5 minutos de caricias donde tu pareja decida",
    "Masaje completo con besos incluidos",
    "Juego de lengua en el cuello",
    "Tu pareja explora tu cuerpo 2 minutos",
    "Simulen una escena de película +18",
    "Beso francés mientras se tocan",
    "Tu pareja te provoca como quiera 1 minuto",
    "Posición comprometedora por 30 segundos",
    "Recrear su mejor momento íntimo (simulado)",
    "Susúrrense al oído sus deseos más profundos",
    "Tu pareja marca territorio con besos",
    "Baño de besos por todo el cuerpo",
    "Juego de roles: elige un escenario",
    "Caricias prohibidas (2 minutos)",
    "Tu pareja te hace lo que ella/él quiera por 1 min",
    "Masaje que termine en besos",
    "Quitarse la ropa mutuamente"
  ]
};

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
  [0, 4, 8], [2, 4, 6]             // Diagonales
];

// ==================== LISTENERS ====================

// Toggle de retos
if (challengeToggle) {
  challengeToggle.addEventListener('click', () => {
    challengeToggle.classList.toggle('active');
    const isActive = challengeToggle.classList.contains('active');
    
    if (challengeOptions) {
      challengeOptions.style.display = isActive ? 'block' : 'none';
    }
  });
}

// Botones de tipo de reto (Sistema vs Personalizado)
const challengeTypeButtons = document.querySelectorAll('.tictactoe-challenge-type-btn');
const systemLevelsDiv = document.getElementById('tictactoe-system-levels');
const customChallengesDiv = document.getElementById('tictactoe-custom-challenges');

challengeTypeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    challengeTypeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    const type = btn.dataset.type;
    if (type === 'system') {
      systemLevelsDiv.style.display = 'block';
      customChallengesDiv.style.display = 'none';
    } else {
      systemLevelsDiv.style.display = 'none';
      customChallengesDiv.style.display = 'block';
    }
  });
});

// Botones de nivel
levelButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    levelButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// Botón de inicio
if (startBtn) {
  startBtn.addEventListener('click', startGame);
}

// Botones de control
if (nextRoundBtn) {
  nextRoundBtn.addEventListener('click', resetGame);
}

if (backToConfigBtn) {
  backToConfigBtn.addEventListener('click', backToConfig);
}

// Escuchar cambios en la sala
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;

  const room = snap.data();
  if (room.game !== "tictactoe") return;

  const data = room.gameData.tictactoe;
  const isP1 = room.players.p1.uid === currentUser.uid;
  const isP2 = room.players.p2.uid === currentUser.uid;
  const isMyTurn = data.currentPlayer === (isP1 ? "p1" : "p2");

  // Nombres de jugadores
  if (p1NameEl) p1NameEl.textContent = room.players.p1.name;
  if (p2NameEl) p2NameEl.textContent = room.players.p2.name;

  // Mostrar/ocultar secciones
  if (configArea) configArea.style.display = "none";
  if (gameArea) gameArea.style.display = "none";
  if (resultArea) resultArea.style.display = "none";

  // FASE: Configuración (solo al inicio, antes de empezar)
  if (data.phase === "config" && isP1) {
    if (configArea) configArea.style.display = "block";
    return;
  }

  // Si está en fase playing pero P1 nunca configuró, mostrar config
  if (data.phase === "playing" && !data.configured && isP1) {
    if (configArea) configArea.style.display = "block";
    return;
  }

  // FASE: Jugando
  if (data.phase === "playing" && data.configured) {
    if (gameArea) gameArea.style.display = "block";
    renderBoard(data.board, data.winner);
    updateTurnIndicator(data.currentPlayer, room.players, isMyTurn);
    updatePlayerInfo(data.currentPlayer);
    
    // Habilitar/deshabilitar clicks
    boardCells.forEach((cell, index) => {
      cell.onclick = () => {
        if (isMyTurn) {
          makeMove(index);
        }
      };
    });
  }

  // FASE: Resultado
  if (data.phase === "result") {
    if (gameArea) gameArea.style.display = "block";
    if (resultArea) resultArea.style.display = "block";
    
    renderBoard(data.board, data.winner);
    showResult(data, room.players, isP1);
    
    // Deshabilitar clicks
    boardCells.forEach(cell => {
      cell.onclick = null;
    });

    // Mostrar botones solo a P1
    if (nextRoundBtn) nextRoundBtn.style.display = isP1 ? "block" : "none";
    if (backToConfigBtn) backToConfigBtn.style.display = isP1 ? "block" : "none";
  }
});

// ==================== FUNCIONES ====================

async function startGame() {
  const withChallenges = challengeToggle?.classList.contains('active') || false;
  
  let challengeLevel = 'medium';
  let customChallenges = [];
  
  // Determinar si es sistema o personalizado
  const selectedTypeBtn = document.querySelector('.tictactoe-challenge-type-btn.selected');
  const challengeType = selectedTypeBtn?.dataset.type || 'system';
  
  if (challengeType === 'system') {
    // Retos del sistema
    const selectedLevelBtn = document.querySelector('.tictactoe-level-btn.selected');
    challengeLevel = selectedLevelBtn?.dataset.level || 'medium';
  } else {
    // Retos personalizados
    const customInput = document.getElementById('tictactoe-custom-input');
    const customText = customInput?.value.trim() || '';
    
    if (withChallenges && customText) {
      // Separar por líneas y filtrar vacías
      customChallenges = customText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (customChallenges.length === 0) {
        alert('⚠️ Debes escribir al menos un reto personalizado');
        return;
      }
    } else if (withChallenges && !customText) {
      alert('⚠️ Debes escribir tus retos personalizados o elegir retos del sistema');
      return;
    }
  }

  await updateDoc(roomRef, {
    "gameData.tictactoe": {
      phase: "playing",
      currentPlayer: "p1",
      board: Array(9).fill(null),
      winner: null,
      winningCells: [],
      withChallenges,
      challengeLevel,
      customChallenges,
      challengeType,
      configured: true
    }
  });
}

async function makeMove(index) {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.tictactoe;
  
  // Validar movimiento
  if (data.board[index] !== null) return;

  const board = [...data.board];
  board[index] = data.currentPlayer === "p1" ? "X" : "O";

  // Verificar ganador
  const winResult = checkWinner(board);
  
  if (winResult.winner) {
    // Hay ganador
    await updateDoc(roomRef, {
      "gameData.tictactoe.board": board,
      "gameData.tictactoe.winner": winResult.winner,
      "gameData.tictactoe.winningCells": winResult.cells,
      "gameData.tictactoe.phase": "result"
    });
  } else if (board.every(cell => cell !== null)) {
    // Empate
    await updateDoc(roomRef, {
      "gameData.tictactoe.board": board,
      "gameData.tictactoe.winner": "draw",
      "gameData.tictactoe.phase": "result"
    });
  } else {
    // Siguiente turno
    const nextPlayer = data.currentPlayer === "p1" ? "p2" : "p1";
    await updateDoc(roomRef, {
      "gameData.tictactoe.board": board,
      "gameData.tictactoe.currentPlayer": nextPlayer
    });
  }
}

function checkWinner(board) {
  for (let combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] === "X" ? "p1" : "p2",
        cells: combination
      };
    }
  }
  return { winner: null, cells: [] };
}

function renderBoard(board, winner) {
  boardCells.forEach((cell, index) => {
    cell.textContent = board[index] || "";
    cell.classList.remove('taken', 'winning');
    
    if (board[index]) {
      cell.classList.add('taken');
    }
  });
}

function updateTurnIndicator(currentPlayer, players, isMyTurn) {
  const playerName = players[currentPlayer].name;
  const symbol = currentPlayer === "p1" ? "❌" : "⭕";
  
  if (turnIndicatorEl) {
    turnIndicatorEl.textContent = isMyTurn 
      ? `🎯 Tu turno (${symbol})` 
      : `⏳ Turno de ${playerName} (${symbol})`;
  }
}

function updatePlayerInfo(currentPlayer) {
  if (p1InfoEl && p2InfoEl) {
    p1InfoEl.classList.toggle('active', currentPlayer === 'p1');
    p2InfoEl.classList.toggle('active', currentPlayer === 'p2');
  }
}

async function showResult(data, players, isP1) {
  const { winner, winningCells, withChallenges, challengeLevel, customChallenges } = data;

  // Resaltar celdas ganadoras
  if (winningCells && winningCells.length > 0) {
    winningCells.forEach(index => {
      boardCells[index].classList.add('winning');
    });
  }

  if (winner === "draw") {
    // Empate
    if (resultIconEl) resultIconEl.textContent = "🤝";
    if (resultTitleEl) resultTitleEl.textContent = "¡Empate!";
    if (resultMessageEl) resultMessageEl.textContent = "Ambos son ganadores";
    if (challengeBoxEl) challengeBoxEl.style.display = "none";
  } else {
    // Alguien ganó
    const winnerName = players[winner].name;
    const loserPlayer = winner === "p1" ? "p2" : "p1";
    const loserName = players[loserPlayer].name;
    const iWon = winner === (isP1 ? "p1" : "p2");

    if (resultIconEl) resultIconEl.textContent = iWon ? "🎉" : "💔";
    if (resultTitleEl) resultTitleEl.textContent = iWon ? "¡Ganaste!" : "Perdiste";
    if (resultMessageEl) resultMessageEl.textContent = `${winnerName} gana esta ronda`;

    // SOLO mostrar reto si withChallenges es true Y el usuario perdió
    if (withChallenges && !iWon && challengeBoxEl && challengeTextEl) {
      let challenge;
      
      // Si hay retos personalizados, usar esos
      if (customChallenges && customChallenges.length > 0) {
        challenge = customChallenges[Math.floor(Math.random() * customChallenges.length)];
      } else {
        // Si no, usar retos del sistema según el nivel
        challenge = getRandomChallenge(challengeLevel);
      }
      
      challengeBoxEl.style.display = "block";
      challengeTextEl.innerHTML = `
        <strong>${loserName}</strong>, tu reto es:<br><br>
        ${challenge}
      `;
    } else if (challengeBoxEl) {
      challengeBoxEl.style.display = "none";
    }
  }
}

function getRandomChallenge(level) {
  const challenges = CHALLENGES[level] || CHALLENGES.soft;
  return challenges[Math.floor(Math.random() * challenges.length)];
}

async function resetGame() {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.tictactoe;
  
  await updateDoc(roomRef, {
    "gameData.tictactoe": {
      phase: "playing",
      currentPlayer: "p1",
      board: Array(9).fill(null),
      winner: null,
      winningCells: [],
      withChallenges: data.withChallenges,
      challengeLevel: data.challengeLevel,
      customChallenges: data.customChallenges || [],
      challengeType: data.challengeType || 'system',
      configured: true
    }
  });
}

async function backToConfig() {
  await updateDoc(roomRef, {
    "gameData.tictactoe.phase": "config",
    "gameData.tictactoe.configured": false,
    "gameData.tictactoe.board": Array(9).fill(null),
    "gameData.tictactoe.winner": null,
    "gameData.tictactoe.currentPlayer": "p1"
  });
}

console.log("🎮 Totito - Tres en Caos cargado");