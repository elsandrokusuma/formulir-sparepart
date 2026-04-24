import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIFyxBwoRp75cZ2EXltaHOF0gkVl7Bvy4",
  authDomain: "studio-5214957828-31478.firebaseapp.com",
  projectId: "studio-5214957828-31478",
  storageBucket: "studio-5214957828-31478.firebasestorage.app",
  messagingSenderId: "429815524686",
  appId: "1:429815524686:web:8e55d757b35ec7c504c21f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
