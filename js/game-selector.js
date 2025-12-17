import { db } from "./firebase.js";

import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

// Selector inicial
document.querySelectorAll("#game-selector button").forEach(btn => {
  btn.addEventListener("click", async () => {
    const game = btn.dataset.game;

    await updateDoc(doc(db, "rooms", roomId), {
      state: "playing",
      game,
      gameData: {
        hangman: {
          phase: "set-word",
          setter: "p1",
          guesser: "p2",
          secretWord: "",
          challenge: "",
          displayWord: "",
          guessedLetters: [],
          mistakes: 0,
          maxMistakes: 6,
          winner: null
        }
      }
    });
  });
});

// Selector del modal (cambio de juego)
document.querySelectorAll("#game-selector-modal button[data-game]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const game = btn.dataset.game;

    // Cerrar modal
    document.getElementById("game-selector-modal").classList.remove("active");

    // Resetear el juego seleccionado
    await updateDoc(doc(db, "rooms", roomId), {
      state: "playing",
      game,
      gameData: {
        hangman: {
          phase: "set-word",
          setter: "p1",
          guesser: "p2",
          secretWord: "",
          challenge: "",
          displayWord: "",
          guessedLetters: [],
          mistakes: 0,
          maxMistakes: 6,
          winner: null
        }
      }
    });

    console.log("🎮 Juego cambiado a:", game);
  });
});