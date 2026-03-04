const words = [
  { text: "AI", scale: 24 },
  { text: "assessment", scale: 22 },
  { text: "data", scale: 16 },
  { text: "essays", scale: 18 },
  { text: "human", scale: 16 },
  { text: "policy makers", scale: 15 },
  { text: "security", scale: 14 },
  { text: "water", scale: 12 },
  { text: "US", scale: 10 },
  { text: "UK", scale: 10 },
  { text: "systems", scale: 8 },
  { text: "dollars", scale: 4 }
];

const colorPairs = ["pair-1", "pair-2", "pair-3"];
let animationFrameId = null;

function pickFont(word) {
  if (["US", "UK", "dollars", "essays",""].includes(word)) {
    return "font-doric";
  }
  return "font-ionic";
}

function buildRows(list) {
  return [
    [list[0]],
    list.slice(2, 6),
    list.slice(7, 9),
    list.slice(9,12)
  ];
}

function renderBricks() {
  const board = document.getElementById("brick-board");
  if (!board) return;

  board.innerHTML = "";
  const rows = buildRows(words);
  const scaleValues = words.map((entry) => entry.scale);
  const minScale = Math.min(...scaleValues);
  const maxScale = Math.max(...scaleValues);
  const totalBricks = words.length;
  let brickIndex = 0;

  rows.forEach((rowWords, rowIndex) => {
    const row = document.createElement("div");
    row.className = `brick-row ${rowIndex % 2 === 1 ? "is-offset" : ""}`.trim();

    rowWords.forEach((entry, i) => {
      const brick = document.createElement("span");
      const pairClass = colorPairs[(rowIndex + i) % colorPairs.length];
      const fontClass = pickFont(entry.text);
      const t = (entry.scale - minScale) / (maxScale - minScale || 1);
      const stagger = totalBricks > 1 ? brickIndex / (totalBricks - 1) : 0;
      const delay = 0.5 + (brickIndex * 0.16) + (stagger * 0.24);
      const duration = 3.6 + (1 - t) * 1.8;
      const growFactor = 1 + (t * 0.2);

      brick.className = `word-brick ${pairClass} ${fontClass}`;
      brick.style.setProperty("--scale", String(entry.scale));
      brick.style.setProperty("--anim-scale", "1");
      brick.style.setProperty("--delay", `${delay.toFixed(2)}s`);
      brick.style.setProperty("--duration", `${duration.toFixed(2)}s`);
      brick.style.setProperty("--grow-factor", growFactor.toFixed(3));
      brick.dataset.delay = String(delay);
      brick.dataset.duration = String(duration);
      brick.dataset.growFactor = String(growFactor);
      brick.textContent = entry.text;
      row.appendChild(brick);
      brickIndex += 1;
    });

    board.appendChild(row);
  });
}

function animateBricks(nowMs) {
  const now = nowMs / 1000;
  const bricks = document.querySelectorAll(".word-brick");

  bricks.forEach((brick) => {
    const delay = Number(brick.dataset.delay || "0");
    const duration = Math.max(0.4, Number(brick.dataset.duration || "4"));
    const growFactor = Math.max(1, Number(brick.dataset.growFactor || "1.2"));
    const amplitude = growFactor - 1;
    let animScale = 1;

    if (now >= delay) {
      const elapsed = now - delay;
      const phase = elapsed / duration;
      const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      animScale = 1 + amplitude * wave;
    }

    brick.style.setProperty("--anim-scale", animScale.toFixed(4));
  });

  animationFrameId = window.requestAnimationFrame(animateBricks);
}

function startAnimationLoop() {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = window.requestAnimationFrame(animateBricks);
}

renderBricks();
startAnimationLoop();
window.addEventListener("resize", renderBricks);
