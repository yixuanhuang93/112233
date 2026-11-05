// ==========================================
// PBL 三關卡連續闖關互動遊戲：全域變數區
// ==========================================
let gameState = "START"; // 遊戲狀態: "START", "STAGE1", "STAGE2", "STAGE3", "WIN", "GAMEOVER"
let score = 0;           // 玩家總得分
let lives = 3;           // 玩家生命值
let stageTimer = 30;     // 每關預設秒數
let timerInterval;       // 計時器物件

// --- 第一關專用變數 (黃金接球大賽) ---
let player;
let fallingItems = [];
let stage1Target = 50;   // 第一關通關門檻

// --- 第二關專用變數 (知識快問快答) ---
let questions = [
  { q: "哪一個指令可以設定 p5.js 畫布的背景顏色？", options: ["A. color()", "B. background()", "C. fillColor()", "D. stroke()"], correct: 1 },
  { q: "被球迷與教練團稱為「小可愛」的中信兄弟黃金游擊手是誰？", options: ["A. 王威晨", "B. 江坤宇", "C. 岳東華", "D. 高宇杰"], correct: 1 },
  { q: "哪一個指令用來在畫布上繪製矩形？", options: ["A. circle()", "B. ellipse()", "C. rect()", "D. line()"], correct: 2 },
  { q: "中信兄弟效力多年、屢次榮獲勝投王與防禦率王的強力左投是？", options: ["A. 象魔力", "B. 德保拉", "C. 克迪", "D. 猛登"], correct: 1 }
];
let currentQIndex = 0;

// --- 第三關專用變數 (全壘打點擊特訓) ---
let targetBall = null;
let stage3Score = 0;
let stage3Target = 5;    // 需要擊中 5 顆全壘打球

// UI DOM 元素
let gameContainer, titleP, descP, startBtn;
let audioCtx = null;

// ==========================================
// 預先載入：注入 Google Fonts 與 RWD CSS 樣式
// ==========================================
function preload() {
  let cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Isometra&family=LXGW+WenKai+Mono+TC&display=swap');

    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
    }

    #game-container {
      background: rgba(255, 255, 255, 0.98);
      padding: 30px 40px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      width: 90%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      z-index: 10;
      text-align: center;
    }

    .game-title {
      font-size: clamp(1.3rem, 2.8vw, 1.7rem);
      font-weight: bold;
      color: #1e3a8a;
      margin: 0 0 10px 0;
    }

    .game-desc {
      font-size: clamp(0.9rem, 2vw, 1.1rem);
      color: #64748b;
      margin: 0 0 25px 0;
      line-height: 1.5;
    }

    .game-ui-btn {
      padding: 12px 35px;
      font-size: 1.1rem;
      font-weight: bold;
      background-color: #facc15;
      color: #1e3a8a;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(250, 204, 21, 0.4);
      transition: all 0.2s ease;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
    }

    .game-ui-btn:hover {
      background-color: #eab308;
      transform: scale(1.03);
    }

    .stage2-btn {
      display: block;
      width: 100%;
      padding: 12px 15px;
      margin: 10px 0;
      font-size: 1rem;
      background-color: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
      transition: background 0.2s;
    }
    .stage2-btn:hover {
      background-color: #f1f5f9;
    }

    @media (max-width: 480px) {
      #game-container { padding: 20px; width: 95%; }
    }
  `;
  let styleElement = document.createElement('style');
  styleElement.innerHTML = cssStyles;
  document.head.appendChild(styleElement);
}

// ==========================================
// 初始化設定
// ==========================================
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');

  player = { w: 140, h: 30, y: height - 60 };

  gameContainer = createDiv();
  gameContainer.id('game-container');

  titleP = createP("⚾ 兄弟棒球三關卡大冒險");
  titleP.parent(gameContainer);
  titleP.addClass('game-title');

  descP = createP("挑戰三大關卡：黃金接球 ➔ 知識問答 ➔ 全壘打特訓！準備好拿下總冠軍了嗎？");
  descP.parent(gameContainer);
  descP.addClass('game-desc');

  startBtn = createButton("開始闖關！");
  startBtn.parent(gameContainer);
  startBtn.addClass('game-ui-btn');
  startBtn.mousePressed(startStage1);
}

// ==========================================
// 繪圖與遊戲主迴圈
// ==========================================
function draw() {
  background(15, 23, 42);

  if (gameState === "STAGE1") {
    playStage1();
  } else if (gameState === "STAGE2") {
    drawBgGlow();
  } else if (gameState === "STAGE3") {
    playStage3();
  } else {
    drawBgGlow();
  }
}

function drawBgGlow() {
  noStroke();
  fill(255, 255, 255, 10);
  ellipse(width * 0.2, height * 0.3, 250, 250);
  ellipse(width * 0.8, height * 0.7, 350, 350);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  player.y = height - 60;
}

// ==========================================
// 【第 1 關邏輯】黃金接球大賽
// ==========================================
function startStage1() {
  initAudio();
  gameState = "STAGE1";
  score = 0;
  lives = 3;
  stageTimer = 30;
  fallingItems = [];
  gameContainer.style('display', 'none');

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    stageTimer--;
    if (stageTimer <= 0) {
      if (score >= stage1Target) {
        startStage2();
      } else {
        gameOver("第 1 關未達 50 分！挑戰失敗！");
      }
    }
  }, 1000);
}

function playStage1() {
  drawBgGlow();

  if (frameCount % 35 === 0) {
    let isGood = random(1) > 0.35;
    let txt = isGood ? random(["⚾ 勝利球", "🧢 球帽", "🏆 獎盃", "📣 汽笛"]) : random(["⛈️ 暴雨", "❌ 失誤"]);
    fallingItems.push({
      x: random(60, width - 60), y: -30, w: 100, h: 36,
      speed: random(4, 7), text: txt, isGood: isGood
    });
  }

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    push();
    rectMode(CENTER);
    fill(250, 204, 21, 230);
    stroke(202, 138, 4);
    rect(item.x, item.y, item.w, item.h, 10);
    fill(15, 23, 42); noStroke(); textSize(14); textAlign(CENTER, CENTER);
    text(item.text, item.x, item.y);
    pop();

    let px = constrain(mouseX, player.w / 2, width - player.w / 2);
    if (item.y + 18 >= player.y - 15 && item.y - 18 <= player.y + 15 && item.x >= px - 70 && item.x <= px + 70) {
      if (item.isGood) {
        score += 10;
        playAudioEffect('score');
        if (score >= stage1Target) { startStage2(); return; }
      } else {
        lives--;
        playAudioEffect('hurt');
        if (lives <= 0) { gameOver("生命值歸零！"); return; }
      }
      fallingItems.splice(i, 1);
      continue;
    }
    if (item.y > height + 30) fallingItems.splice(i, 1);
  }

  let px = constrain(mouseX, player.w / 2, width - player.w / 2);
  push();
  rectMode(CENTER); fill(30, 58, 138); stroke(250, 204, 21); strokeWeight(3);
  rect(px, player.y, player.w, player.h, 12);
  fill(255); noStroke(); textSize(14); textAlign(CENTER, CENTER);
  text("⚾ 應援手套", px, player.y);
  pop();

  push();
  fill(255); textSize(18); textAlign(LEFT, TOP);
  text(`⭐ 第1關 | 得分: ${score} / ${stage1Target}`, 30, 30);
  text(`❤️ 生命: ${lives}`, 30, 60);
  textAlign(RIGHT, TOP); text(`⏳ 倒數: ${stageTimer}s`, width - 30, 30);
  pop();
}

// ==========================================
// 【第 2 關邏輯】棒球與程式知識問答
// ==========================================
function startStage2() {
  clearInterval(timerInterval);
  gameState = "STAGE2";
  currentQIndex = 0;
  stageTimer = 25;

  gameContainer.style('display', 'flex');
  loadQuestionUI();

  timerInterval = setInterval(() => {
    stageTimer--;
    if (stageTimer <= 0) {
      gameOver("第 2 關時間到！闖關失敗！");
    }
  }, 1000);
}

function loadQuestionUI() {
  gameContainer.html('');
  if (currentQIndex >= questions.length) {
    startStage3();
    return;
  }

  let q = questions[currentQIndex];

  let t = createP(`⭐ 第 2 關：知識快問快答 (第 ${currentQIndex+1}/${questions.length} 題)`);
  t.parent(gameContainer); t.addClass('game-title');

  let d = createP(q.q);
  d.parent(gameContainer); d.addClass('game-desc');

  for (let i = 0; i < q.options.length; i++) {
    let btn = createButton(q.options[i]);
    btn.parent(gameContainer);
    btn.addClass('stage2-btn');
    btn.mousePressed(() => checkAnswer(i, q.correct));
  }
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score += 25;
    playAudioEffect('score');
    currentQIndex++;
    loadQuestionUI();
  } else {
    lives--;
    playAudioEffect('hurt');
    if (lives <= 0) {
      gameOver("答錯且生命值歸零！");
    } else {
      alert("答錯囉！扣 1 條命");
      loadQuestionUI();
    }
  }
}

// ==========================================
// 【第 3 關邏輯】全壘打特訓點擊挑戰
// ==========================================
function startStage3() {
  clearInterval(timerInterval);
  gameState = "STAGE3";
  stage3Score = 0;
  stageTimer = 20;
  gameContainer.style('display', 'none');
  spawnTargetBall();

  timerInterval = setInterval(() => {
    stageTimer--;
    if (stageTimer <= 0) {
      if (stage3Score >= stage3Target) {
        gameWin();
      } else {
        gameOver("第 3 關全壘打數不足！挑戰失敗！");
      }
    }
  }, 1000);
}

function spawnTargetBall() {
  targetBall = {
    x: random(80, width - 80),
    y: random(100, height - 100),
    r: 45
  };
}

function playStage3() {
  drawBgGlow();

  if (targetBall) {
    push();
    fill(250, 204, 21);
    stroke(202, 138, 4);
    strokeWeight(3);
    ellipse(targetBall.x, targetBall.y, targetBall.r * 2);
    fill(15, 23, 42); noStroke(); textAlign(CENTER, CENTER); textSize(14);
    text("⚾ 轟!", targetBall.x, targetBall.y);
    pop();
  }

  push();
  fill(255); textSize(18); textAlign(LEFT, TOP);
  text(`⭐ 第3關 | 全壘打: ${stage3Score} / ${stage3Target}`, 30, 30);
  text(`❤️ 生命: ${lives}`, 30, 60);
  textAlign(RIGHT, TOP); text(`⏳ 倒數: ${stageTimer}s`, width - 30, 30);
  pop();
}

function mousePressed() {
  if (gameState === "STAGE3" && targetBall) {
    let d = dist(mouseX, mouseY, targetBall.x, targetBall.y);
    if (d < targetBall.r) {
      stage3Score++;
      playAudioEffect('score');
      if (stage3Score >= stage3Target) {
        gameWin();
      } else {
        spawnTargetBall();
      }
    }
  }
}

// ==========================================
// 遊戲勝利與結束畫面
// ==========================================
function gameWin() {
  clearInterval(timerInterval);
  gameState = "WIN";
  playAudioEffect('win');

  gameContainer.style('display', 'flex');
  gameContainer.html('');

  let t = createP("🏆 恭喜通關總冠軍！");
  t.parent(gameContainer); t.addClass('game-title');

  let d = createP(`你成功通過了所有三關挑戰！<br>最終獲得總得分：<b>${score} 分</b>`);
  d.parent(gameContainer); d.addClass('game-desc');

  let rBtn = createButton("再玩一次");
  rBtn.parent(gameContainer);
  rBtn.addClass('game-ui-btn');
  rBtn.mousePressed(resetGame);
}

function gameOver(reason) {
  clearInterval(timerInterval);
  gameState = "GAMEOVER";
  playAudioEffect('gameover');

  gameContainer.style('display', 'flex');
  gameContainer.html('');

  let t = createP("💥 挑戰失敗！");
  t.parent(gameContainer); t.addClass('game-title');

  let d = createP(`${reason}<br>最終得分：<b>${score} 分</b>`);
  d.parent(gameContainer); d.addClass('game-desc');

  let rBtn = createButton("重新挑戰");
  rBtn.parent(gameContainer);
  rBtn.addClass('game-ui-btn');
  rBtn.mousePressed(resetGame);
}

function resetGame() {
  gameContainer.html('');
  titleP = createP("⚾ 兄弟棒球三關卡大冒險");
  titleP.parent(gameContainer); titleP.addClass('game-title');

  descP = createP("挑戰三大關卡：黃金接球 ➔ 知識問答 ➔ 全壘打特訓！準備好拿下總冠軍了嗎？");
  descP.parent(gameContainer); descP.addClass('game-desc');

  startBtn = createButton("開始闖關！");
  startBtn.parent(gameContainer);
  startBtn.addClass('game-ui-btn');
  startBtn.mousePressed(startStage1);
}

// ==========================================
// Web Audio API 音效引擎
// ==========================================
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playAudioEffect(type) {
  initAudio();
  let osc = audioCtx.createOscillator();
  let gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  let now = audioCtx.currentTime;

  if (type === 'score') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'hurt') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.25);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.start(now); osc.stop(now + 0.25);
  } else if (type === 'win') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.start(now); osc.stop(now + 0.45);
  } else if (type === 'gameover') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.start(now); osc.stop(now + 0.45);
  }
}