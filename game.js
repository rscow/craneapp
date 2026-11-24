const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const radiusReadout = document.getElementById("radius-readout");
const hookReadout = document.getElementById("hook-readout");
const sideReadout = document.getElementById("side-readout");
const loadStatus = document.getElementById("load-status");

context.imageSmoothingEnabled = false;

const crane = {
  radiusOffset: 100,
  hookHeight: 50,
};

const loads = [
  { id: "red", homeX: 180, homeY: 558, x: 180, y: 558, width: 72, height: 72, color: "#d85d42" },
  { id: "purple", homeX: 252, homeY: 606, x: 252, y: 606, width: 72, height: 24, color: "#8a69c7" },
  { id: "yellow", homeX: 330, homeY: 558, x: 330, y: 558, width: 72, height: 72, color: "#e6c84d" },
  { id: "blue", homeX: 252, homeY: 534, x: 252, y: 534, width: 72, height: 72, color: "#4d82c7" },
  { id: "green", homeX: 180, homeY: 486, x: 180, y: 486, width: 72, height: 72, color: "#65a85a" },
];

const targets = [
  { id: "red-target", x: 850, y: 410, width: 72, height: 28, loadId: "red", delivered: false },
  { id: "purple-target", x: 922, y: 410, width: 72, height: 28, loadId: "purple", delivered: false },
  { id: "yellow-target", x: 994, y: 410, width: 72, height: 28, loadId: "yellow", delivered: false },
  { id: "blue-target", x: 850, y: 310, width: 72, height: 28, loadId: "blue", delivered: false },
  { id: "green-target", x: 922, y: 310, width: 72, height: 28, loadId: "green", delivered: false },
];

let attachedLoad = null;

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
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    handleLoadAction();
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

function getCraneGeometry() {
  const mastX = 600;
  const armY = 88;
  const direction = crane.radiusOffset < 0 ? -1 : 1;
  const radiusDistance = direction * clamp(
    Math.abs(crane.radiusOffset),
    minRadius,
    maxRadius,
  );
  const trolleyX = mastX + radiusDistance * 3.2;
  const cableLength = 542 * (1 - crane.hookHeight / 100);

  return {
    mastX,
    armY,
    trolleyX,
    hookX: trolleyX,
    hookY: armY + cableLength,
  };
}

function intersectsLoad(load, hookX, hookY) {
  const pickupRect = {
    x: load.x + 16,
    y: load.y - 16,
    width: 40,
    height: 16,
  };

  return (
    hookX >= pickupRect.x &&
    hookX <= pickupRect.x + pickupRect.width &&
    hookY >= pickupRect.y &&
    hookY <= pickupRect.y + pickupRect.height
  );
}

function isInSuccessfulDropMargin(candidate) {
  if (!attachedLoad || candidate.delivered) return false;

  const { hookX, hookY } = getCraneGeometry();
  const attachedLoadBottom = hookY + 16 + attachedLoad.height;
  const horizontalMargin = 18;
  const verticalMargin = 12;
  const horizontalOverlap =
    hookX + attachedLoad.width / 2 + horizontalMargin >= candidate.x &&
    hookX - attachedLoad.width / 2 - horizontalMargin <= candidate.x + candidate.width;
  const alignedWithTop =
    Math.abs(attachedLoadBottom - candidate.y) <= verticalMargin;

  return (
    candidate.loadId === attachedLoad.id &&
    horizontalOverlap &&
    alignedWithTop
  );
}

function handleLoadAction() {
  const { hookX, hookY } = getCraneGeometry();

  if (attachedLoad) {
    const attachedLoadBottom = hookY + 16 + attachedLoad.height;
    const horizontalMargin = 18;
    const verticalMargin = 12;
    const target = targets.find((candidate) => {
      const horizontalOverlap =
        hookX + attachedLoad.width / 2 + horizontalMargin >= candidate.x &&
        hookX - attachedLoad.width / 2 - horizontalMargin <= candidate.x + candidate.width;
      const alignedWithTop =
        Math.abs(attachedLoadBottom - candidate.y) <= verticalMargin;

      return (
        !candidate.delivered &&
        candidate.loadId === attachedLoad.id &&
        horizontalOverlap &&
        alignedWithTop
      );
    });

    if (target) {
      target.delivered = true;
      attachedLoad.delivered = true;
      attachedLoad = null;
      loadStatus.textContent = "DELIVERY SUCCESS";
    } else {
      attachedLoad.x = attachedLoad.homeX;
      attachedLoad.y = attachedLoad.homeY;
      attachedLoad = null;
      loadStatus.textContent = "INCORRECT DROP";
    }
    return;
  }

  const load = loads.find((candidate) =>
    !candidate.delivered &&
    intersectsLoad(candidate, hookX, hookY)
  );

  if (load) {
    attachedLoad = load;
    loadStatus.textContent = "LOAD ATTACHED";
  } else {
    loadStatus.textContent = "NO LOAD UNDER HOOK";
  }
}

function drawBackground() {
  rect(0, 0, 1200, 720, "#79bce5");

  context.fillStyle = "#f7dfa0";
  context.fillRect(1040, 58, 72, 72);

  context.fillStyle = "#d5a55d";
  rect(0, 630, 1200, 90, "#d5a55d");
  context.fillStyle = "#9e7d4f";
  rect(0, 630, 1200, 8, "#9e7d4f");

  for (let x = 0; x < 1200; x += 48) {
    rect(x, 638, 24, 82, x % 96 === 0 ? "#b58a55" : "#c29b61");
  }
}

function drawBuilding() {
  rect(800, 258, 326, 372, "#b2b0a1");

  for (let floor = 258; floor < 630; floor += 72) {
    rect(800, floor, 326, 10, "#7d7e77");

    for (let column = 818; column < 1110; column += 92) {
      rect(column, floor + 14, 58, 30, "#31557d");
      rect(column + 10, floor + 20, 38, 18, "#78a8bd");
    }
  }

  rect(800, 244, 326, 14, "#ddbd70");
  rect(788, 228, 350, 16, "#8a6a44");
}

function drawStagingArea() {
  rect(150, 618, 280, 12, "#5f4b38");
  rect(150, 630, 280, 8, "#3c342d");
}

function drawTargets() {
  targets.forEach((target) => {
    const isReady = isInSuccessfulDropMargin(target);
    const targetColor = target.delivered ? "#65a85a" : isReady ? "#65d66d" : "#f4df84";
    const insetColor = target.delivered ? "#8ccc78" : isReady ? "#a6efa9" : "#fff1ad";

    rect(target.x, target.y, target.width, target.height, targetColor);
    rect(target.x + 12, target.y + 10, target.width - 24, 10, insetColor);
  });
}

function drawLoads() {
  loads.forEach((load) => {
    if (load.delivered || load === attachedLoad) return;
    rect(load.x, load.y, load.width, load.height, load.color);

    const topColors = {
      red: "#9e3e32",
      purple: "#604394",
      yellow: "#9f862d",
      blue: "#315b92",
      green: "#4b803f",
    };
    rect(load.x + 16, load.y - 16, 40, 16, topColors[load.id]);
  });

  if (attachedLoad) {
    const { hookX, hookY } = getCraneGeometry();
    rect(hookX - attachedLoad.width / 2, hookY + 16, attachedLoad.width, attachedLoad.height, attachedLoad.color);
  }
}

function drawCrane() {
  const { mastX, armY, trolleyX, hookX, hookY } = getCraneGeometry();
  const trolleyY = armY;
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

  rect(588, 76, 24, 554, "#e6e0b8");
  rect(570, armY, 60, 14, "#81755a");
  rect(594, 146, 12, 14, "#b14d3f");

  rect(armStartX, armY - 9, armWidth, 18, "#f3c64f");
  rect(armStartX, armY + 9, armWidth, 8, "#9a6f30");

  rect(trolleyX - 46, trolleyY - 10, 92, 20, "#c94f43");
  rect(trolleyX - 30, trolleyY + 10, 60, 12, "#7d3b34");
  rect(hookX - 4, trolleyY + 22, 8, Math.max(0, hookY - (trolleyY + 22)), "#27384a");
  rect(hookX - 12, hookY - 12, 24, 12, "#ffd56a");

  rect(0, 630, 600, 90, "#4d5e62");
  rect(0, 630, 430, 8, "#263840");
}

function drawLabels() {
  context.fillStyle = "#26384a";
  context.font = "bold 16px 'Courier New', monospace";
  context.fillText("STAGING", 266, 604);
  context.fillText("BUILDING", 926, 650);
}

function drawScene() {
  drawBackground();
  drawBuilding();
  drawStagingArea();
  drawTargets();
  drawLoads();
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
