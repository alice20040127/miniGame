const name = localStorage.getItem("playerName");
if (!name) {
  alert("請先創建角色！");
  window.location.href = "create.html";
}

const coinDisplay = document.getElementById("coinDisplay");
const backBtn = document.getElementById("backBtn");

const stats = {
  hp: { valueEl: document.getElementById("hpValue"), btnEl: document.getElementById("hpEnhanceBtn"), limitEl: document.getElementById("hpLimit"), baseValue: 100, increments: 20, max: 300 },
  strength: { valueEl: document.getElementById("strengthValue"), btnEl: document.getElementById("strengthEnhanceBtn"), limitEl: document.getElementById("strengthLimit"), baseValue: 0.5, increments: 0.05, max: 1.0 },
  damage: { valueEl: document.getElementById("damageValue"), btnEl: document.getElementById("damageEnhanceBtn"), limitEl: document.getElementById("damageLimit"), baseValue: 20, increments: 3, max: 50 },
  skillDamage: { valueEl: document.getElementById("skillDamageValue"), btnEl: document.getElementById("skillDamageEnhanceBtn"), limitEl: document.getElementById("skillDamageLimit"), baseValue: 50, increments: 5, max: 100 },
  movement: { valueEl: document.getElementById("movementValue"), btnEl: document.getElementById("movementEnhanceBtn"), limitEl: document.getElementById("movementLimit"), baseValue: 20, increments: 1, max: 30 },
};

const enhanceCost = 10;
let coins = 0;

const playerRef = firebase.database().ref("players/" + name);
    playerRef.once("value").then(snapshot => {
        if (!snapshot.exists()) {
            alert("找不到角色資料，請重新建立！");
            window.location.href = "create.html";
            return;
        }

        const characterData = snapshot.val();
        console.log("角色資料：", characterData);
      
function updateDisplay() {
  coinDisplay.textContent = `金幣: ${coins}`;

  for (const key in stats) {
    const stat = stats[key];
    let displayValue = stat.baseValue;

    if (key === "strength") {
      displayValue = displayValue.toFixed(2);
    } else {
      displayValue = Math.round(displayValue);
    }
    stat.valueEl.textContent = displayValue;

    // 判斷是否達上限（只用 baseValue 和 max）
    if (stat.baseValue >= stat.max) {
      stat.btnEl.style.display = "none";
      stat.limitEl.style.display = "inline-block";
    } else {
      stat.btnEl.style.display = "inline-block";
      stat.limitEl.style.display = "none";
    }
  }
}

// 讀取玩家資料
playerRef.once("value").then(snapshot => {
  if (!snapshot.exists()) {
    alert("找不到角色資料！");
    window.location.href = "lobby.html";
    return;
  }
  const data = snapshot.val();
  coins = data.coins || 0;

  for (const key in stats) {
    stats[key].baseValue = data[key] || stats[key].baseValue;
  }
  
  updateDisplay();
}).catch(error => {
  console.error(error);
  alert("讀取角色資料失敗！");
});

for (const key in stats) {
  const stat = stats[key];
  stat.btnEl.addEventListener("click", () => {
    if (coins < enhanceCost) {
      alert("金幣不足！");
      return;
    }
    // 計算強化後的新值
    const newValue = stat.baseValue + stat.increments;

    if (newValue > stat.max) {
      alert("已達強化上限！");
      return;
    }

    coins -= enhanceCost;
    stat.baseValue = newValue;

    // 更新 Firebase
    const updateObj = {
      coins: coins,
      [key]: newValue,
    };

    playerRef.update(updateObj).then(() => {
      alert("強化成功！");
      updateDisplay();
    }).catch(err => {
      console.error(err);
      alert("更新資料失敗！");
    });
  });
}
// 返回大廳按鈕
backBtn.addEventListener("click", () => {
  window.location.href = "lobby.html";
});
