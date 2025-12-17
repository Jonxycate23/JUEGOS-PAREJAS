import { db } from "./firebase.js";

import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

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
          displayWord: "",
          guessedLetters: [],
          mistakes: 0,
          maxMistakes: 6
        }
      }
    });
  });
});
