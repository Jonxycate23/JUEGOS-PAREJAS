import { db } from "../firebase.js";
import { currentUser } from "../auth.js";
import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const roomRef = doc(db, "rooms", roomId);

// Emojis para las cartas
const CARD_EMOJIS = ['💕', '💖', '💗', '💓', '💞', '💝', '❤️', '💘', '🌹', '🥀', '💐', '🌺'];

let timerInterval = null;

onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;

  const room = snap.data();
  if (room.game !== 'memory') return;

  const data = room.gameData;
  const isMyTurn = room.players[data.currentPlayer]?.uid === currentUser.uid;

  renderGame(data, isMyTurn);

  // Manejar timer
  if (data.timerActive && isMyTurn) {
    startTimer(data.timer);
  } else {
    stopTimer();
  }
});

function renderGame(data, isMyTurn) {
  const area = document.getElementById('memory-area');
  
  area.innerHTML = `
    <h2>🧠 Memoria - Recuerdos Cruzados</h2>
    
    <div class="memory-header">
      <div class="scores">
        <div class="score-p1">Jugador 1: ${data.scores.p1}</div>
        <div class="score-p2">Jugador 2: ${data.scores.p2}</div>
      </div>
      
      <div class="timer-display ${data.timerActive ? 'active' : ''}">
        ⏱️ <span id="timer-value">${data.timer}</span>s
      </div>
      
      <div class="turn-indicator">
        ${isMyTurn ? '👉 Tu turno' : '⏳ Esperando...'}
      </div>
    </div>

    <div class="memory-grid" id="memory-grid">
      ${renderCards(data.cards, data.flippedCards, data.matchedPairs, isMyTurn)}
    </div>

    <div id="result-message"></div>
  `;

  // Event listeners para las cartas
  if (isMyTurn) {
    document.querySelectorAll('.memory-card:not(.matched)').forEach(card => {
      card.addEventListener('click', () => flipCard(parseInt(card.dataset.index)));
    });
  }
}

function renderCards(cards, flipped, matched, isMyTurn) {
  if (!cards || cards.length === 0) {
    // Inicializar cartas
    initializeCards();
    return '';
  }

  return cards.map((emoji, index) => {
    const isFlipped = flipped.includes(index);
    const isMatched = matched.includes(index);
    const canClick = isMyTurn && !isFlipped && !isMatched && flipped.length < 2;

    return `
      <div class="memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${canClick ? 'clickable' : ''}" 
           data-index="${index}">
        <div class="card-inner">
          <div class="card-front">?</div>
          <div class="card-back">${emoji}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function initializeCards() {
  // Crear pares de cartas
  const pairs = CARD_EMOJIS.slice(0, 8); // 8 pares = 16 cartas
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

  await updateDoc(roomRef, {
    'gameData.cards': cards,
    'gameData.flippedCards': [],
    'gameData.matchedPairs': []
  });
}

async function flipCard(index) {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData;

  if (data.flippedCards.length >= 2) return;
  if (data.flippedCards.includes(index)) return;

  const newFlipped = [...data.flippedCards, index];

  await updateDoc(roomRef, {
    'gameData.flippedCards': newFlipped,
    'gameData.timerActive': true
  });

  // Si volteó 2 cartas, verificar match
  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 1000);
  }
}

async function checkMatch(flipped, data) {
  const [index1, index2] = flipped;
  const card1 = data.cards[index1];
  const card2 = data.cards[index2];

  if (card1 === card2) {
    // Match!
    const newMatched = [...data.matchedPairs, index1, index2];
    const currentPlayer = data.currentPlayer;
    const newScores = { ...data.scores };
    newScores[currentPlayer]++;

    // Verificar si ganó
    if (newMatched.length === data.cards.length) {
      const winner = newScores.p1 > newScores.p2 ? 'p1' : 'p2';
      await updateDoc(roomRef, {
        'gameData.matchedPairs': newMatched,
        'gameData.flippedCards': [],
        'gameData.scores': newScores,
        'gameData.timerActive': false,
        'gameData.phase': 'finished',
        'gameData.winner': winner
      });
      showResult(winner);
    } else {
      await updateDoc(roomRef, {
        'gameData.matchedPairs': newMatched,
        'gameData.flippedCards': [],
        'gameData.scores': newScores,
        'gameData.timerActive': false
      });
    }
  } else {
    // No match, cambiar turno
    const nextPlayer = data.currentPlayer === 'p1' ? 'p2' : 'p1';
    await updateDoc(roomRef, {
      'gameData.flippedCards': [],
      'gameData.currentPlayer': nextPlayer,
      'gameData.timerActive': false,
      'gameData.timer': 15
    });
  }
}

function startTimer(initialTime) {
  stopTimer();
  let timeLeft = initialTime;
  
  timerInterval = setInterval(async () => {
    timeLeft--;
    document.getElementById('timer-value').textContent = timeLeft;

    if (timeLeft <= 0) {
      stopTimer();
      // Tiempo agotado, perder turno
      const snap = await getDoc(roomRef);
      const data = snap.data().gameData;
      const nextPlayer = data.currentPlayer === 'p1' ? 'p2' : 'p1';
      
      await updateDoc(roomRef, {
        'gameData.flippedCards': [],
        'gameData.currentPlayer': nextPlayer,
        'gameData.timerActive': false,
        'gameData.timer': 15
      });
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function showResult(winner) {
  const msg = document.getElementById('result-message');
  msg.innerHTML = `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin-top: 20px;">
      <h3>🎉 ¡Juego Terminado!</h3>
      <p>Ganador: ${winner === 'p1' ? 'Jugador 1' : 'Jugador 2'}</p>
      <button onclick="location.reload()">Jugar de Nuevo</button>
    </div>
  `;
}

// Agregar estilos
const style = document.createElement('style');
style.textContent = `
  #memory-area {
    max-width: 700px;
    margin: 0 auto;
  }

  .memory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    flex-wrap: wrap;
    gap: 15px;
  }

  .scores {
    display: flex;
    gap: 20px;
    font-size: 18px;
    font-weight: bold;
  }

  .timer-display {
    font-size: 24px;
    padding: 10px 20px;
    background: #f0f0f0;
    border-radius: 10px;
  }

  .timer-display.active {
    background: #ffe0e0;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .turn-indicator {
    font-size: 18px;
    font-weight: bold;
    color: #667eea;
  }

  .memory-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin: 20px 0;
  }

  .memory-card {
    aspect-ratio: 1;
    perspective: 1000px;
    cursor: not-allowed;
  }

  .memory-card.clickable {
    cursor: pointer;
  }

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }

  .memory-card.flipped .card-inner {
    transform: rotateY(180deg);
  }

  .card-front, .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .card-front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .card-back {
    background: white;
    transform: rotateY(180deg);
  }

  .memory-card.matched .card-inner {
    transform: rotateY(180deg);
  }

  .memory-card.matched .card-back {
    background: #d4edda;
  }

  @media (max-width: 600px) {
    .memory-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`;
document.head.appendChild(style);