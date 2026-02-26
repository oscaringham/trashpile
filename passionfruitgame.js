const frameImg = document.getElementById("consoleFrame");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const spaceTouch = document.getElementById("spaceTouch");
const rTouch = document.getElementById("rTouch");

const frameDefault = "pf-console.png";
const frameSpace = "pf-console-space.png";
const frameR = "pf-console-r.png";

const GAME_DURATION_MS = 60000;
const GRAVITY = 1550;
const JUMP_VELOCITY = -620;
const OBSTACLE_SPEED = 270;

const skaterSprite = new Image();
skaterSprite.src = "skater.png";

let state = "idle";
let spaceHeld = false;
let rHeld = false;
let obstacleTimer = 0;
let gameStartTime = 0;
let lastFrameTime = 0;

const player = {
  x: 68,
  width: 58,
  height: 58,
  y: 0,
  velocityY: 0,
  grounded: true,
};

const obstacles = [];

function groundY() {
  return canvas.height - 44;
}

function resetPlayer() {
  player.y = groundY() - player.height;
  player.velocityY = 0;
  player.grounded = true;
}

function resetGame() {
  state = "idle";
  obstacleTimer = randomObstacleDelay();
  obstacles.length = 0;
  resetPlayer();
  gameStartTime = 0;
}

function startGame(now) {
  state = "running";
  gameStartTime = now;
  obstacleTimer = randomObstacleDelay();
}

function randomObstacleDelay() {
  return 0.75 + Math.random() * 0.8;
}

function spawnSoundwave() {
  const width = 38 + Math.floor(Math.random() * 16);
  const height = 56 + Math.floor(Math.random() * 30);
  obstacles.push({
    x: canvas.width + width,
    width,
    height,
  });
}

function jump() {
  if (!player.grounded || state !== "running") {
    return;
  }
  player.velocityY = JUMP_VELOCITY;
  player.grounded = false;
}

function updateFrameImage() {
  if (rHeld) {
    frameImg.src = frameR;
    return;
  }
  if (spaceHeld) {
    frameImg.src = frameSpace;
    return;
  }
  frameImg.src = frameDefault;
}

function pressSpace() {
  if (!spaceHeld) {
    spaceHeld = true;
    if (state === "idle") {
      startGame(performance.now());
    }
    jump();
  }
  updateFrameImage();
}

function releaseSpace() {
  spaceHeld = false;
  updateFrameImage();
}

function pressR() {
  if (!rHeld) {
    rHeld = true;
    resetGame();
  }
  updateFrameImage();
}

function releaseR() {
  rHeld = false;
  updateFrameImage();
}

function checkCollision(obstacle) {
  const playerLeft = player.x + 8;
  const playerRight = player.x + player.width - 8;
  const playerTop = player.y + 8;
  const playerBottom = player.y + player.height;

  const obstacleLeft = obstacle.x + 4;
  const obstacleRight = obstacle.x + obstacle.width - 4;
  const obstacleTop = groundY() - obstacle.height;
  const obstacleBottom = groundY();

  return (
    playerRight > obstacleLeft &&
    playerLeft < obstacleRight &&
    playerBottom > obstacleTop &&
    playerTop < obstacleBottom
  );
}

function update(deltaSeconds, now) {
  if (state !== "running") {
    return;
  }

  const elapsed = now - gameStartTime;
  if (elapsed >= GAME_DURATION_MS) {
    state = "won";
    return;
  }

  player.velocityY += GRAVITY * deltaSeconds;
  player.y += player.velocityY * deltaSeconds;

  const floor = groundY() - player.height;
  if (player.y >= floor) {
    player.y = floor;
    player.velocityY = 0;
    player.grounded = true;
  }

  obstacleTimer -= deltaSeconds;
  if (obstacleTimer <= 0) {
    spawnSoundwave();
    obstacleTimer = randomObstacleDelay();
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.x -= OBSTACLE_SPEED * deltaSeconds;

    if (checkCollision(obstacle)) {
      state = "crashed";
    }

    if (obstacle.x + obstacle.width < -12) {
      obstacles.splice(i, 1);
    }
  }
}

function drawSoundwave(obstacle) {
  const baseY = groundY();
  const leftX = obstacle.x;
  const rightX = obstacle.x + obstacle.width;
  const centerX = obstacle.x + obstacle.width * 0.5;
  const topY = baseY - obstacle.height;

  ctx.fillStyle = "#ff8a00";
  ctx.strokeStyle = "#ffb347";
  ctx.lineWidth = 2;

  // Draw a tall waveform "burst" shape as the obstacle.
  ctx.beginPath();
  ctx.moveTo(leftX, baseY);
  ctx.quadraticCurveTo(centerX - obstacle.width * 0.2, topY + obstacle.height * 0.3, centerX, topY);
  ctx.quadraticCurveTo(centerX + obstacle.width * 0.2, topY + obstacle.height * 0.3, rightX, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner lines for a stronger audio-wave look.
  for (let i = 1; i <= 3; i += 1) {
    const inset = i * 5;
    const waveTop = topY + i * 11;
    ctx.beginPath();
    ctx.moveTo(leftX + inset, baseY);
    ctx.quadraticCurveTo(centerX, waveTop, rightX - inset, baseY);
    ctx.stroke();
  }
}

function drawGroundWave(now) {
  const y = groundY() + 1;
  const t = now * 0.0045;

  ctx.strokeStyle = "#ff8a00";
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let x = 0; x <= canvas.width; x += 6) {
    const waveA = Math.sin(x * 0.055 + t) * 5.5;
    const waveB = Math.sin(x * 0.11 - t * 1.6) * 2.5;
    const waveY = y + waveA + waveB;
    if (x === 0) {
      ctx.moveTo(x, waveY);
    } else {
      ctx.lineTo(x, waveY);
    }
  }

  ctx.stroke();
}

function drawStatus() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px 'Courier New', monospace";
  ctx.textAlign = "left";

  if (state === "idle") {
    ctx.fillText("PRESS SPACE TO START", 20, 30);
    ctx.fillText("SPACE = JUMP", 20, 52);
    ctx.fillText("HOLD R TO RESTART", 20, 74);
  }

  if (state === "running") {
    const left = Math.max(0, GAME_DURATION_MS - (performance.now() - gameStartTime));
    const seconds = Math.ceil(left / 1000);
    ctx.fillText(`TIME: ${seconds}s`, 20, 30);
  }

  if (state === "crashed") {
    ctx.fillStyle = "#ff4f4f";
    ctx.fillText("CRASHED", 20, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PRESS R TO RESTART", 20, 52);
  }

  if (state === "won") {
    ctx.fillStyle = "#54ff8e";
    ctx.fillText("GAME COMPLETE", 20, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("YOU SURVIVED 60 SECONDS", 20, 52);
    ctx.fillText("PRESS R TO PLAY AGAIN", 20, 74);
  }
}

function render(now) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGroundWave(now);

  for (const obstacle of obstacles) {
    drawSoundwave(obstacle);
  }

  if (skaterSprite.complete) {
    ctx.drawImage(skaterSprite, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  drawStatus();
}

function tick(now) {
  if (!lastFrameTime) {
    lastFrameTime = now;
  }
  const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  update(deltaSeconds, now);
  render(now);
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    pressSpace();
  }

  if (event.code === "KeyR") {
    event.preventDefault();
    pressR();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    releaseSpace();
  }

  if (event.code === "KeyR") {
    event.preventDefault();
    releaseR();
  }
});

function bindTouchButton(button, press, release) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    press();
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    release();
  });

  button.addEventListener("pointercancel", () => {
    release();
  });

  button.addEventListener("pointerleave", () => {
    release();
  });
}

bindTouchButton(spaceTouch, pressSpace, releaseSpace);
bindTouchButton(rTouch, pressR, releaseR);

resetGame();
updateFrameImage();
requestAnimationFrame(tick);
