import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiF88HRSwk5Oh7hHFhRbSrFIEgSFhUQNk",
    authDomain: "minigame-c4659.firebaseapp.com",
    databaseURL: "https://minigame-c4659-default-rtdb.firebaseio.com",
    projectId: "minigame-c4659",
    storageBucket: "minigame-c4659.firebasestorage.app",
    messagingSenderId: "949145698632",
    appId: "1:949145698632:web:1e84e215e8a862f4a3737d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
