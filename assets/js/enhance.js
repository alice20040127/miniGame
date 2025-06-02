import { db } from './firebaseConfig.js';
import {
  ref,
  get,
  set,
  child
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const name = localStorage.getItem("playerName");
if (!name) {
    alert("請先創建角色！");
    window.location.href = "create.html";
}

// 元素參考
const coinDisplay = document.getElementById("coinDisplay");
const backBtn = document.getElementById("backBtn");

// 屬性按鈕與值
const stats = {
    hp: { valueEl: document.getElementById("hpValue"), btnEl: document.getElementById("hpEnhanceBtn"), limitEl: document.getElementById("hpLimit"), baseValue: 0, increments: 20 },
    strength: { valueEl: document.getElementById("strengthValue"), btnEl: document.getElementById("strengthEnhanceBtn"), limitEl: document.getElementById("strengthLimit"), baseValue: 0, increments: 0.05 },
    damage: { valueEl: document.getElementById("damageValue"), btnEl: document.getElementById("damageEnhanceBtn"), limitEl: document.getElementById("damageLimit"), baseValue: 0, increments: 5 },
    skillDamage: { valueEl: document.getElementById("skillDamageValue"), btnEl: document.getElementById("skillDamageEnhanceBtn"), limitEl: document.getElementById("skillDamageLimit"), baseValue: 0, increments: 5 },
    movement: { valueEl: document.getElementById("movementValue"), btnEl: document.getElementById("movementEnhanceBtn"), limitEl: document.getElementById("movementLimit"), baseValue: 0, increments: 1 },
};

const maxEnhance = 10;
const enhanceCost = 10;

let coin = 0;
let enhanceCounts = {
    hp: 0,
    strength: 0,
    damage: 0,
    skillDamage: 0,
    movement: 0
};

const db = firebase.database();
const playerRef = db.ref("players/" + name);

function updateDisplay() {
  // 顯示金幣數量
    coinDisplay.textContent = `金幣: ${coin}`;

  // 更新各屬性數值及按鈕狀態
    for (const key in stats) {
        const stat = stats[key];
        let displayValue = stat.baseValue;

        // 累積強化效果
        displayValue += enhanceCounts[key] * stat.increments;

        // 小數取2位
        if (key === "strength") {
            displayValue = displayValue.toFixed(2);
        } else {
            displayValue = Math.round(displayValue);
        }

        stat.valueEl.textContent = displayValue;

        // 控制按鈕顯示
        if (enhanceCounts[key] >= maxEnhance) {
            stat.btnEl.style.display = "none";
            stat.limitEl.style.display = "inline-block";
        } else {
            stat.btnEl.style.display = "inline-block";
            stat.limitEl.style.display = "none";
        }
    }
}

// 從 Firebase 讀取資料
playerRef.once("value").then(snapshot => {
    if (!snapshot.exists()) {
        alert("找不到角色資料！");
        window.location.href = "lobby.html";
        return;
    }
    const data = snapshot.val();
    coin = data.coin || 0;

  // 設定基礎屬性值
    stats.hp.baseValue = data.hp || 0;
    stats.strength.baseValue = data.strength || 0;
    stats.damage.baseValue = data.damage || 0;
    stats.skillDamage.baseValue = data.skillDamage || 0;
    stats.movement.baseValue = data.movement || 0;

    updateDisplay();
}).catch(error => {
    console.error(error);
    alert("讀取角色資料失敗！");
});

// 按鈕點擊事件
for (const key in stats) {
    stats[key].btnEl.addEventListener("click", () => {
    if (enhanceCounts[key] >= maxEnhance) return;

    if (coin < enhanceCost) {
        alert("金幣不足！");
        return;
    }

    // 扣除金幣
    coin -= enhanceCost;

    // 強化次數+1
    enhanceCounts[key]++;

    // 更新 Firebase
    const updateObj = {};
    updateObj.coin = coin;
    // 新屬性 = 原本baseValue + 累積強化量
    updateObj[key] = stats[key].baseValue + enhanceCounts[key] * stats[key].increments;

    playerRef.update(updateObj).then(() => {
        alert("強化成功！");
        updateDisplay();
    }).catch(err => {
        console.error(err);
        alert("更新資料失敗！");
    });
    });
}

// 返回大廳
backBtn.addEventListener("click", () => {
    window.location.href = "lobby.html";
});
