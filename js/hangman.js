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

const setWordArea = document.getElementById("set-word-area");
const guessArea = document.getElementById("guess-area");
const resultArea = document.getElementById("result-area");

const secretInput = document.getElementById("secret-word-input");
const challengeInput = document.getElementById("challenge-input");
const setWordBtn = document.getElementById("set-word-btn");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");
const nextRoundBtn = document.getElementById("next-round-btn");

const wordDisplay = document.getElementById("word-display");
const mistakesEl = document.getElementById("mistakes");
const guessedLettersEl = document.getElementById("guessed-letters");
const msg = document.getElementById("hangman-msg");
const resultMsg = document.getElementById("result-msg");
const hangmanDrawing = document.getElementById("hangman-drawing");

const roomRef = doc(db, "rooms", roomId);

// Dibujar el muñeco del ahorcado
function drawHangman(mistakes) {
  const parts = [
    '<div class="rope"></div>',
    '<div class="head"></div>',
    '<div class="body"></div>',
    '<div class="arm left"></div>',
    '<div class="arm right"></div>',
    '<div class="leg left"></div>',
    '<div class="leg right"></div>'
  ];
  
  // Siempre mostrar la cuerda (parte 0), luego agregar partes según errores
  let html = parts[0]; // La cuerda
  for (let i = 1; i <= mistakes && i < parts.length; i++) {
    html += parts[i];
  }
  
  hangmanDrawing.innerHTML = html;
}

// Escuchar cambios en la sala
onSnapshot(roomRef, snap => {
  if (!snap.exists()) return;

  const room = snap.data();
  if (room.game !== "hangman") return;

  const data = room.gameData.hangman;
  const isSetter = room.players[data.setter].uid === currentUser.uid;
  const isGuesser = room.players[data.guesser].uid === currentUser.uid;

  // Ocultar todo primero
  setWordArea.style.display = "none";
  guessArea.style.display = "none";
  resultArea.style.display = "none";

  // FASE: Establecer palabra
  if (data.phase === "set-word" && isSetter) {
    setWordArea.style.display = "block";
    msg.textContent = "👉 Escribe una palabra y un reto para tu pareja";
  }

  // FASE: Adivinando
  if (data.phase === "guessing") {
    guessArea.style.display = "block";
    
    // Actualizar display
    wordDisplay.textContent = data.displayWord.split("").join(" ");
    mistakesEl.textContent = data.mistakes;
    guessedLettersEl.textContent = data.guessedLetters.join(", ").toUpperCase();
    
    // Dibujar muñeco
    drawHangman(data.mistakes);
    
    // Controles según rol
    letterInput.disabled = !isGuesser;
    guessBtn.disabled = !isGuesser;
    
    if (isGuesser) {
      msg.textContent = "👉 Adivina la palabra letra por letra";
    } else {
      msg.textContent = "👀 Tu pareja está adivinando...";
    }
  }

  // FASE: Resultado
  if (data.phase === "result") {
    resultArea.style.display = "block";
    guessArea.style.display = "block";
    
    // DESHABILITAR INPUTS - El juego terminó
    letterInput.disabled = true;
    guessBtn.disabled = true;
    
    // Actualizar display final
    wordDisplay.textContent = data.secretWord.split("").join(" ");
    mistakesEl.textContent = data.mistakes;
    drawHangman(data.mistakes);
    
    // Mensaje de resultado
    if (data.winner === "guesser") {
      resultMsg.innerHTML = `
        <h3>🎉 ¡Ganaste!</h3>
        <p>La palabra era: <strong>${data.secretWord.toUpperCase()}</strong></p>
        ${isGuesser ? "<p>¡Felicidades, adivinaste la palabra! 🎊</p>" : "<p>Tu pareja adivinó la palabra 😊</p>"}
      `;
    } else {
      resultMsg.innerHTML = `
        <h3>💔 Perdiste</h3>
        <p>La palabra era: <strong>${data.secretWord.toUpperCase()}</strong></p>
        <div style="background: #ffe0e0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="font-size: 18px; margin: 0;"><strong>😈 Reto:</strong></p>
          <p style="font-size: 20px; margin: 10px 0 0 0; color: #c0392b;">${data.challenge}</p>
        </div>
        ${isGuesser ? "<p>Debes cumplir el reto 😅</p>" : "<p>Tu pareja debe cumplir el reto 😏</p>"}
      `;
    }
    
    // Mostrar botón solo a uno de los jugadores
    nextRoundBtn.style.display = isSetter ? "block" : "none";
    
    msg.textContent = isSetter 
      ? "👉 Presiona el botón cuando estén listos para la siguiente ronda"
      : "⏳ Esperando a que tu pareja inicie la siguiente ronda...";
  }
});

// Establecer palabra y reto
setWordBtn.addEventListener("click", async () => {
  const word = secretInput.value.trim().toLowerCase();
  const challenge = challengeInput.value.trim();
  
  if (!word || !challenge) {
    alert("⚠️ Debes escribir tanto la palabra como el reto");
    return;
  }

  if (word.length < 3) {
    alert("⚠️ La palabra debe tener al menos 3 letras");
    return;
  }

  // Validar que solo contenga letras
  if (!/^[a-záéíóúñ]+$/i.test(word)) {
    alert("⚠️ La palabra solo debe contener letras");
    return;
  }

  await updateDoc(roomRef, {
    "gameData.hangman.secretWord": word,
    "gameData.hangman.challenge": challenge,
    "gameData.hangman.displayWord": "_".repeat(word.length),
    "gameData.hangman.phase": "guessing"
  });

  secretInput.value = "";
  challengeInput.value = "";
});

// Adivinar letra
guessBtn.addEventListener("click", async () => {
  await guessLetter();
});

letterInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    guessLetter();
  }
});

async function guessLetter() {
  const letter = letterInput.value.trim().toLowerCase();
  letterInput.value = "";

  if (!letter) return;

  // Validar que sea una sola letra
  if (letter.length !== 1 || !/^[a-záéíóúñ]$/i.test(letter)) {
    alert("⚠️ Ingresa solo una letra");
    return;
  }

  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.hangman;

  // Verificar si ya fue usada
  if (data.guessedLetters.includes(letter)) {
    alert("⚠️ Ya usaste esa letra");
    return;
  }

  let display = data.displayWord.split("");
  let mistakes = data.mistakes;
  let found = false;

  // Verificar si la letra está en la palabra
  data.secretWord.split("").forEach((l, i) => {
    if (l === letter) {
      display[i] = letter;
      found = true;
    }
  });

  if (!found) {
    mistakes++;
  }

  const newDisplay = display.join("");
  const newGuessed = [...data.guessedLetters, letter];

  // Verificar victoria o derrota
  let newPhase = "guessing";
  let winner = null;

  if (newDisplay === data.secretWord) {
    newPhase = "result";
    winner = "guesser";
  } else if (mistakes >= 6) {
    newPhase = "result";
    winner = "setter";
  }

  await updateDoc(roomRef, {
    "gameData.hangman.displayWord": newDisplay,
    "gameData.hangman.guessedLetters": newGuessed,
    "gameData.hangman.mistakes": mistakes,
    "gameData.hangman.phase": newPhase,
    "gameData.hangman.winner": winner
  });
}

// Siguiente ronda (intercambiar roles)
nextRoundBtn.addEventListener("click", async () => {
  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.hangman;

  // Intercambiar roles
  const newSetter = data.guesser;
  const newGuesser = data.setter;

  await updateDoc(roomRef, {
    "gameData.hangman": {
      phase: "set-word",
      setter: newSetter,
      guesser: newGuesser,
      secretWord: "",
      challenge: "",
      displayWord: "",
      guessedLetters: [],
      mistakes: 0,
      maxMistakes: 6,
      winner: null
    }
  });
});