import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==============================
   GENERAR CÓDIGO DE SALA
================================ */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/* ==============================
   ELEMENTOS HTML
================================ */
const createRoomBtn = document.getElementById("create-room");
const joinRoomBtn = document.getElementById("join-room");

const roomIdInput = document.getElementById("room-id-input");
const roomJoinedText = document.getElementById("room-joined");

/* ==============================
   CREAR SALA (PC1)
================================ */
createRoomBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  const roomId = generateRoomId();

  await setDoc(doc(db, "rooms", roomId), {
    createdAt: serverTimestamp(),
    state: "waiting",
    turn: "p1",
    withChallenges: false,
    players: {
      p1: {
        uid: currentUser.uid,
        online: true
      }
    },
    challenges: {
      p1: null,
      p2: null
    },
    game: null,
    gameData: {},
    messages: [] // Campo para el chat
  });

  console.log("🆕 Sala creada:", roomId);

  // 👉 ENTRAR A LA SALA
  window.location.href = `room.html?room=${roomId}`;
});

/* ==============================
   UNIRSE A SALA (PC2)
================================ */
joinRoomBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  const roomId = roomIdInput.value.trim().toUpperCase();
  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    roomJoinedText.textContent = "❌ Sala no existe";
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
      "players.p2": {
        uid: currentUser.uid,
        online: true
      },
      state: "ready"
    });

    console.log("🎮 Unido como p2:", roomId);

    // 👉 ENTRAR A LA SALA
    window.location.href = `room.html?room=${roomId}`;
    return;
  }

  // Sala llena
  roomJoinedText.textContent = "🚫 Sala llena";
});