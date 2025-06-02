const player = document.getElementById("player");
const enemy = document.getElementById("enemy");
const projectile = document.getElementById("projectile");
const aimLine = document.getElementById("aimLine");
const angleDisplay = document.getElementById("angleDisplay");
const status = document.getElementById("status");
const gameArea = document.getElementById("gameArea");
const powerBar = document.getElementById("powerBar");
const enemyHPBar = document.getElementById("enemyHP");
const playerHPBar = document.getElementById("playerHP");

const gravity = 9.8;
const timeInterval = 20; // ms
let powerScale = 0.5;
let damage = 30;
let skillDamage = 50;
let movement = 20;
let playerHP = 100;

let wind = (Math.random() * 2 - 1).toFixed(2);
let isPlayerTurn = true;
let enemyHP = [100, 110, 120, 130, 140, 150][Math.floor(Math.random() * 6)];
let dragStart = null;
let playerHasActed = false;
let skillCooldown = 5;

async function loadPlayerData() {
    const snapshot = await db.ref('characters/player1').once('value');
    if (snapshot.exists()) {
        const data = snapshot.val();
        playerHP = data.hp;
        powerScale = data.strength;
        damage = data.damage;
        skillDamage = data.skillDamage;
        movement = data.movement;
        playerHPBar.style.width = playerHP + "%";
    } else {
        console.error("找不到角色資料");
    }
}

loadPlayerData();
setTurn(true);

async function updateCoins(amount) {
    const charRef = db.ref('characters/player1');
    const snapshot = await charRef.once('value');
    if (snapshot.exists()) {
        const currentData = snapshot.val();
        const newCoins = (currentData.coins || 0) + amount;
        await charRef.set({ ...currentData, coins: newCoins });
    }
}

let windDirection = "⭤";
let windColor = "black";
if (wind > 0) {
    windDirection = "→";
    windColor = "blue";
} else if (wind < 0) {
    windDirection = "←";
    windColor = "red";
}
status.innerHTML += `<br><span style="color:${windColor}">風速：${Math.abs(wind)} ${windDirection}</span>`;

function setTurn(isPlayer) {
    isPlayerTurn = isPlayer;
    playerHasActed = false;
    if (isPlayerTurn && !playerHasActed) {
        skillCooldown = Math.max(0, skillCooldown - 1);
        if (skillCooldown === 0) {
            status.innerText += "\n你的回合，選擇攻擊、移動、或角色技能（左右鍵移動，滑鼠蓄力攻擊，E鍵發動角色技能），只能做一次動作。";
        } else {
            status.innerText += "\n你的回合，選擇攻擊或移動（左右鍵移動，滑鼠蓄力攻擊），只能做一次動作。";
        }
    } else {
        status.innerText += "\n敵人回合...";
        setTimeout(enemyAction, 1000);
    }
}

document.addEventListener('keydown', (e) => {
    if (!isPlayerTurn || playerHasActed) return;
    if (e.key === "e" && skillCooldown === 0) {
        fireSkillBullet();
        skillCooldown = 5;
        playerHasActed = true;
        setTimeout(() => setTurn(false), 1000); // 結束玩家回合
        } else {
        status.innerText += `\n技能還在冷卻中（剩餘 ${skillCooldown} 回合）`;
    }

    let newX = parseFloat(player.style.left);
    if (e.key === "ArrowLeft") {
        newX -= movement;
    } else if (e.key === "ArrowRight") {
        newX += movement;
    } else {
        return;
    }
    newX = Math.max(0, Math.min(gameArea.clientWidth - 40, newX));
    player.style.left = newX + "px";
    playerHasActed = true;
    setTurn(false);
});

let dragPower = 0;
let increasing = true;
let powerInterval = null;

gameArea.addEventListener('mousedown', (e) => {
    if (!isPlayerTurn || playerHasActed) return;

    dragStart = { x: e.offsetX, y: e.offsetY };
    dragPower = 0;
    increasing = true;

    aimLine.style.display = 'block';
    aimLine.style.left = player.offsetLeft + 20 + 'px';
    aimLine.style.bottom = '40px';
    aimLine.style.width = '100px';

    angleDisplay.style.display = 'block';
    powerBar.style.width = '0%';
    powerBar.style.backgroundColor = "blue";
    powerBar.style.display = "block";

    powerInterval = setInterval(() => {
    dragPower += increasing ? 1.5 : -1.5;
    if (dragPower >= 100) {
        dragPower = 100;
        increasing = false;
    } else if (dragPower <= 0) {
        dragPower = 0;
        increasing = true;
    }
    powerBar.style.width = dragPower + '%';
    }, 20);
});

gameArea.addEventListener('mousemove', (e) => {
    if (!dragStart || !isPlayerTurn || playerHasActed) return;

    const playerX = player.offsetLeft + 20;
    const aimBottom = 40;
    const dx = e.offsetX - playerX;
    const dy = player.offsetTop + 20 - e.offsetY;

    let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
    angleDeg = Math.max(0, Math.min(90, angleDeg));

    aimLine.style.transform = `rotate(${angleDeg}deg)`;
    angleDisplay.innerText = `${Math.round(angleDeg)}°`;
    angleDisplay.style.left = (playerX + 10) + 'px';
    angleDisplay.style.bottom = (aimBottom + 40) + 'px';
});

gameArea.addEventListener('mouseup', (e) => {
    if (!isPlayerTurn || playerHasActed || !dragStart) return;

    clearInterval(powerInterval);
    dragStart = null;
    aimLine.style.display = 'none';
    angleDisplay.style.display = 'none';
    powerBar.style.display = "none";

    const rect = gameArea.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const playerX = player.offsetLeft + 20;
    const playerY = 40;
    const dx = mouseX - playerX;
    const dy = playerY - mouseY;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    angle = Math.max(0, Math.min(90, angle));

    shoot(angle, dragPower, damage);
    playerHasActed = true;
});

async function shoot(angle, power, dmg) {
    const rad = angle * Math.PI / 180;
    const vx = power * powerScale * Math.cos(rad);
    const vy = power * powerScale * Math.sin(rad);
    let x = player.offsetLeft + 20;
    let y = 40;
    projectile.style.display = "block";
    projectile.style.left = x + "px";
    projectile.style.bottom = y + "px";
    let t = 0;

    const interval = setInterval(async () => {
        t += 0.1;
        const windForce = wind * 0.3;
        const px = x + vx * t + windForce * t;
        const py = y + vy * t - 0.5 * gravity * t * t;
        projectile.style.left = px + "px";
        projectile.style.bottom = py + "px";

        const dx = px - (parseFloat(enemy.style.left) + 20);
        const dy = py - 20;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            clearInterval(interval);
            projectile.style.display = "none";
            enemyHP -= dmg;
            showDamage(document.getElementById('enemy'), dmg);
            enemyHPBar.style.width = Math.max(0, enemyHP) + "%";
            if (enemyHP <= 0) {
                status.innerText = "你贏了！敵人被擊敗！獲得 15 金幣！";
                await updateCoins(15);
                setTimeout(() => {window.location.href = "lobby.html";}, 3000);
                return;
            }else{
                status.innerText = `命中！敵人損失 ${dmg} HP！`;
                setTimeout(() => setTurn(false), 1000);
            }
        }

        if (py < 0 || px > gameArea.clientWidth || px < 0) {
            clearInterval(interval);
            projectile.style.display = "none";
            status.innerText = "沒打中...";
            setTimeout(() => setTurn(false), 1000);
        }
    }, timeInterval);
}

async function fireSkillBullet() {
    let x = player.offsetLeft + 20;
    let y = 40;
    projectile.style.display = "block";
    projectile.style.left = x + "px";
    projectile.style.bottom = y + "px";
    let vx = 10;
    const interval = setInterval(async () => {
        x += vx;
        projectile.style.left = x + "px";

        const dx = x - (parseFloat(enemy.style.left) + 20);
        const dy = y - 20;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            clearInterval(interval);
            projectile.style.display = "none";
            enemyHP -= skillDamage;
            showDamage(document.getElementById('enemy'), skillDamage);
            enemyHPBar.style.width = Math.max(0, enemyHP) + "%";
            if (enemyHP <= 0) {
                status.innerText = "你贏了！敵人被技能擊敗！獲得 15 金幣！";
                await updateCoins(15);
                setTimeout(() => {window.location.href = "lobby.html";}, 3000);
                return;
            }else{
                status.innerText = `技能命中！敵人損失 ${skillDamage} HP！`;
                setTimeout(() => setTurn(false), 1000);
            }
        }

        if (x > gameArea.clientWidth) {
            clearInterval(interval);
            projectile.style.display = "none";
            status.innerText = "技能沒打中...";
            setTimeout(() => setTurn(false), 1000);
        }
    }, timeInterval);
}

function enemyAction() {
    if (enemyHP <= 0 || playerHP <= 0) return;
    if (Math.random() < 0.5) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        const distance = 20 + Math.random() * 40;
        let newX = parseFloat(enemy.style.left) + direction * distance;
        newX = Math.max(0, Math.min(gameArea.clientWidth - 40, newX));
        enemy.style.left = newX + "px";
        status.innerText = "敵人移動了！";
        setTimeout(() => setTurn(true), 1000);
    } else {
        enemyShoot();
    }
}

async function enemyShoot() {
    const angle = 120 + Math.random() * 60;
    const power = 50 + Math.random() * 50;
    const rad = angle * Math.PI / 180;
    const vx = power * powerScale * Math.cos(rad);
    const vy = power * powerScale * Math.sin(rad);
    let x = parseFloat(enemy.style.left) + 20;
    let y = 40;
    projectile.style.display = "block";
    projectile.style.left = x + "px";
    projectile.style.bottom = y + "px";
    let t = 0;

    const interval = setInterval(async () => {
        t += 0.1;
        const windForce = wind * 0.3;
        const px = x + vx * t + windForce * t;
        const py = y + vy * t - 0.5 * gravity * t * t;
        projectile.style.left = px + "px";
        projectile.style.bottom = py + "px";

        const dx = px - (parseFloat(player.style.left) + 20);
        const dy = py - 20;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const damage = [20, 25, 30][Math.floor(Math.random() * 3)];

        if (dist < 20) {
            clearInterval(interval);
            projectile.style.display = "none";
            playerHP -= damage;
            showDamage(document.getElementById('player'), damage); 
            playerHPBar.style.width = Math.max(0, playerHP) + "%";
            if (playerHP <= 0) {
                status.innerText = "你輸了！被敵人擊敗！獲得 5 金幣...";
                await updateCoins(5);
                setTimeout(() => {
                    window.location.href = "lobby.html";
                }, 3000);
                return;
            }else{
                status.innerText = `敵人命中你，損失 ${damage} HP！`;
            setTimeout(() => setTurn(true), 1000);
            }
        }

        if (py < 0 || px > gameArea.clientWidth || px < 0) {
        clearInterval(interval);
            projectile.style.display = "none";
            status.innerText = "敵人沒打中...";
            setTimeout(() => setTurn(true), 1000);
        }
    }, timeInterval);
}

function showDamage(targetElement, amount) {
    const damage = document.createElement('div');
    damage.className = 'damageText';
    damage.textContent = `-${amount}`;

    const rect = targetElement.getBoundingClientRect();
    const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

    damage.style.left = `${rect.left + rect.width / 2 - gameAreaRect.left}px`;
    damage.style.top = `${rect.top - gameAreaRect.top - 20}px`;

    document.getElementById('gameArea').appendChild(damage);

    setTimeout(() => {
        damage.remove();
    }, 1000); // 移除動畫後的元素
}

setTurn(true);
player.style.left = "50px";
player.style.bottom = "0px";
enemy.style.left = "450px";
enemy.style.bottom = "0px";
