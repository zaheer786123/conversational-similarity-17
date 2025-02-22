
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuzr-Z4B59t5ujazl_gTNN_yHd0MpzNmY",
  authDomain: "chat-gpt-ac549.firebaseapp.com",
  projectId: "chat-gpt-ac549",
  storageBucket: "chat-gpt-ac549.firebasestorage.app",
  messagingSenderId: "709759371421",
  appId: "1:709759371421:web:ae07541431e30aea782c74"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
