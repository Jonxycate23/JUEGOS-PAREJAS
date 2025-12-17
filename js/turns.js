import { db } from "./firebase.js";
import { currentUser } from "./auth.js";

import {
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const roomRef = doc(db, "rooms", roomId);

/* ==============================
   ESCUCHAR TURNOS
================================ */
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;

  const room = snap.data();
  const turn = room.turn;

  const myRole =
    room.players.p1.uid === currentUser.uid ? "p1" : "p2";

  if (turn === myRole) {
    console.log("✅ Es tu turno");
  } else {
    console.log("⏳ Esperando turno...");
  }
});

/* ==============================
   CAMBIAR TURNO
================================ */
export async function nextTurn(current) {
  const next = current === "p1" ? "p2" : "p1";

  await updateDoc(roomRef, {
    turn: next
  });
}
