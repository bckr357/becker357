// Präsenz + Leaderboard über Firebase Realtime Database (kostenloser Spark-Plan).
// 1) Firebase-Projekt anlegen (console.firebase.google.com), Realtime Database aktivieren.
// 2) In den Regeln Lese-/Schreibzugriff für /presence und /scores erlauben.
// 3) firebaseConfig unten mit deinen Werten ersetzen.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyARjp98sKfSge6H3iPSrxSORIIbAjU6ZB0",
  authDomain: "becker357-de.firebaseapp.com",
  databaseURL: "https://becker357-de-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "becker357-de",
  messagingSenderId: "334496432611",
  storageBucket: "becker357-de.firebasestorage.app",
  appId: "1:334496432611:web:88e276677fe38df80e20d6",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

if (typeof window !== "undefined") window.MTGPresence = { join, leave, onPresence, addScore, onLeaderboard };
export function join(nickname) {
  const id = nickname.trim().toLowerCase();
  const presenceRef = ref(db, "presence/" + id);
  set(presenceRef, { name: nickname, lastSeen: Date.now() });
  onDisconnect(presenceRef).remove();
  return id;
}

export function leave(id) {
  remove(ref(db, "presence/" + id));
}

export function onPresence(cb) {
  onValue(ref(db, "presence"), (snap) => cb(snap.val() || {}));
}

export function addScore(nickname, correct) {
  const id = nickname.trim().toLowerCase();
  const scoreRef = ref(db, "scores/" + id);
  onValue(scoreRef, (snap) => {
    const cur = (snap.val() && snap.val().correct) || 0;
    set(scoreRef, { name: nickname, correct: cur + (correct ? 1 : 0) });
  }, { onlyOnce: true });
}

export function onLeaderboard(cb) {
  onValue(ref(db, "scores"), (snap) => {
    const data = snap.val() || {};
    const list = Object.values(data).sort((a, b) => (b.correct || 0) - (a.correct || 0));
    cb(list);
  });
}
