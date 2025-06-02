async function loadCharacterData() {
    const name = localStorage.getItem("playerName");
    if (!name) {
        alert("找不到登入資訊，請重新建立角色！");
        window.location.href = "create.html";
        return;
    }

    const playerRef = firebase.database().ref("players/" + name);
    playerRef.once("value").then(snapshot => {
        if (!snapshot.exists()) {
            alert("找不到角色資料，請重新建立！");
            window.location.href = "create.html";
            return;
        }

        const characterData = snapshot.val();
        console.log("角色資料：", characterData);

        const playerNameOnPhoto = document.getElementById("playerNameOnPhoto");
        const playerPhoto = document.getElementById("playerPhoto");
        const startGameBtn = document.getElementById("startGameBtn");
        const enhanceBtn = document.getElementById("enhanceBtn");
        const difficultyButtons = document.getElementById("difficultyButtons");
        const easyBtn = document.getElementById("easyBtn");
        const hardBtn = document.getElementById("hardBtn");

        playerNameOnPhoto.textContent = name; // 注意：這裡用的是 localStorage 中的 name
        playerPhoto.src = "css/images/role-1.jpg";

        startGameBtn.addEventListener("click", () => {
            difficultyButtons.style.display = "block";
            startGameBtn.style.display = "none";
        });

        easyBtn.addEventListener("click", () => {
            window.location.href = "battle1.html";
        });

        hardBtn.addEventListener("click", () => {
            window.location.href = "battle2.html";
        });

        enhanceBtn.addEventListener("click", () => {
            window.location.href = "enhance.html";
        });

    }).catch(error => {
        console.error("讀取角色資料失敗：", error);
        alert("資料讀取錯誤，請稍後再試！");
    });
}

loadCharacterData();
