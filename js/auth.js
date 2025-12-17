import { signInAnonymously, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth } from "./firebase.js";

export let currentUser = null;
export let authReady = false;

signInAnonymously(auth)
  .catch(err => console.error("❌ Auth error", err));

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    authReady = true;
    console.log("🟢 Usuario conectado:", user.uid);
  }
});
