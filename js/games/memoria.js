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

const gameArea = document.getElementById("memoria-area");
const setupArea = document.getElementById("memoria-setup");
const playArea = document.getElementById("memoria-play");
const resultArea = document.getElementById("memoria-result");

const challengeInput = document.getElementById("memoria-challenge");
const startBtn = document.getElementById("memoria-start-btn");
const cardsGrid = document.getElementById("memoria-cards");
const timerEl = document.getElementById("memoria-timer");
const scoreP1El = document.getElementById("score-p1");
const scoreP2El = document.getElementById("score-p2");
const turnMsg = document.getElementById("memoria-turn-msg");
const resultMsg = document.getElementById("memoria-result-msg");
const nextRoundBtn = document.getElementById("memoria-next-round-btn");

const roomRef = doc(db, "rooms", roomId);

// Emojis para las cartas
const CARD_EMOJIS = ['🌟', '💖', '🎮', '🍕', '🐱', '🌹', '⚡', '🍰'];

let timer = null;
let timeLeft = 0;

// Escuchar cambios en la sala
onSnapshot(roomRef, snap => {
  if (!snap.exists()) return;

  const room = snap.data();
  if (room.game !== "memoria") return;

  const data = room.gameData.memoria;
  const isP1 = room.players.p1.uid === currentUser.uid;
  const isP2 = room.players.p2.uid === currentUser.uid;
  const isMyTurn = data.currentPlayer === (isP1 ? "p1" : "p2");

  // Ocultar todo
  setupArea.style.display = "none";
  playArea.style.display = "none";
  resultArea.style.display = "none";

  // FASE: Setup
  if (data.phase === "setup" && isP1) {
    setupArea.style.display = "block";
  }

  // FASE: Playing
  if (data.phase === "playing") {
    playArea.style.display = "block";
    renderCards(data.cards, data.flippedCards, isMyTurn);
    renderScores(data.scores);
    
    turnMsg.textContent = isMyTurn 
      ? "🎯 Es tu turno - Encuentra parejas!" 
      : "⏳ Turno de tu pareja...";

    // Timer
    if (data.timerActive && isMyTurn) {
      startTimer(data.timeLeft);
    } else {
      clearTimer();
      timerEl.textContent = "";
    }
  }

  // FASE: Result
  if (data.phase === "result") {
    resultArea.style.display = "block";
    playArea.style.display = "block";
    renderCards(data.cards, [], false);
    renderScores(data.scores);
    
    const winner = data.scores.p1 > data.scores.p2 ? "p1" : "p2";
    const loser = winner === "p1" ? "p2" : "p1";
    const iWon = winner === (isP1 ? "p1" : "p2");

    resultMsg.innerHTML = `
      <h3>${iWon ? '🎉 ¡Ganaste!' : '💔 Perdiste'}</h3>
      <p>Puntos: Jugador 1: ${data.scores.p1} | Jugador 2: ${data.scores.p2}</p>
      ${!iWon && data.challenge ? `
        <div style="background: #ffe0e0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="font-size: 18px; margin: 0;"><strong>😈 Reto:</strong></p>
          <p style="font-size: 20px; margin: 10px 0 0 0; color: #c0392b;">${data.challenge}</p>
        </div>
      ` : ''}
    `;

    nextRoundBtn.style.display = isP1 ? "block" : "none";
  }
});

// Configurar juego
startBtn.addEventListener("click", async () => {
  const challenge = challengeInput.value.trim();
  
  if (!challenge) {
    alert("⚠️ Escribe un reto para el perdedor");
    return;
  }

  // Crear cartas aleatorias
  const cards = shuffleArray([...CARD_EMOJIS, ...CARD_EMOJIS]).map((emoji, i) => ({
    id: i,
    emoji,
    matched: false
  }));

  await updateDoc(roomRef, {
    "gameData.memoria": {
      phase: "playing",
      cards,
      flippedCards: [],
      currentPlayer: "p1",
      scores: { p1: 0, p2: 0 },
      challenge,
      timerActive: false,
      timeLeft: 15
    }
  });

  challengeInput.value = "";
});

// Renderizar cartas
function renderCards(cards, flippedCards, interactive) {
  cardsGrid.innerHTML = "";
  cardsGrid.style.pointerEvents = interactive ? "auto" : "none";

  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "memoria-card";
    
    const isFlipped = flippedCards.includes(card.id) || card.matched;
    
    if (isFlipped) {
      cardEl.classList.add("flipped");
      cardEl.textContent = card.emoji;
    } else {
      cardEl.textContent = "?";
    }

    if (!card.matched && interactive) {
      cardEl.addEventListener("click", () => flipCard(card.id));
    }

    cardsGrid.appendChild(cardEl);
  });
}

// Voltear carta
async function flipCard(cardId) {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.memoria;

  // Validaciones
  if (data.flippedCards.length >= 2) return;
  if (data.flippedCards.includes(cardId)) return;

  const newFlipped = [...data.flippedCards, cardId];

  // Iniciar timer en la primera carta
  if (newFlipped.length === 1) {
    await updateDoc(roomRef, {
      "gameData.memoria.flippedCards": newFlipped,
      "gameData.memoria.timerActive": true,
      "gameData.memoria.timeLeft": 15
    });
    return;
  }

  // Segunda carta - verificar match
  await updateDoc(roomRef, {
    "gameData.memoria.flippedCards": newFlipped,
    "gameData.memoria.timerActive": false
  });

  setTimeout(async () => {
    await checkMatch();
  }, 1000);
}

// Verificar match
async function checkMatch() {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.memoria;
  const cards = data.cards;
  const flipped = data.flippedCards;

  if (flipped.length !== 2) return;

  const card1 = cards.find(c => c.id === flipped[0]);
  const card2 = cards.find(c => c.id === flipped[1]);

  if (card1.emoji === card2.emoji) {
    // Match! - Dar punto
    card1.matched = true;
    card2.matched = true;

    const scores = { ...data.scores };
    scores[data.currentPlayer] += 1;

    // Verificar si terminó el juego
    const allMatched = cards.every(c => c.matched);
    const newPhase = allMatched ? "result" : "playing";

    await updateDoc(roomRef, {
      "gameData.memoria.cards": cards,
      "gameData.memoria.flippedCards": [],
      "gameData.memoria.scores": scores,
      "gameData.memoria.phase": newPhase
    });
  } else {
    // No match - cambiar turno
    const nextPlayer = data.currentPlayer === "p1" ? "p2" : "p1";

    await updateDoc(roomRef, {
      "gameData.memoria.flippedCards": [],
      "gameData.memoria.currentPlayer": nextPlayer,
      "gameData.memoria.timeLeft": 15
    });
  }
}

// Timer
function startTimer(initialTime) {
  clearTimer();
  timeLeft = initialTime;
  updateTimerDisplay();

  timer = setInterval(async () => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearTimer();
      await handleTimeOut();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerEl.textContent = `⏱️ ${timeLeft}s`;
  if (timeLeft <= 5) {
    timerEl.style.color = "#e74c3c";
  } else {
    timerEl.style.color = "#333";
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function handleTimeOut() {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.memoria;

  // Tiempo agotado - cerrar cartas y cambiar turno
  const nextPlayer = data.currentPlayer === "p1" ? "p2" : "p1";

  await updateDoc(roomRef, {
    "gameData.memoria.flippedCards": [],
    "gameData.memoria.currentPlayer": nextPlayer,
    "gameData.memoria.timerActive": false,
    "gameData.memoria.timeLeft": 15
  });

  alert("⏰ ¡Se acabó el tiempo! Turno perdido.");
}

// Renderizar puntuaciones
function renderScores(scores) {
  scoreP1El.textContent = scores.p1;
  scoreP2El.textContent = scores.p2;
}

// Siguiente ronda
nextRoundBtn.addEventListener("click", async () => {
  await updateDoc(roomRef, {
    "gameData.memoria.phase": "setup"
  });
});

// Utilidades
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}