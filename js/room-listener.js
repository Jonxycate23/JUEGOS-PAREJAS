import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const roomCodeEl = document.getElementById("room-code");
const statusEl = document.getElementById("status");

const selector = document.getElementById("game-selector");
const waiting = document.getElementById("waiting-game");
const hangmanArea = document.getElementById("hangman-area");

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

roomCodeEl.textContent = roomId;

const roomRef = doc(db, "rooms", roomId);

onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;

  const room = snap.data();
  console.log("📡 Sala actualizada:", room);

  statusEl.textContent = `Estado: ${room.state}`;

  const isP1 = room.players?.p1?.uid === currentUser.uid;
  const isP2 = room.players?.p2?.uid === currentUser.uid;

  // Si ya hay un juego seleccionado, ir directo a playing
  if (room.game && room.state === "ready") {
    selector.style.display = "none";
    waiting.style.display = "none";
    
    // Cambiar automáticamente a playing
    if (isP1) {
      updateDoc(roomRef, { state: "playing" });
    }
  }
  // Solo mostrar selector si NO hay juego y estado es ready
  else if (room.state === "ready" && !room.game) {
    selector.style.display = isP1 ? "block" : "none";
    waiting.style.display = isP1 ? "none" : "block";
  }

  if (room.state === "playing" && room.game) {
    selector.style.display = "none";
    waiting.style.display = "none";

    if (room.game === "hangman") {
      hangmanArea.style.display = "block";
    }
  }
});