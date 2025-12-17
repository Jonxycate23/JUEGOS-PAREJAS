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

const secretInput = document.getElementById("secret-word-input");
const setWordBtn = document.getElementById("set-word-btn");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");

const wordDisplay = document.getElementById("word-display");
const mistakesEl = document.getElementById("mistakes");
const msg = document.getElementById("hangman-msg");

const roomRef = doc(db, "rooms", roomId);

onSnapshot(roomRef, snap => {
  if (!snap.exists()) return;

  const room = snap.data();
  if (room.game !== "hangman") return;

  const data = room.gameData.hangman;
  const isSetter = room.players[data.setter].uid === currentUser.uid;
  const isGuesser = room.players[data.guesser].uid === currentUser.uid;

    // Mostrar ingreso de palabra SOLO al setter
    setWordArea.style.display =
      data.phase === "set-word" && isSetter ? "block" : "none";

    // Mostrar zona de juego A AMBOS
    if (data.phase === "guessing") {
      guessArea.style.display = "block";

      // Bloquear input si no es el adivinador
      letterInput.disabled = !isGuesser;
      guessBtn.disabled = !isGuesser;

      msg.textContent = isGuesser
        ? "👉 Te toca adivinar"
        : "👀 Observando a tu pareja jugar";
    }


  wordDisplay.textContent = data.displayWord.split("").join(" ");
  mistakesEl.textContent = data.mistakes;
});

setWordBtn.addEventListener("click", async () => {
  const word = secretInput.value.trim().toLowerCase();
  if (!word) return;

  await updateDoc(roomRef, {
    "gameData.hangman.secretWord": word,
    "gameData.hangman.displayWord": "_".repeat(word.length),
    "gameData.hangman.phase": "guessing"
  });

  secretInput.value = "";
});

guessBtn.addEventListener("click", async () => {
  const letter = letterInput.value.toLowerCase();
  letterInput.value = "";

  if (!letter) return;

  const snap = await getDoc(roomRef);
  const data = snap.data().gameData.hangman;

  if (data.guessedLetters.includes(letter)) return;

  let display = data.displayWord.split("");
  let mistakes = data.mistakes;

  if (data.secretWord.includes(letter)) {
    data.secretWord.split("").forEach((l, i) => {
      if (l === letter) display[i] = letter;
    });
  } else {
    mistakes++;
  }

  await updateDoc(roomRef, {
    "gameData.hangman.displayWord": display.join(""),
    "gameData.hangman.guessedLetters": [...data.guessedLetters, letter],
    "gameData.hangman.mistakes": mistakes
  });
});
