const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const radiusReadout = document.getElementById("radius-readout");
const hookReadout = document.getElementById("hook-readout");
const sideReadout = document.getElementById("side-readout");

context.imageSmoothingEnabled = false;

const crane = {
  radiusOffset: 100,
  hookHeight: 50,
};

const keys = new Set();
const minRadius = 50;
const maxRadius = 150;
const minHookHeight = 0;
const maxHookHeight = 100;
let previousTime = performance.now();

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

window.addEventListener("blur", () => {
  keys.clear();
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function rect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawBackground() {
  rect(0, 0, 1200, 540, "#79bce5");

  context.fillStyle = "#f7dfa0";
  context.fillRect(1040, 58, 72, 72);

  context.fillStyle = "#d5a55d";
  context.fillRect(0, 450, 1200, 90);
  context.fillStyle = "#9e7d4f";
  context.fillRect(0, 450, 1200, 8);

  for (let x = 0; x < 1200; x += 48) {
    rect(x, 458, 24, 82, x % 96 === 0 ? "#b58a55" : "#c29b61");
  }
}

function drawBuilding() {
  rect(832, 282, 278, 168, "#b2b0a1");

  for (let floor = 282; floor < 450; floor += 56) {
    rect(832, floor, 278, 10, "#7d7e77");

    for (let column = 850; column < 1102; column += 84) {
      rect(column, floor + 14, 58, 30, "#31557d");
      rect(column + 10, floor + 20, 38, 18, "#78a8bd");
    }
  }

  rect(832, 268, 278, 14, "#ddbd70");
  rect(820, 252, 302, 16, "#8a6a44");
}

function drawStagingArea() {
  rect(250, 438, 270, 12, "#5f4b38");
  rect(250, 450, 270, 8, "#3c342d");

  rect(310, 382, 72, 56, "#d85d42");
  rect(326, 366, 40, 16, "#9e3e32");
  rect(370, 394, 72, 44, "#8a69c7");
  rect(386, 378, 40, 16, "#604394");
}

function drawTargets() {
  rect(882, 234, 72, 28, "#f4df84");
  rect(894, 244, 48, 10, "#fff1ad");

  rect(940, 234, 72, 28, "#f4df84");
  rect(952, 244, 48, 10, "#fff1ad");

  rect(940, 342, 72, 28, "#f4df84");
  rect(952, 352, 48, 10, "#fff1ad");
}

function drawCrane() {
  const mastX = 600;
  const armY = 124;
  const direction = crane.radiusOffset < 0 ? -1 : 1;
  const radiusDistance = direction * clamp(
    Math.abs(crane.radiusOffset),
    minRadius,
    maxRadius,
  );
  const trolleyX = mastX + radiusDistance * 3.2;
  const trolleyY = armY;
  const cableLength = 326 * (1 - crane.hookHeight / 100);
  const hookX = trolleyX;
  const hookY = trolleyY + cableLength;
  const armStartX = clamp(
    Math.min(mastX, trolleyX),
    mastX - maxRadius * 3.2,
    mastX,
  );
  const armEndX = clamp(
    Math.max(mastX, trolleyX),
    mastX,
    mastX + maxRadius * 3.2,
  );
  const armWidth = armEndX - armStartX;

  rect(588, 132, 24, 318, "#e6e0b8");
  rect(570, armY, 60, 14, "#81755a");
  rect(594, 146, 12, 14, "#b14d3f");

  rect(armStartX, armY - 9, armWidth, 18, "#f3c64f");
  rect(armStartX, armY + 9, armWidth, 8, "#9a6f30");

  rect(trolleyX - 46, trolleyY - 10, 92, 20, "#c94f43");
  rect(trolleyX - 30, trolleyY + 10, 60, 12, "#7d3b34");
  rect(hookX - 4, trolleyY + 22, 8, Math.max(0, hookY - (trolleyY + 22)), "#27384a");
  rect(hookX - 12, hookY - 12, 24, 12, "#ffd56a");

  rect(0, 450, 600, 90, "#4d5e62");
  rect(0, 450, 430, 8, "#263840");
}

function drawLabels() {
  context.fillStyle = "#26384a";
  context.font = "bold 16px 'Courier New', monospace";
  context.fillText("STAGING", 348, 424);
  context.fillText("BUILDING", 926, 460);
}

function drawScene() {
  drawBackground();
  drawBuilding();
  drawStagingArea();
  drawTargets();
  drawCrane();
  drawLabels();
}

function update(deltaSeconds) {
  const previousRadiusOffset = crane.radiusOffset;

  if (keys.has("ArrowLeft")) {
    crane.radiusOffset -= 25 * deltaSeconds;
  }
  if (keys.has("ArrowRight")) {
    crane.radiusOffset += 25 * deltaSeconds;
  }
  if (keys.has("ArrowUp")) {
    crane.hookHeight -= 35 * deltaSeconds;
  }
  if (keys.has("ArrowDown")) {
    crane.hookHeight += 35 * deltaSeconds;
  }

  if (
    crane.radiusOffset > -minRadius &&
    crane.radiusOffset < minRadius &&
    previousRadiusOffset !== 0
  ) {
    crane.radiusOffset =
      previousRadiusOffset > 0
        ? -minRadius
        : minRadius;
  }
  crane.radiusOffset = clamp(crane.radiusOffset, -maxRadius, maxRadius);
  crane.hookHeight = clamp(crane.hookHeight, minHookHeight, maxHookHeight);

  radiusReadout.textContent = `${Math.round(Math.abs(crane.radiusOffset))} ft`;
  hookReadout.textContent = `${Math.round(crane.hookHeight)}%`;
  sideReadout.textContent = crane.radiusOffset < 0 ? "LEFT" : "RIGHT";
}

function frame(currentTime) {
  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  update(deltaSeconds);
  drawScene();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
