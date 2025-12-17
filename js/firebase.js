import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDx27AqvREQX4nEOYLyzbXty7yuwjwYcO8",
  authDomain: "juegos-pareja.firebaseapp.com",
  projectId: "juegos-pareja",
  storageBucket: "juegos-pareja.appspot.com",
  messagingSenderId: "360710715110",
  appId: "1:360710715110:web:ad6921351af495a886ad27"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
