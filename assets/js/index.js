import { db } from './firebaseConfig.js'; // 這裡的 db 是 firebase.database()，不是 getFirestore()
import {
  ref,
  get,
  set,
  child
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

async function createCharacter() {
    const name = document.getElementById("playerName").value.trim();
    if (name === "") {
        alert("請輸入角色名稱！");
        return;
    }

    const characterRef = db.ref("players/" + name);

    characterRef.once("value")
    .then(async (snapshot) => {
    if (snapshot.exists()) {
        // 資料已存在 → 載入角色資料
        const data = snapshot.val();
        localStorage.setItem("playerName", name);
        localStorage.setItem("hp", data.hp.toString());
        localStorage.setItem("strength", data.strength.toString());
        localStorage.setItem("damage", data.damage.toString());
        localStorage.setItem("skillDamage", data.skillDamage.toString());
        localStorage.setItem("movement", data.movement.toString());
        localStorage.setItem("coin", data.coins.toString());
        alert("歡迎回來，" + name + "！");
    } else {
    // 資料不存在 → 建立新角色
    const newCharacter = {
        hp: 100,
        strength: 0.5,
        damage: 20,
        skillDamage: 50,
        movement: 20,
        coins: 0
    };

    await characterRef.set(newCharacter);

    localStorage.setItem("playerName", name);
    localStorage.setItem("hp", "100");
    localStorage.setItem("strength", "0.5");
    localStorage.setItem("damage", "20");
    localStorage.setItem("skillDamage", "50");
    localStorage.setItem("movement", "20");
    localStorage.setItem("coin", "0");

    alert("角色創建成功，歡迎 " + name + "！");
    }

    // 導向大廳
    window.location.href = "lobby.html";
    })
    .catch((error) => {
        console.error("取得角色資料錯誤：", error);
        alert("角色創建失敗，請稍後再試！");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('button');
    button.addEventListener('click', createCharacter);
});
