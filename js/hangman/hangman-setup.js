import { db } from "../firebase.js";
import { currentUser } from "../auth.js";

import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  const setupBox = document.getElementById("hangman-setup");
  const wordInput = document.getElementById("setup-word");
  const challengeInput = document.getElementById("setup-challenge");
  const startBtn = document.getElementById("btn-start-hangman");

  if (!setupBox || !startBtn) return;

  const roomId = new URLSearchParams(window.location.search).get("room");
  const roomRef = doc(db, "rooms", roomId);

  startBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim().toLowerCase();
    const challenge = challengeInput.value.trim();

    if (!word || !challenge) {
      alert("⚠️ Escribe palabra y reto");
      return;
    }

    await updateDoc(roomRef, {
      "gameData.word": word,
      "gameData.challenge": challenge,
      state: "playing"
    });

    console.log("🚀 Juego iniciado");
  });

});
