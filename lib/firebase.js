import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuXcGqumJ6aRjokXDgm5dFEAUgqNm-b0E",
  authDomain: "talentbank-calander.firebaseapp.com",
  projectId: "talentbank-calander",
  storageBucket: "talentbank-calander.firebasestorage.app",
  messagingSenderId: "534955262434",
  appId: "1:534955262434:web:477d4e20b1c4e6742e79bb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);