import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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
const auth = getAuth(app);
const SESSION = "global";

let currentUid = null;
const authReady = signInAnonymously(auth).then(() => new Promise((resolve) => {
  onAuthStateChanged(auth, (u) => { currentUid = u ? u.uid : null; resolve(currentUid); });
}));

export async function join(nickname) {
  await authReady;
  const uid = currentUid;
  const partRef = ref(db, `sessions/${SESSION}/participants/${uid}`);
  const presRef = ref(db, `sessions/${SESSION}/presence/${uid}`);
  await set(partRef, { name: nickname, correctAnswers: 0, total: 0, wrong: 0, types: {} });
  await set(presRef, { name: nickname, lastSeen: Date.now() });
  onDisconnect(presRef).remove();
  return uid;
}

export async function leave(uid) {
  await authReady;
  remove(ref(db, `sessions/${SESSION}/presence/${uid || currentUid}`));
}

export function onPresence(cb) {
  authReady.then(() => onValue(ref(db, `sessions/${SESSION}/presence`), (snap) => cb(snap.val() || {})));
}

export async function addScore(nickname, taskType, correct) {
  await authReady;
  const uid = currentUid;
  const partRef = ref(db, `sessions/${SESSION}/participants/${uid}`);
  onValue(partRef, (snap) => {
    const cur = snap.val() || { name: nickname, correctAnswers: 0, total: 0, wrong: 0, types: {} };
    const t = cur.types || {};
    const tt = t[taskType] || { correct: 0, wrong: 0, total: 0 };
    tt.total += 1;
    if (correct) tt.correct += 1; else tt.wrong += 1;
    t[taskType] = tt;
    set(partRef, {
      name: nickname,
      correctAnswers: (cur.correctAnswers || 0) + (correct ? 1 : 0),
      wrong: (cur.wrong || 0) + (correct ? 0 : 1),
      total: (cur.total || 0) + 1,
      types: t,
      lastSeen: Date.now()
    });
  }, { onlyOnce: true });
}

export function onLeaderboard(cb) {
  authReady.then(() => onValue(ref(db, `sessions/${SESSION}/participants`), (snap) => {
    const data = snap.val() || {};
    const list = Object.values(data).sort((a, b) => (b.correctAnswers || 0) - (a.correctAnswers || 0));
    cb(list);
  }));
}

if (typeof window !== "undefined") window.MTGPresence = { join, leave, onPresence, addScore, onLeaderboard, authReady };
